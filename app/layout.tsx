import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mukhmall-69wnwkoh.manus.space";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "The Mukhmall Show | Real Stories. Deep Impact.",
    template: "%s | The Mukhmall Show",
  },
  description: "The Mukhmall Show by Ankit Singh — short videos, real stories, creator work, and thoughtful ideas that make you stop, feel, and think.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "The Mukhmall Show",
    title: "The Mukhmall Show | Real Stories. Deep Impact.",
    description: "Short videos, real stories, and creative work by Ankit Singh.",
    images: [{ url: "/manus-storage/mukhmall-hero_c1248414.png", width: 1200, height: 630, alt: "The Mukhmall Show studio visual" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Mukhmall Show | Real Stories. Deep Impact.",
    description: "Short videos, real stories, and creative work by Ankit Singh.",
    images: ["/manus-storage/mukhmall-hero_c1248414.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Ankit Singh",
    url: siteUrl,
    jobTitle: "Content Creator and Website Developer",
    brand: { "@type": "Brand", name: "The Mukhmall Show" },
    sameAs: ["https://www.youtube.com/@TheMukhmalShow"],
  };

  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
