# Render.com and YouTube Auto-Sync Plan

## Current website

The current front end is static and uses verified public YouTube video IDs, thumbnails, and direct watch links. It does not expose a YouTube API key and can be deployed as a static site.

## Automatic new-video sync

For new uploads to appear automatically, the website needs a small server-side feed endpoint. The recommended Render setup is:

| Part | Responsibility |
|---|---|
| Render web service | Stores the YouTube API key privately and fetches the channel feed. |
| Feed endpoint | Returns normalized video ID, title, thumbnail, publish date, and type. |
| Website frontend | Calls the feed endpoint and falls back to the current verified list if it is unavailable. |
| Refresh strategy | Cache the result for a short period so the YouTube API is not called on every visitor request. |

The channel handle is `@TheMukhmalShow`. A future backend can resolve the channel ID once, then call the YouTube Data API with the channel’s uploads playlist or a server-side RSS/Atom feed. The API key must remain in Render environment variables and must never be shipped to browser JavaScript.

## Suggested Render environment values

```text
YOUTUBE_API_KEY=replace-with-private-key
YOUTUBE_CHANNEL_HANDLE=TheMukhmalShow
CACHE_SECONDS=900
```

## Important limitation

This automatic sync is not activated in the current static project because it requires a backend endpoint and a private YouTube credential. The website is already structured so the hard-coded public list can later be replaced by a feed response without redesigning the interface.
