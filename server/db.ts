import { and, count, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { CustomerFeedback, InsertCustomerFeedback, InsertStory, InsertUser, InsertWebsiteEnquiry, InsertYoutubeVideo, customerFeedback, siteVisits, stories, users, videoClicks, websiteEnquiries, youtubeVideos } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function hasWebsiteEnquiry(phoneHash: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: websiteEnquiries.id }).from(websiteEnquiries).where(eq(websiteEnquiries.phoneHash, phoneHash)).limit(1);
  return rows.length > 0;
}

export async function createWebsiteEnquiry(input: InsertWebsiteEnquiry) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(websiteEnquiries).values(input);
  return { created: true } as const;
}

export async function deleteWebsiteEnquiry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(websiteEnquiries).where(eq(websiteEnquiries.id, id));
  return { deleted: true } as const;
}

export async function updateWebsiteEnquiryStatus(id: number, status: "new" | "reviewed" | "archived") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(websiteEnquiries).set({ status }).where(eq(websiteEnquiries.id, id));
  return { updated: true } as const;
}

export async function recordSiteVisit(input: { visitorHash: string; userOpenId: string; path: string; userAgent?: string }) {
  const db = await getDb();
  if (!db) return { recorded: false, unique: false } as const;
  const existing = await db.select({ id: siteVisits.id }).from(siteVisits).where(eq(siteVisits.userOpenId, input.userOpenId)).limit(1);
  if (existing.length > 0) return { recorded: false, unique: false } as const;
  await db.insert(siteVisits).values(input);
  return { recorded: true, unique: true } as const;
}

export async function recordVideoClick(input: { youtubeId: string; visitorHash: string }) {
  const db = await getDb();
  if (!db) return { recorded: false } as const;
  await db.insert(videoClicks).values(input);
  await db.update(youtubeVideos).set({ websiteClickCount: sql`${youtubeVideos.websiteClickCount} + 1` }).where(eq(youtubeVideos.youtubeId, input.youtubeId));
  return { recorded: true } as const;
}

export async function getAdminOverview() {
  const db = await getDb();
  if (!db) return { visitors: 0, clicks: 0, videos: [], enquiries: [] };
  const [visitorRows, clickRows, videos, enquiries] = await Promise.all([
    db.select({ total: count() }).from(siteVisits),
    db.select({ total: count() }).from(videoClicks),
    db.select().from(youtubeVideos).orderBy(desc(youtubeVideos.publishedAt), desc(youtubeVideos.lastSyncedAt)).limit(100),
    db.select({ id: websiteEnquiries.id, name: websiteEnquiries.name, phoneLast4: websiteEnquiries.phoneLast4, websiteType: websiteEnquiries.websiteType, budget: websiteEnquiries.budget, status: websiteEnquiries.status, createdAt: websiteEnquiries.createdAt }).from(websiteEnquiries).orderBy(desc(websiteEnquiries.createdAt)).limit(50),
  ]);
  return { visitors: Number(visitorRows[0]?.total ?? 0), clicks: Number(clickRows[0]?.total ?? 0), videos, enquiries };
}

export async function listPublishedStories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stories).where(eq(stories.status, "published")).orderBy(desc(stories.publishedAt), desc(stories.createdAt));
}

export async function getPublishedStoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(stories).where(and(eq(stories.slug, slug), eq(stories.status, "published"))).limit(1);
  return rows[0];
}

export async function listAllStories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stories).orderBy(desc(stories.updatedAt));
}

export async function createStory(input: InsertStory) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(stories).values(input);
  return { created: true } as const;
}

export async function updateStory(id: number, input: { slug: string; title: string; excerpt: string; content: string; category: string; coverImageUrl?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(stories).set(input).where(eq(stories.id, id));
  return { updated: true } as const;
}

export async function updateStoryStatus(id: number, status: "draft" | "published") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(stories).set({ status, publishedAt: status === "published" ? new Date() : null }).where(eq(stories.id, id));
  return { updated: true } as const;
}

export async function createCustomerFeedback(input: InsertCustomerFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(customerFeedback).values(input);
  return { created: true } as const;
}

export async function listApprovedFeedback() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: customerFeedback.id, name: customerFeedback.name, projectType: customerFeedback.projectType, message: customerFeedback.message, rating: customerFeedback.rating, createdAt: customerFeedback.createdAt }).from(customerFeedback).where(eq(customerFeedback.status, "approved")).orderBy(desc(customerFeedback.approvedAt), desc(customerFeedback.createdAt));
}

export async function listAllFeedback() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customerFeedback).orderBy(desc(customerFeedback.createdAt));
}

export async function getFeedbackRatingSummary() {
  const db = await getDb();
  if (!db) return { average: 0, count: 0 };
  const rows = await db.select({ rating: customerFeedback.rating }).from(customerFeedback).where(eq(customerFeedback.status, "approved"));
  const ratedRows = rows.filter((r) => r.rating !== null && r.rating !== undefined);
  if (ratedRows.length === 0) return { average: 0, count: 0 };
  const sum = ratedRows.reduce((acc, r) => acc + (r.rating ?? 0), 0);
  return { average: Number((sum / ratedRows.length).toFixed(1)), count: ratedRows.length };
}

export async function moderateFeedback(id: number, status: "approved" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(customerFeedback).set({ status, approvedAt: status === "approved" ? new Date() : null }).where(eq(customerFeedback.id, id));
  return { updated: true } as const;
}

export async function deleteFeedback(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(customerFeedback).where(eq(customerFeedback.id, id));
  return { deleted: true } as const;
}

export async function upsertYoutubeVideo(input: InsertYoutubeVideo) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(youtubeVideos).values(input).onDuplicateKeyUpdate({
    set: {
      title: input.title,
      thumbnailUrl: input.thumbnailUrl,
      videoType: input.videoType,
      youtubeViewCount: input.youtubeViewCount,
      publishedAt: input.publishedAt,
      lastSyncedAt: new Date(),
    },
  });
  return { saved: true } as const;
}
