import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const ctx = {
  user: null,
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
} as TrpcContext;

describe("enquiries.create", () => {
  it("silently accepts the honeypot path without sending email", async () => {
    const result = await appRouter.createCaller(ctx).enquiries.create({
      name: "Bot",
      phone: "9876543210",
      websiteType: "Business website",
      budget: "₹3,000 – ₹7,500",
      website: "filled-by-bot",
    });
    expect(result).toEqual({ success: true });
  });

  it("rejects invalid mobile numbers before delivery", async () => {
    await expect(appRouter.createCaller(ctx).enquiries.create({
      name: "Ankit",
      phone: "123",
      websiteType: "Business website",
      budget: "₹3,000 – ₹7,500",
      website: "",
    })).rejects.toThrow();
  });
});
