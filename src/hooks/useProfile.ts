import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { DEFAULT_AVATAR_ID, DEFAULT_PLAYER_NAME } from '@/constants/avatars';
import { getErrorMessage } from '@/services/errors';
import { getFavoriteTopicIds, getFavoriteTopics, setFavorite } from '@/services/favoriteService';
import { getProfile } from '@/services/profileService';
import { getPlayerStats } from '@/services/statsService';
import type { PlayerProfile, PlayerStats, TopicSummary } from '@/types';
import { buildPlayerStats, computeAchievements } from '@/utils/playerStats';

import { useDatabaseQuery } from './useDatabaseQuery';

/*
 * Profile, statistics, and favorites. Each reloads automatically when data changes
 * (a game is saved, a topic is created/deleted, a favorite is toggled, the profile is edited).
 */

const DEFAULT_PROFILE: PlayerProfile = {
  displayName: DEFAULT_PLAYER_NAME,
  avatarId: DEFAULT_AVATAR_ID,
  isDefault: true,
  updatedAt: null,
};
const EMPTY_STATS: PlayerStats = buildPlayerStats([], 0, 0);
const NO_IDS: number[] = [];
const NO_TOPICS: TopicSummary[] = [];

export function useProfile() {
  return useDatabaseQuery(getProfile, DEFAULT_PROFILE);
}

export function usePlayerStats() {
  return useDatabaseQuery(getPlayerStats, EMPTY_STATS);
}

export function useAchievements() {
  const stats = usePlayerStats();
  const achievements = useMemo(() => computeAchievements(stats.data), [stats.data]);
  return { ...stats, achievements };
}

export function useFavoriteTopics() {
  return useDatabaseQuery(getFavoriteTopics, NO_TOPICS);
}

/** Favorite topic ids plus a toggle function for topic cards. */
export function useFavorites() {
  const db = useSQLiteContext();
  const query = useDatabaseQuery(getFavoriteTopicIds, NO_IDS);
  const favoriteIds = useMemo(() => new Set(query.data), [query.data]);

  /** Explicitly marks or unmarks a topic (use this when the desired state is known). */
  const setTopicFavorite = useCallback(
    async (topicId: number, favorite: boolean) => {
      try {
        await setFavorite(db, topicId, favorite);
      } catch (error) {
        Alert.alert("Couldn't update favorites", getErrorMessage(error));
      }
    },
    [db],
  );

  const toggleFavorite = useCallback(
    (topic: Pick<TopicSummary, 'id'>) => setTopicFavorite(topic.id, !favoriteIds.has(topic.id)),
    [setTopicFavorite, favoriteIds],
  );

  return { favoriteIds, toggleFavorite, setTopicFavorite, isLoading: query.isLoading, error: query.error };
}
