import { getBuiltinTopics, getUserTopics } from '@/services/topicService';
import type { TopicSummary } from '@/types';

import { useDatabaseQuery } from './useDatabaseQuery';

const NO_TOPICS: TopicSummary[] = [];

/** Built-in topics for "Explore Topics". Updates automatically when data changes. */
export function useBuiltinTopics() {
  return useDatabaseQuery(getBuiltinTopics, NO_TOPICS);
}

/** User-created topics for "My Topics". Updates automatically when data changes. */
export function useUserTopics() {
  return useDatabaseQuery(getUserTopics, NO_TOPICS);
}
