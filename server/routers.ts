import { COOKIE_NAME } from "@shared/const";
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createCustomerFeedback, createStory, createWebsiteEnquiry, deleteFeedback, deleteWebsiteEnquiry, getAdminOverview, getFeedbackRatingSummary, getPublishedStoryBySlug, hasWebsiteEnquiry, listAllFeedback, listAllStories, listApprovedFeedback, listPublishedStories, moderateFeedback, recordSiteVisit, recordVideoClick, updateStory, updateStoryStatus, updateWebsiteEnquiryStatus, upsertYoutubeVideo } from "./db";
import { sendWebsiteEnquiryEmail } from "./email";
import { TRPCError } from "@trpc/server";
import { getYoutubeChannelStats, syncPublicYoutubeFeed } from "./youtube";
import { storagePut } from "./storage";

const pendingPhones = new Set<string>();
const websiteTypes = ["Business website", "Portfolio website", "Online shop", "Creator website", "Other"] as const;
const budgetTypes = ["₹3,000 – ₹7,500", "₹7,500 – ₹15,000", "₹15,000+", "Not sure yet"] as const;

const youtubeVideoInput = z.object({
  youtubeId: z.string().trim().min(6).max(32),
  title: z.string().trim().min(2).max(500),
  thumbnailUrl: z.string().url(),
  videoType: z.enum(["video", "short"]),
  youtubeViewCount: z.number().int().nonnegative().default(0),
  publishedAt: z.coerce.date().optional(),
});

const storyImageUrl = z.string().trim().max(2_000).refine((value) => value.startsWith("/manus-storage/") || /^https:\/\/[^\s]+$/i.test(value), "Use a secure image URL or uploaded storage path");

const storyInput = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase hyphenated slug").max(160),
  title: z.string().trim().min(5).max(180),
  excerpt: z.string().trim().min(20).max(500),
  content: z.string().trim().min(80).max(20_000),
  category: z.string().trim().min(2).max(60),
  coverImageUrl: storyImageUrl.optional().nullable(),
  status: z.enum(["draft", "published"]).default("draft"),
});

const storyImageUploadInput = z.object({
  fileName: z.string().trim().min(1).max(120),
  dataUrl: z.string().regex(/^data:image\/(jpeg|png|webp|avif);base64,[A-Za-z0-9+/=]+$/, "Only JPEG, PNG, WebP, or AVIF images are supported").max(7_000_000),
});

const feedbackInput = z.object({
  name: z.string().trim().min(2).max(120),
  projectType: z.string().trim().max(80).optional(),
  message: z.string().trim().min(20).max(2_000),
  rating: z.number().int().min(1).max(5).optional(),
});

