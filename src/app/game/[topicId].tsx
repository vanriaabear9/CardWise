import { useLocalSearchParams } from 'expo-router';

import { GameScreen } from '@/screens';

/** Route: /game/<topicId> — the matching game, opened on top of the tabs. */
export default function GameRoute() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  return <GameScreen topicId={Number(topicId)} />;
}
