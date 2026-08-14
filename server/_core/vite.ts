import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { type Server } from "http";
import express, { type Express } from "express";
import { nanoid } from "nanoid";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

type HeadMeta = { title: string; description: string; canonicalPath: string; ogImage: string; notFound?: boolean };
type RenderResult = { html: string; dehydratedState: string; head: HeadMeta };
type RenderModule = { render: (url: string) => Promise<RenderResult> };

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));

function buildHeadTags(head: HeadMeta, origin: string) {
  const canonical = new URL(head.canonicalPath || "/", origin).toString();
  const image = new URL(head.ogImage, origin).toString();
  return [
    `<title>${escapeHtml(head.title)}</title>`,
    `<meta name="description" content="${escapeHtml(head.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(head.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(head.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:site_name" content="The Mukhmall Show" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(head.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(head.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: "Ankit Singh", url: origin, jobTitle: "Content Creator and Website Developer", sameAs: ["https://www.youtube.com/@TheMukhmalShow"] })}</script>`,
  ].join("\n");
}

function composeHtml(template: string, result: RenderResult, origin: string) {
  const stateScript = `<script>window.__RQ_STATE__=${JSON.stringify(result.dehydratedState)};</script>`;
  return template
    .replace("<!--app-head-->", () => buildHeadTags(result.head, origin))
    .replace("<!--app-html-->", () => result.html)
    .replace("</body>", () => `${stateScript}</body>`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({ ...viteConfig, configFile: false, server: { middlewareMode: true, hmr: { server }, allowedHosts: true }, appType: "custom" });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    try {
      const templatePath = path.resolve(import.meta.dirname, "../..", "client", "index.html");
      let template = await fs.promises.readFile(templatePath, "utf-8");
      template = template.replace("/src/entry-client.tsx", `/src/entry-client.tsx?v=${nanoid()}`);
      const page = await vite.transformIndexHtml(req.originalUrl, template);
      const { render } = await vite.ssrLoadModule("/src/entry-server.tsx") as RenderModule;
      const result = await render(req.originalUrl);
      const origin = `${req.protocol}://${req.get("host")}`;
      res.status(result.head.notFound ? 404 : 200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).end(composeHtml(page, result, origin));
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  app.use(express.static(distPath, { index: false, redirect: false }));
  app.use("*", async (req, res, next) => {
    try {
      const template = await fs.promises.readFile(path.join(distPath, "index.html"), "utf-8");
      const modulePath = path.resolve(import.meta.dirname, "server", "entry-server.js");
      const { render } = await import(pathToFileURL(modulePath).href) as RenderModule;
      const result = await render(req.originalUrl);
      const origin = process.env.CANONICAL_ORIGIN || `${req.protocol}://${req.get("host")}`;
      res.status(result.head.notFound ? 404 : 200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).end(composeHtml(template, result, origin));
    } catch (error) {
      console.error("[SSR] render failed", error);
      next(error);
    }
  });
}
