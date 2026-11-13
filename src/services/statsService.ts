import type { SQLiteDatabase } from 'expo-sqlite';

import type { PlayerStats } from '@/types';
import { buildPlayerStats } from '@/utils/playerStats';

import { getAllGameResults } from './gameHistoryService';

/** All player statistics, calculated from the saved games, user topics, and favorites. */
export async function getPlayerStats(db: SQLiteDatabase): Promise<PlayerStats> {
  const games = await getAllGameResults(db);
  const topics = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM topics WHERE is_builtin = 0');
  const favorites = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM favorites f JOIN topics t ON t.id = f.topic_id',
  );
  return buildPlayerStats(games, topics?.n ?? 0, favorites?.n ?? 0);
}