export const enquiryInput = z.object({
  name: z.string().trim().min(2, "Name is required").max(80).regex(/^[\p{L}][\p{L}\p{M} .'-]{1,79}$/u, "Enter a valid name"),
  phone: z.string().trim().regex(/^(?:\+?91[-\s]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  websiteType: z.enum(websiteTypes),
  budget: z.enum(budgetTypes),
  website: z.string().trim().max(120).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  stories: router({
    list: publicProcedure.query(() => listPublishedStories()),
    bySlug: publicProcedure.input(z.object({ slug: z.string().trim().min(1).max(160) })).query(({ input }) => getPublishedStoryBySlug(input.slug)),
    approvedFeedback: publicProcedure.query(() => listApprovedFeedback()),
    ratingSummary: publicProcedure.query(() => getFeedbackRatingSummary()),
    submitFeedback: publicProcedure.input(feedbackInput).mutation(({ input }) => createCustomerFeedback({ ...input, status: "pending" })),
  }),
  youtube: router({
    stats: publicProcedure.query(() => getYoutubeChannelStats()),
  }),
  analytics: router({
    visit: protectedProcedure.input(z.object({ path: z.string().trim().min(1).max(255), userAgent: z.string().trim().max(255).optional() })).mutation(({ ctx, input }) => {
      const identityHash = createHash("sha256").update(ctx.user.openId).digest("hex");
      return recordSiteVisit({ ...input, userOpenId: ctx.user.openId, visitorHash: identityHash });
    }),
    videoClick: protectedProcedure.input(z.object({ youtubeId: z.string().trim().min(6).max(32) })).mutation(({ ctx, input }) => {
      const identityHash = createHash("sha256").update(ctx.user.openId).digest("hex");
      return recordVideoClick({ youtubeId: input.youtubeId, visitorHash: identityHash });
    }),
  }),
  admin: router({
    overview: adminProcedure.query(() => getAdminOverview()),
    saveYoutubeVideo: adminProcedure.input(youtubeVideoInput).mutation(({ input }) => upsertYoutubeVideo(input)),
    syncYoutube: adminProcedure.mutation(() => syncPublicYoutubeFeed()),
    stories: adminProcedure.query(() => listAllStories()),
    feedback: adminProcedure.query(() => listAllFeedback()),
    createStory: adminProcedure.input(storyInput).mutation(({ input }) => createStory({ ...input, coverImageUrl: input.coverImageUrl ?? null, publishedAt: input.status === "published" ? new Date() : null })),
    uploadStoryImage: adminProcedure.input(storyImageUploadInput).mutation(async ({ input }) => {
      const match = input.dataUrl.match(/^data:(image\/(?:jpeg|png|webp|avif));base64,(.+)$/);
      if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported image format." });
      const contentType = match[1];
      const bytes = Buffer.from(match[2], "base64");
      if (bytes.length > 5 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Image must be 5 MB or smaller." });
      const extension = contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1];
      const uploaded = await storagePut(`stories/${Date.now()}-${input.fileName.replace(/[^a-z0-9._-]/gi, "-")}.${extension}`, bytes, contentType);
      return { url: uploaded.url } as const;
    }),
    updateStory: adminProcedure.input(storyInput.extend({ id: z.number().int().positive() })).mutation(({ input }) => updateStory(input.id, { slug: input.slug, title: input.title, excerpt: input.excerpt, content: input.content, category: input.category, coverImageUrl: input.coverImageUrl })),
    setStoryStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["draft", "published"]) })).mutation(({ input }) => updateStoryStatus(input.id, input.status)),
    moderateFeedback: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["approved", "rejected"]) })).mutation(({ input }) => moderateFeedback(input.id, input.status)),
    deleteFeedback: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteFeedback(input.id)),
    deleteEnquiry: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteWebsiteEnquiry(input.id)),
    setEnquiryStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "reviewed", "archived"]) })).mutation(({ input }) => updateWebsiteEnquiryStatus(input.id, input.status)),
  }),
  enquiries: router({
    create: publicProcedure.input(enquiryInput).mutation(async ({ input }) => {
      if (input.website) return { success: true } as const;

      const normalizedPhone = input.phone.replace(/\D/g, "").replace(/^91/, "").slice(-10);
      const phoneHash = createHash("sha256").update(normalizedPhone).digest("hex");
      const phoneLast4 = normalizedPhone.slice(-4);

      if (pendingPhones.has(phoneHash) || await hasWebsiteEnquiry(phoneHash)) {
        throw new TRPCError({ code: "CONFLICT", message: "This mobile number has already sent an enquiry." });
      }

      pendingPhones.add(phoneHash);
      try {
        await createWebsiteEnquiry({ name: input.name, phoneHash, phoneLast4, websiteType: input.websiteType, budget: input.budget });
        try {
          await sendWebsiteEnquiryEmail({ name: input.name, phone: input.phone, websiteType: input.websiteType, budget: input.budget });
          return { success: true, emailSent: true } as const;
        } catch (emailError) {
          console.error("[Enquiry] Email notification failed; enquiry was saved:", emailError);
          return { success: true, emailSent: false } as const;
        }
      } catch (error) {
        console.error("[Enquiry] Failed to save:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Enquiry could not be saved right now. Please try again later." });
      } finally {
        pendingPhones.delete(phoneHash);
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
