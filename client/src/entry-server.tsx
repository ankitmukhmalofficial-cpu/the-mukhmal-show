import { QueryClient, QueryClientProvider, dehydrate } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import App from "./App";

export type HeadMeta = {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage: string;
  notFound?: boolean;
};

export type RenderResult = { html: string; dehydratedState: string; head: HeadMeta };

export async function render(url: string): Promise<RenderResult> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
  const questionIndex = url.indexOf("?");
  const ssrPath = questionIndex === -1 ? url : url.slice(0, questionIndex);
  const ssrSearch = questionIndex === -1 ? "" : url.slice(questionIndex + 1);
  const trpcClient = trpc.createClient({ links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })] });
  const html = renderToString(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router ssrPath={ssrPath} ssrSearch={ssrSearch}>
          <App />
        </Router>
      </QueryClientProvider>
    </trpc.Provider>
  );
  const isStoryRoute = ssrPath === "/stories" || ssrPath.startsWith("/stories/");
  return {
    html,
    dehydratedState: superjson.stringify(dehydrate(queryClient)),
    head: {
      title: isStoryRoute ? "Stories | The Mukhmall Show by Ankit Singh" : "The Mukhmall Show | Real Stories. Deep Impact.",
      description: isStoryRoute ? "Original Hindi stories by The Mukhmall Show about life lessons, relationships, motivation, and personal growth." : "The Mukhmall Show by Ankit Singh — short videos, real stories, creator work, and thoughtful ideas that make you stop, feel, and think.",
      canonicalPath: ssrPath || "/",
      ogImage: "/manus-storage/mukhmall-hero_c1248414.png",
    },
  };
}
