import { useLocalSearchParams } from 'expo-router';

import { AnswerReviewScreen } from '@/screens';

/** Route: /game/answers/<historyId> — answer review opened from the Results screen. */
export default function AnswerReviewRoute() {
  const { historyId } = useLocalSearchParams<{ historyId: string }>();
  return <AnswerReviewScreen historyId={Number(historyId)} />;
}
