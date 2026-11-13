import { useLocalSearchParams } from 'expo-router';

import { TopicDetailsScreen } from '@/screens';

/** Route: /topic/<id>/details — topic details (terms and descriptions), opened on top of the tabs. */
export default function TopicDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TopicDetailsScreen topicId={Number(id)} />;
}
