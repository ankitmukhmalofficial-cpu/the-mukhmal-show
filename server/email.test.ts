import { describe, expect, it } from "vitest";
import nodemailer from "nodemailer";

describe("Gmail SMTP configuration", () => {
  it("authenticates the configured App Password without sending mail", async () => {
    const appPassword = process.env.GMAIL_SMTP_APP_PASSWORD?.replace(/\s/g, "");
    expect(appPassword).toBeTruthy();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ankit.mukhmal.official@gmail.com",
        pass: appPassword,
      },
    });

    await expect(transporter.verify()).resolves.toBe(true);
    transporter.close();
  }, 20_000);
});
