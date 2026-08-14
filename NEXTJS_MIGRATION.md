# Next.js SEO Migration Plan

## Goal

Move the public Mukhmall Show experience to a Next.js App Router structure so the homepage, future Stories, Videos, Shorts, Portfolio, About, and Blog pages can render meaningful HTML on the server and expose complete metadata to search engines and social crawlers.

## Preservation requirements

The migration must preserve the existing Black-Tie Broadcast visual system, compact animated mobile navbar, dark/light mode, YouTube-linked video cards, Ankit Singh service portfolio, ₹3,000 starting package, and the enquiry flow that blocks repeat submissions from the same mobile number.

## SEO foundation

The Next.js app will use route-level `metadata` or `generateMetadata` for titles, descriptions, canonical URLs, Open Graph images, Twitter cards, and Hindi/English keywords. It will include `app/sitemap.ts`, `app/robots.ts`, semantic headings, crawlable content routes, JSON-LD for the personal brand and website-service offering, and stable URLs for future blog posts and video detail pages.

## Backend boundary

The existing Node.js, database, and Gmail SMTP capabilities remain server-only. In the Next.js version, the enquiry handler will live in a server route or server action, using the same validation, honeypot, normalized phone hash, unique database constraint, and private Gmail App Password. No SMTP secret will be placed in client bundles.

## Deployment

The deployed service must provide a Node.js runtime. Render can host the Next.js application with `npm run build` followed by `npm start`; the Gmail App Password and database connection must be added as private environment variables in Render. The current managed deployment remains the rollback target until the Next.js build and production smoke tests pass.

## Migration sequence

1. Create the Next.js shell and metadata foundation.
2. Port the existing homepage sections and responsive navigation.
3. Port YouTube/video links and portfolio/enquiry UI.
4. Move the enquiry handler and duplicate protection behind a server-only route.
5. Validate raw HTML, metadata, sitemap, robots, mobile behavior, form errors, and production deployment.
