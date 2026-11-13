import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  AnswerReview,
  AppButton,
  BackHeader,
  EmptyState,
  GameResultSummary,
  ScreenContainer,
  Section,
} from '@/components';
import { colors, spacing } from '@/constants';
import { useGameResultDetail } from '@/hooks/useGameHistory';

/**
 * Route: /history/<historyId> — one past game.
 * Everything here comes from the saved record and its answer snapshots, NOT the current topic,
 * so it stays accurate after the topic is edited or deleted.
 */
export function HistoryDetailsScreen({ historyId }: { historyId: number }) {
  const router = useRouter();
  const { data: result, isLoading, error, reload } = useGameResultDetail(historyId);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.dismissTo('/history');
  };

  return (
    <ScreenContainer>
      <BackHeader label="Game History" title="Game Details" onBack={goBack} backLabel="Back to Game History" />

      {isLoading && !result ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error || !result ? (
        <EmptyState
          icon="alert-circle-outline"
          title={error ? "Couldn't load this game" : 'Game not found'}
          message={error ?? 'This game record no longer exists.'}
        >
          {error ? <AppButton label="Try Again" icon="refresh" onPress={reload} /> : null}
          <AppButton label="Back to History" icon="arrow-back" variant="secondary" onPress={goBack} />
        </EmptyState>
      ) : (
        <>
          <GameResultSummary result={result} heading="Topic Completed!" />

          {result.topicId !== null ? (
            <AppButton
              label="Play This Topic Again"
              icon="refresh"
              variant="secondary"
              onPress={() =>
                router.push({ pathname: '/game/[topicId]', params: { topicId: String(result.topicId) } })
              }
            />
          ) : null}

          <Section
            title="Answer Review"
            icon="list-outline"
            description="The terms and descriptions exactly as they were when you played."
          >
            <AnswerReview answers={result.answers} />
          </Section>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
});
