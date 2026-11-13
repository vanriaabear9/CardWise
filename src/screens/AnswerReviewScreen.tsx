import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AnswerReview, AppButton, BackHeader, EmptyState, ScreenContainer } from '@/components';
import { colors, spacing } from '@/constants';
import { useGameResultDetail } from '@/hooks/useGameHistory';

/** Route: /game/answers/<historyId> — the saved answer review of one game (opened from Results). */
export function AnswerReviewScreen({ historyId }: { historyId: number }) {
  const router = useRouter();
  const { data: result, isLoading, error, reload } = useGameResultDetail(historyId);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.dismissTo('/');
  };

  return (
    <ScreenContainer>
      <BackHeader label="Answer Review" title={result?.topicTitle ?? 'Loading…'} onBack={goBack} />

      {isLoading && !result ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error || !result ? (
        <EmptyState
          icon="alert-circle-outline"
          title={error ? "Couldn't load the answers" : 'Game not found'}
          message={error ?? 'This game record no longer exists.'}
        >
          {error ? <AppButton label="Try Again" icon="refresh" onPress={reload} /> : null}
        </EmptyState>
      ) : (
        <AnswerReview answers={result.answers} />
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
