import { redis } from "./redis";

const SLIDING_WINDOW_HOURS = 6;
const WINDOW_MS = SLIDING_WINDOW_HOURS * 60 * 60 * 1000;

const ENGAGEMENT_WEIGHTS = {
  views: 1,
  likes: 3,
  comments: 5,
};

export async function addEngagement(
  postId: string,
  type: keyof typeof ENGAGEMENT_WEIGHTS,
  actorId: string,
  date: Date
) {
  const key = `trending:${type}:${postId}`;
  const time = date.getTime();

  await redis.zAdd(key, [{ score: time, value: `${actorId}:${time}` }]);

  const minScore = 0;
  const maxScore = time - WINDOW_MS;
  await redis.zRemRangeByScore(key, minScore, maxScore);

  await redis.sAdd("posts:active", postId);
}

export async function computeTrendingScore(postId: string): Promise<number> {
  const windowStart = Date.now() - WINDOW_MS;
  let score = 0;

  for (const [type, weight] of Object.entries(ENGAGEMENT_WEIGHTS)) {
    const key = `trending:${type}:${postId}`;

    const count = await redis.zCount(key, windowStart, Date.now());
    score += count * weight;
  }

  return score;
}

export async function removeEngagement(
  type: keyof typeof ENGAGEMENT_WEIGHTS,
  postId: string,
  actorId: string,
  timestamp: number
) {
  const key = `trending:${type}:${postId}`;
  const value = `${actorId}:${timestamp}`;

  await redis.zRem(key, value);

  const windowStart = Date.now() - WINDOW_MS;
  let stillActive = false;

  for (const type of Object.keys(ENGAGEMENT_WEIGHTS)) {
    const k = `trending:${type}:${postId}`;
    const count = await redis.zCount(k, windowStart, Date.now());
    if (count > 0) {
      stillActive = true;
      break;
    }
  }

  if (!stillActive) {
    await redis.sRem("posts:active", postId);
  }
}

export async function recalculateTrending() {
  const postIds = await redis.sMembers("posts:active");
  console.log(postIds);
  if (!postIds.length) return;

  for (const postId of postIds) {
    const score = await computeTrendingScore(postId);
    await redis.zAdd("posts:trending", [{ score, value: postId }]);
  }

  await redis.del("posts:active");
}
