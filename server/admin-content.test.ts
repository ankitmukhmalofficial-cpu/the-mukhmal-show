import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("owner content management contract", () => {
  it("exposes protected story editing and publishing procedures", () => {
    const procedures = (appRouter as any)._def.procedures;
    expect(procedures["admin.updateStory"] ?? procedures.updateStory).toBeDefined();
    expect(procedures["admin.setStoryStatus"] ?? procedures.setStoryStatus).toBeDefined();
  });

  it("exposes protected feedback moderation and enquiry-management procedures", () => {
    const procedures = (appRouter as any)._def.procedures;
    expect(procedures["admin.moderateFeedback"] ?? procedures.moderateFeedback).toBeDefined();
    expect(procedures["admin.setEnquiryStatus"] ?? procedures.setEnquiryStatus).toBeDefined();
    expect(procedures["admin.deleteEnquiry"] ?? procedures.deleteEnquiry).toBeDefined();
  });
});
