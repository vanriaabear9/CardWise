import { useLocalSearchParams } from 'expo-router';

import { HistoryDetailsScreen } from '@/screens';

/** Route: /history/<historyId> — details of one past game, opened on top of the tabs. */
export default function HistoryDetailsRoute() {
  const { historyId } = useLocalSearchParams<{ historyId: string }>();
  return <HistoryDetailsScreen historyId={Number(historyId)} />;
}
