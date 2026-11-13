import { useLocalSearchParams } from 'expo-router';

import { EditTopicScreen } from '@/screens';

/** Route: /topic/<id>/edit — opens on top of the tabs (root stack). */
export default function EditTopicRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditTopicScreen topicId={Number(id)} />;
}
