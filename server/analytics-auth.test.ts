import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const recordSiteVisitMock = vi.fn().mockResolvedValue({ recorded: true, unique: true });
const recordVideoClickMock = vi.fn().mockResolvedValue({ recorded: true });

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, recordSiteVisit: recordSiteVisitMock, recordVideoClick: recordVideoClickMock };
});

const { appRouter } = await import("./routers");

function context(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const member = { id: 4, openId: "stable-member-open-id", email: "member@example.com", name: "Member", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

describe("authenticated analytics", () => {
  it("requires login and rejects client-supplied visitor identity", async () => {
    const unauthenticated = appRouter.createCaller(context(null));
    await expect(unauthenticated.analytics.visit({ path: "/", userAgent: "test" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(unauthenticated.analytics.videoClick({ youtubeId: "video-123" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("derives a stable server-side identity for repeat visits and clicks", async () => {
    const caller = appRouter.createCaller(context(member));
    await caller.analytics.visit({ path: "/" });
    await caller.analytics.visit({ path: "/stories" });
    await caller.analytics.videoClick({ youtubeId: "video-123" });

    expect(recordSiteVisitMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ userOpenId: member.openId, path: "/" }));
    expect(recordSiteVisitMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ userOpenId: member.openId, path: "/stories" }));
    expect(recordSiteVisitMock.mock.calls[0][0].visitorHash).toBe(recordSiteVisitMock.mock.calls[1][0].visitorHash);
    expect(recordVideoClickMock).toHaveBeenCalledWith(expect.objectContaining({ visitorHash: recordSiteVisitMock.mock.calls[0][0].visitorHash, youtubeId: "video-123" }));
  });
});
