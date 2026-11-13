import { useCallback } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';

import { getRecentGameResults } from '@/services/gameHistoryService';
import type { GameResult } from '@/types';

import { useDatabaseQuery } from './useDatabaseQuery';

const NO_GAMES: GameResult[] = [];

/** The most recent finished games. Updates automatically when data changes. */
export function useRecentGames(limit: number) {
  const query = useCallback((db: SQLiteDatabase) => getRecentGameResults(db, limit), [limit]);
  return useDatabaseQuery(query, NO_GAMES);
}
