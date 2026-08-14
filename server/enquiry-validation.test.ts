import { describe, expect, it } from "vitest";
import { enquiryInput } from "./routers";

describe("website enquiry validation", () => {
  const valid = { name: "Ankit Singh", phone: "9876543210", websiteType: "Business website" as const, budget: "₹3,000 – ₹7,500" as const, website: "" };

  it("accepts a valid enquiry", () => {
    expect(enquiryInput.parse(valid).name).toBe("Ankit Singh");
  });

  it("rejects invalid names and mobile numbers", () => {
    expect(() => enquiryInput.parse({ ...valid, name: "@@" })).toThrow();
    expect(() => enquiryInput.parse({ ...valid, phone: "12345" })).toThrow();
  });

  it("rejects values outside the allowed website and budget options", () => {
    expect(() => enquiryInput.parse({ ...valid, websiteType: "Unknown" })).toThrow();
    expect(() => enquiryInput.parse({ ...valid, budget: "Free" })).toThrow();
  });

  it("allows the hidden honeypot field to be inspected server-side", () => {
    expect(enquiryInput.parse({ ...valid, website: "" }).website).toBe("");
  });
});
