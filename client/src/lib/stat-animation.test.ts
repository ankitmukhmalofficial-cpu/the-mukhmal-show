import { describe, expect, it } from "vitest";
import { interpolateChannelStats } from "./stat-animation";

describe("homepage channel stat animation", () => {
  const targets = { subscribers: 80, videos: 16, views: 9783 };

  it("starts at zero and ends at the live target values", () => {
    expect(interpolateChannelStats(targets, 0)).toEqual({ subscribers: 0, videos: 0, views: 0 });
    expect(interpolateChannelStats(targets, 1)).toEqual(targets);
  });

  it("clamps progress and returns live values immediately for reduced motion", () => {
    expect(interpolateChannelStats(targets, -1)).toEqual({ subscribers: 0, videos: 0, views: 0 });
    expect(interpolateChannelStats(targets, 2)).toEqual(targets);
    expect(interpolateChannelStats(targets, 0, true)).toEqual(targets);
  });
});
