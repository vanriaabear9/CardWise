import type { GameResult, HistoryStats, HistoryTopic } from '@/types';

/*
 * Statistics and topic grouping for the History screen.
 * Everything is calculated from saved records; nothing is hard-coded.
 */

/**
 * Which topic a record belongs to. Uses the topic id while the topic exists; after a topic is
 * deleted its records have no id, so they are grouped by their saved title instead.
 */
export function historyTopicKey(game: GameResult): string {
  return game.topicId !== null ? `id:${game.topicId}` : `title:${game.topicTitle}`;
}

const ratio = (game: GameResult) => (game.totalQuestions > 0 ? game.score / game.totalQuestions : 0);
const isNewer = (a: GameResult, b: GameResult) =>
  a.completedAt > b.completedAt || (a.completedAt === b.completedAt && a.id > b.id);

/** Topics that appear in the history, most recently played first. Title = the latest saved title. */
export function groupHistoryTopics(games: GameResult[]): HistoryTopic[] {
  const groups = new Map<string, { topic: HistoryTopic; latest: GameResult }>();
  for (const game of games) {
    const key = historyTopicKey(game);
    const group = groups.get(key);
    if (!group) {
      groups.set(key, { topic: { key, title: game.topicTitle, count: 1 }, latest: game });
    } else {
      group.topic.count += 1;
      if (isNewer(game, group.latest)) {
        group.latest = game;
        group.topic.title = game.topicTitle;
      }
    }
  }
  return [...groups.values()]
    .sort((a, b) => (isNewer(a.latest, b.latest) ? -1 : 1))
    .map((group) => group.topic);
}

export function computeHistoryStats(games: GameResult[]): HistoryStats {
  if (games.length === 0) {
    return { totalGames: 0, bestGame: null, averagePercent: null, mostPlayed: null };
  }

  let bestGame = games[0];
  for (const game of games) {
    const better =
      ratio(game) > ratio(bestGame) ||
      (ratio(game) === ratio(bestGame) &&
        (game.score > bestGame.score || (game.score === bestGame.score && isNewer(game, bestGame))));
    if (better) bestGame = game;
  }

  const averagePercent = Math.round((games.reduce((sum, game) => sum + ratio(game), 0) / games.length) * 100);

  // Ties go to the most recently played topic (groupHistoryTopics is already in that order).
  let mostPlayed: HistoryTopic | null = null;
  for (const topic of groupHistoryTopics(games)) {
    if (!mostPlayed || topic.count > mostPlayed.count) mostPlayed = topic;
  }

  return {
    totalGames: games.length,
    bestGame,
    averagePercent,
    mostPlayed: mostPlayed ? { title: mostPlayed.title, count: mostPlayed.count } : null,
  };
}
