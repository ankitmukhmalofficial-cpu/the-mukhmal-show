import { describe, expect, it } from "vitest";
import { THE_MUKHMAL_CHANNEL_ID } from "./youtube";

describe("YouTube Data API credentials", () => {
  it("can read the public Mukhmall channel when a key is configured", async () => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    expect(apiKey, "YOUTUBE_API_KEY must be configured").toBeTruthy();

    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "statistics");
    url.searchParams.set("id", THE_MUKHMAL_CHANNEL_ID);
    url.searchParams.set("key", apiKey as string);

    const response = await fetch(url);
    expect(response.ok, `YouTube API returned ${response.status}`).toBe(true);
    const body = (await response.json()) as { items?: Array<{ id?: string }> };
    expect(body.items?.some(item => item.id === THE_MUKHMAL_CHANNEL_ID)).toBe(true);
  }, 15_000);
});
