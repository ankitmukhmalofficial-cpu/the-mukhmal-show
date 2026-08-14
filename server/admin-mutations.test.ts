import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const updateStoryMock = vi.fn().mockResolvedValue({ updated: true });
const moderateFeedbackMock = vi.fn().mockResolvedValue({ updated: true });
const deleteFeedbackMock = vi.fn().mockResolvedValue({ deleted: true });
const updateWebsiteEnquiryStatusMock = vi.fn().mockResolvedValue({ updated: true });
const deleteWebsiteEnquiryMock = vi.fn().mockResolvedValue({ deleted: true });
const storagePutMock = vi.fn().mockResolvedValue({ key: "stories/test.jpg", url: "/manus-storage/stories/test.jpg" });

vi.mock("./storage", () => ({ storagePut: storagePutMock }));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, updateStory: updateStoryMock, moderateFeedback: moderateFeedbackMock, deleteFeedback: deleteFeedbackMock, updateWebsiteEnquiryStatus: updateWebsiteEnquiryStatusMock, deleteWebsiteEnquiry: deleteWebsiteEnquiryMock };
});

const { appRouter } = await import("./routers");

type Role = "admin" | "user";
function context(role: Role): TrpcContext {
  return {
    user: { id: 1, openId: "test-owner", email: "owner@example.com", name: "Owner", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("admin content mutations", () => {
  it("updates an existing story through the protected procedure", async () => {
    const result = await appRouter.createCaller(context("admin")).admin.updateStory({ id: 1, slug: "updated-story", title: "Updated title", excerpt: "A sufficiently long story excerpt for validation.", content: "This is sufficiently long original story content that passes the protected update validation rules for the admin workflow.", category: "Motivation", status: "published" });
    expect(result).toEqual({ updated: true });
    expect(updateStoryMock).toHaveBeenCalledWith(1, expect.objectContaining({ slug: "updated-story", title: "Updated title" }));
  });

  it("uploads a validated story image for an owner and rejects non-admin access", async () => {
    const owner = appRouter.createCaller(context("admin"));
    const result = await owner.admin.uploadStoryImage({ fileName: "cover.jpg", dataUrl: "data:image/jpeg;base64,SGVsbG8=" });
    expect(result).toEqual({ url: "/manus-storage/stories/test.jpg" });
    expect(storagePutMock).toHaveBeenCalledWith(expect.stringContaining("stories/"), expect.any(Buffer), "image/jpeg");
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.admin.uploadStoryImage({ fileName: "cover.jpg", dataUrl: "data:image/jpeg;base64,SGVsbG8=" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("moderates feedback through the protected procedure", async () => {
    const owner = appRouter.createCaller(context("admin"));
    const approved = await owner.admin.moderateFeedback({ id: 2, status: "approved" });
    const rejected = await owner.admin.moderateFeedback({ id: 3, status: "rejected" });
    expect(approved).toEqual({ updated: true });
    expect(rejected).toEqual({ updated: true });
    expect(moderateFeedbackMock).toHaveBeenNthCalledWith(1, 2, "approved");
    expect(moderateFeedbackMock).toHaveBeenNthCalledWith(2, 3, "rejected");
  });

  it("allows an owner to delete feedback", async () => {
    const owner = appRouter.createCaller(context("admin"));
    expect(await owner.admin.deleteFeedback({ id: 6 })).toEqual({ deleted: true });
    expect(deleteFeedbackMock).toHaveBeenCalledWith(6);
  });

  it("allows an owner to update and delete an enquiry", async () => {
    const owner = appRouter.createCaller(context("admin"));
    expect(await owner.admin.setEnquiryStatus({ id: 4, status: "reviewed" })).toEqual({ updated: true });
    expect(await owner.admin.deleteEnquiry({ id: 4 })).toEqual({ deleted: true });
    expect(updateWebsiteEnquiryStatusMock).toHaveBeenCalledWith(4, "reviewed");
    expect(deleteWebsiteEnquiryMock).toHaveBeenCalledWith(4);
  });

  it("preserves a story cover image during owner updates", async () => {
    const owner = appRouter.createCaller(context("admin"));
    await owner.admin.updateStory({ id: 1, slug: "updated-story", title: "Updated title", excerpt: "A sufficiently long story excerpt for validation.", content: "This is sufficiently long original story content that passes the protected update validation rules for the admin workflow.", category: "Motivation", coverImageUrl: "/manus-storage/stories/test.jpg", status: "published" });
    expect(updateStoryMock).toHaveBeenCalledWith(1, expect.objectContaining({ coverImageUrl: "/manus-storage/stories/test.jpg" }));
  });

  it("rejects non-admin access to story updates and moderation", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.admin.updateStory({ id: 1, slug: "updated-story", title: "Updated title", excerpt: "A sufficiently long story excerpt for validation.", content: "This is sufficiently long original story content that passes the protected update validation rules for the admin workflow.", category: "Motivation", status: "published" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.moderateFeedback({ id: 2, status: "rejected" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.deleteFeedback({ id: 6 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.setEnquiryStatus({ id: 4, status: "archived" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.deleteEnquiry({ id: 4 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
