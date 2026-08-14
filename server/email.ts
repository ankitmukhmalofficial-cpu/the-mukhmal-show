import nodemailer from "nodemailer";

const recipient = "ankit.mukhmal.official@gmail.com";

export type WebsiteEnquiryEmail = {
  name: string;
  phone: string;
  websiteType: string;
  budget: string;
};

export async function sendWebsiteEnquiryEmail(input: WebsiteEnquiryEmail) {
  const appPassword = process.env.GMAIL_SMTP_APP_PASSWORD;
  if (!appPassword) {
    throw new Error("GMAIL_SMTP_APP_PASSWORD is not configured");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: recipient,
      pass: appPassword.replace(/\s/g, ""),
    },
  });

  await transporter.sendMail({
    from: `Mukhmall Website <${recipient}>`,
    to: recipient,
    subject: `New website enquiry — ${input.name}`,
    text: [
      "New website enquiry",
      "",
      `Name: ${input.name}`,
      `Mobile: ${input.phone}`,
      `Website type: ${input.websiteType}`,
      `Budget: ${input.budget}`,
      "",
      "Submitted through The Mukhmall Show website.",
    ].join("\n"),
  });
}
