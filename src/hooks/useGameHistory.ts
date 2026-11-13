import { useCallback } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';

import { getAllGameResults, getGameResultDetail } from '@/services/gameHistoryService';
import type { GameResult } from '@/types';

import { useDatabaseQuery } from './useDatabaseQuery';

const NO_GAMES: GameResult[] = [];

/** Every saved game, newest first. Updates automatically when a game is saved. */
export function useGameHistory() {
  return useDatabaseQuery(getAllGameResults, NO_GAMES);
}

/** One saved game with its answer snapshots (null while loading or if it doesn't exist). */
export function useGameResultDetail(id: number) {
  const query = useCallback((db: SQLiteDatabase) => getGameResultDetail(db, id), [id]);
  return useDatabaseQuery(query, null);
}
