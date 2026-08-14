export type ChannelStats = { subscribers: number; videos: number; views: number };

export function interpolateChannelStats(targets: ChannelStats, progress: number, reducedMotion = false): ChannelStats {
  if (reducedMotion) return targets;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const eased = 1 - Math.pow(1 - clamped, 3);
  return {
    subscribers: Math.round(targets.subscribers * eased),
    videos: Math.round(targets.videos * eased),
    views: Math.round(targets.views * eased),
  };
}
