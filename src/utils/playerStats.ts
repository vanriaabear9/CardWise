import type { Achievement, GameResult, PlayerLevel, PlayerStats } from '@/types';

import { computeHistoryStats } from './historyStats';

/*
 * Player level, statistics, and achievements. Pure functions: they only look at the data
 * they are given (loaded from SQLite by statsService), so nothing is ever hard-coded.
 */

/** Experience points needed for each level. */
export const XP_PER_LEVEL = 20;

/** Level 1 at 0 XP, level 2 at 20 XP, level 3 at 40 XP, ... (XP = total first-try points). */
export function computeLevel(xp: number): PlayerLevel {
  const safeXp = Math.max(0, Math.floor(xp));
  return {
    level: Math.floor(safeXp / XP_PER_LEVEL) + 1,
    xp: safeXp,
    xpIntoLevel: safeXp % XP_PER_LEVEL,
    xpPerLevel: XP_PER_LEVEL,
  };
}

const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : null);

/** Builds every statistic from the saved games (newest first) and current counts. */
export function buildPlayerStats(
  games: GameResult[],
  topicsCreated: number,
  favoritesCount: number,
): PlayerStats {
  const history = computeHistoryStats(games);

  // Only games that recorded both numbers count toward correct/incorrect totals and accuracy.
  const recorded = games.filter((g) => g.correctMatches !== null && g.incorrectAttempts !== null);
  const totalCorrectMatches = recorded.reduce((sum, g) => sum + (g.correctMatches ?? 0), 0);
  const totalIncorrectAttempts = recorded.reduce((sum, g) => sum + (g.incorrectAttempts ?? 0), 0);

  const totalPoints = games.reduce((sum, g) => sum + Math.min(g.score, g.totalQuestions), 0);
  const totalDescriptionsPlayed = games.reduce((sum, g) => sum + g.totalQuestions, 0);

  return {
    gamesPlayed: history.totalGames,
    topicsCreated,
    favoritesCount,
    bestGame: history.bestGame,
    averagePercent: history.averagePercent,
    mostPlayed: history.mostPlayed,
    totalCorrectMatches,
    totalIncorrectAttempts,
    accuracyPercent: percent(totalCorrectMatches, totalCorrectMatches + totalIncorrectAttempts),
    firstTryPercent: percent(totalPoints, totalDescriptionsPlayed),
    totalPoints,
    totalDescriptionsPlayed,
    perfectGames: games.filter((g) => g.totalQuestions > 0 && g.score >= g.totalQuestions).length,
    hasUnrecordedGames: recorded.length < games.length,
    recentGames: games.slice(0, 10).reverse(),
    level: computeLevel(totalPoints),
  };
}

type AchievementRule = Omit<Achievement, 'current' | 'unlocked'> & { value: (stats: PlayerStats) => number };

const ACHIEVEMENT_RULES: AchievementRule[] = [
  { id: 'first-match', title: 'First Match', description: 'Complete your first game.', icon: 'flag', target: 1, value: (s) => s.gamesPlayed },
  { id: 'getting-started', title: 'Getting Started', description: 'Complete 5 games.', icon: 'walk', target: 5, value: (s) => s.gamesPlayed },
  { id: 'dedicated-learner', title: 'Dedicated Learner', description: 'Complete 10 games.', icon: 'school', target: 10, value: (s) => s.gamesPlayed },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Finish a game with every description matched on the first try.',
    icon: 'trophy',
    target: 1,
    value: (s) => s.perfectGames,
  },
  { id: 'topic-creator', title: 'Topic Creator', description: 'Create your first topic.', icon: 'create', target: 1, value: (s) => s.topicsCreated },
  { id: 'creative-mind', title: 'Creative Mind', description: 'Create 5 topics.', icon: 'bulb', target: 5, value: (s) => s.topicsCreated },
  { id: 'collector', title: 'Collector', description: 'Favorite 5 topics.', icon: 'heart', target: 5, value: (s) => s.favoritesCount },
];

/** All achievements with live progress. Calculated, not stored, so they always match the data. */
export function computeAchievements(stats: PlayerStats): Achievement[] {
  return ACHIEVEMENT_RULES.map(({ value, ...rule }) => {
    const raw = Math.max(0, value(stats));
    return { ...rule, current: Math.min(raw, rule.target), unlocked: raw >= rule.target };
  });
}
