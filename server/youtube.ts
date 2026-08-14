import { upsertYoutubeVideo } from "./db";

export const THE_MUKHMAL_CHANNEL_ID = "UCm87x2S41wDEfnEorm1VAPQ";

export type YoutubeChannelStats = {
  subscriberCount: number | null;
  videoCount: number | null;
  viewCount: number | null;
  fetchedAt: string;
};

type YoutubeApiResponse<T> = { items?: T[]; error?: { message?: string } };

type YoutubeChannelItem = {
  statistics?: { subscriberCount?: string; videoCount?: string; viewCount?: string };
};

type YoutubeVideoItem = {
  id: string;
  snippet?: { title?: string; publishedAt?: string; thumbnails?: { maxres?: { url?: string }; high?: { url?: string } } };
  statistics?: { viewCount?: string };
};

function readTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return match?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() ?? "";
}

function parseNumber(value?: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function youtubeApi<T>(resource: string, params: Record<string, string>) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;
  const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
  Object.entries({ ...params, key: apiKey }).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, { headers: { accept: "application/json" } });
  const body = (await response.json()) as YoutubeApiResponse<T>;
  if (!response.ok) throw new Error(body.error?.message || `YouTube API returned ${response.status}`);
  return body;
}

export async function getYoutubeChannelStats(): Promise<YoutubeChannelStats | null> {
  const response = await youtubeApi<YoutubeChannelItem>("channels", { part: "statistics", id: THE_MUKHMAL_CHANNEL_ID });
  const statistics = response?.items?.[0]?.statistics;
  if (!statistics) return null;
  return {
    subscriberCount: parseNumber(statistics.subscriberCount),
    videoCount: parseNumber(statistics.videoCount),
    viewCount: parseNumber(statistics.viewCount),
    fetchedAt: new Date().toISOString(),
  };
}

export async function syncPublicYoutubeFeed() {
  const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${THE_MUKHMAL_CHANNEL_ID}`, { headers: { accept: "application/atom+xml" } });
  if (!response.ok) throw new Error(`YouTube feed returned ${response.status}`);
  const xml = await response.text();
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => match[1]);
  const rssVideos = entries.map((entry) => ({
    youtubeId: readTag(entry, "yt:videoId"),
    title: readTag(entry, "title"),
    publishedAt: readTag(entry, "published"),
  })).filter((video) => video.youtubeId && video.title);

  const apiResponse = await youtubeApi<YoutubeVideoItem>("videos", {
    part: "snippet,statistics",
    id: rssVideos.map((video) => video.youtubeId).join(","),
  });
  const apiVideos = new Map((apiResponse?.items ?? []).map((video) => [video.id, video]));

  let saved = 0;
  for (const rssVideo of rssVideos) {
    const apiVideo = apiVideos.get(rssVideo.youtubeId);
    await upsertYoutubeVideo({
      youtubeId: rssVideo.youtubeId,
      title: apiVideo?.snippet?.title || rssVideo.title,
      thumbnailUrl: apiVideo?.snippet?.thumbnails?.maxres?.url || apiVideo?.snippet?.thumbnails?.high?.url || `https://i.ytimg.com/vi/${rssVideo.youtubeId}/maxresdefault.jpg`,
      videoType: /short/i.test(apiVideo?.snippet?.title || rssVideo.title) ? "short" : "video",
      youtubeViewCount: parseNumber(apiVideo?.statistics?.viewCount) ?? 0,
      publishedAt: apiVideo?.snippet?.publishedAt ? new Date(apiVideo.snippet.publishedAt) : (rssVideo.publishedAt ? new Date(rssVideo.publishedAt) : undefined),
      lastSyncedAt: new Date(),
    });
    saved += 1;
  }
  return { saved, fetched: rssVideos.length, apiMetrics: Boolean(process.env.YOUTUBE_API_KEY), syncedAt: new Date().toISOString() };
}
