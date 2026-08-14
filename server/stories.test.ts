import { describe, expect, it } from "vitest";
import { getPublishedStoryBySlug, listApprovedFeedback, listPublishedStories } from "./db";

describe("Stories and feedback integrity", () => {
  it("returns published editorial stories", async () => {
    const stories = await listPublishedStories();
    expect(stories.length).toBeGreaterThan(0);
    expect(stories.every(story => story.status === "published")).toBe(true);
    expect((await getPublishedStoryBySlug("mushkil-waqt-mein-sahi-faisla"))?.title).toContain("Mushkil waqt");
  });

  it("does not expose unapproved customer feedback", async () => {
    const feedback = await listApprovedFeedback();
    expect(feedback.every(item => item.message.length >= 20)).toBe(true);
  });
});
