import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

let approvedRows = [{ id: 17, name: "Real Customer", projectType: "Business website", message: "Genuine feedback submitted by a test boundary.", rating: 5, createdAt: new Date() }];
const deleteFeedbackMock = vi.fn(async (id: number) => {
  approvedRows = approvedRows.filter((row) => row.id !== id);
  return { deleted: true as const };
});

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, listApprovedFeedback: vi.fn(async () => approvedRows), deleteFeedback: deleteFeedbackMock };
});

const { appRouter } = await import("./routers");

function context(role: "admin" | "user"): TrpcContext {
  return {
    user: { id: 1, openId: "feedback-owner", email: "owner@example.com", name: "Owner", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("feedback deletion public visibility", () => {
  it("removes an approved feedback item from the public query after owner deletion", async () => {
    const owner = appRouter.createCaller(context("admin"));
    const publicBefore = await appRouter.createCaller(context("user")).stories.approvedFeedback();
    expect(publicBefore).toHaveLength(1);
    await owner.admin.deleteFeedback({ id: 17 });
    const publicAfter = await appRouter.createCaller(context("user")).stories.approvedFeedback();
    expect(publicAfter).toHaveLength(0);
    expect(deleteFeedbackMock).toHaveBeenCalledWith(17);
  });
});
