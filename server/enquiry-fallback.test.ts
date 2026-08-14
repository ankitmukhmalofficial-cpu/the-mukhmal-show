import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const createWebsiteEnquiryMock = vi.fn().mockResolvedValue({ created: true });
const hasWebsiteEnquiryMock = vi.fn().mockResolvedValue(false);
const sendWebsiteEnquiryEmailMock = vi.fn().mockRejectedValue(new Error("SMTP unavailable"));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, createWebsiteEnquiry: createWebsiteEnquiryMock, hasWebsiteEnquiry: hasWebsiteEnquiryMock };
});

vi.mock("./email", () => ({ sendWebsiteEnquiryEmail: sendWebsiteEnquiryEmailMock }));

const { appRouter } = await import("./routers");

function context(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("enquiry email fallback", () => {
  it("saves a valid enquiry when SMTP notification fails", async () => {
    const result = await appRouter.createCaller(context()).enquiries.create({
      name: "Ankit Singh",
      phone: "9876543210",
      websiteType: "Business website",
      budget: "₹3,000 – ₹7,500",
      website: "",
    });

    expect(result).toEqual({ success: true, emailSent: false });
    expect(createWebsiteEnquiryMock).toHaveBeenCalledWith(expect.objectContaining({ phoneLast4: "3210", websiteType: "Business website" }));
    expect(sendWebsiteEnquiryEmailMock).toHaveBeenCalledTimes(1);
  });
});
