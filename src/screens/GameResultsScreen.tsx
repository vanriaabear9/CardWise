import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton, EmptyState, GameResultSummary, ScreenContainer } from '@/components';
import { colors, iconSize, radius, spacing, typography } from '@/constants';
import { useGameResultDetail } from '@/hooks/useGameHistory';
import type { GameSummary } from '@/types';
import { paramsToSummary } from '@/utils/gameEngine';

/**
 * Route: /game/results
 * - `historyId`: the saved game to show (normal case; the game screen saves before opening this).
 * - Otherwise the summary is read from the params (fallback when saving failed: nothing is saved).
 *
 * This screen only READS. It never saves, so re-rendering or reopening it can't create duplicates.
 */
export function GameResultsScreen() {
  const params = useLocalSearchParams<Record<string, string>>();
  if (params.historyId !== undefined) {
    return <SavedResults historyId={Number(params.historyId)} />;
  }
  return <UnsavedResults summary={paramsToSummary(params)} />;
}

function useResultActions() {
  const router = useRouter();
  return {
    goHome: () => router.dismissTo('/'),
    playAgain: (topicId: number) =>
      router.replace({ pathname: '/game/[topicId]', params: { topicId: String(topicId) } }),
    viewAnswers: (historyId: number) =>
      router.push({ pathname: '/game/answers/[historyId]', params: { historyId: String(historyId) } }),
  };
}

function SavedResults({ historyId }: { historyId: number }) {
  const actions = useResultActions();
  const { data: result, isLoading, error, reload } = useGameResultDetail(historyId);

  if (isLoading && !result) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (error || !result) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="alert-circle-outline"
          title={error ? "Couldn't load your results" : 'Results not found'}
          message={error ?? 'This game record no longer exists.'}
        >
          {error ? <AppButton label="Try Again" icon="refresh" onPress={reload} /> : null}
          <AppButton label="Back to Home" icon="home-outline" variant="secondary" onPress={actions.goHome} />
        </EmptyState>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <GameResultSummary result={result} heading="Topic Completed!" />

      {/* Shown only after the record was read back from the database. */}
      <View style={styles.savedChip}>
        <Ionicons name="checkmark-circle" size={iconSize.sm} color={colors.highlight} />
        <Text style={styles.savedText}>Saved to Game History</Text>
      </View>

      <View style={styles.actions}>
        {result.topicId !== null ? (
          <AppButton label="Play Again" icon="refresh" onPress={() => actions.playAgain(result.topicId!)} />
        ) : (
          <Text style={styles.note}>This topic was deleted, so it can't be played again.</Text>
        )}
        {result.answers.length > 0 ? (
          <AppButton
            label="View Answers"
            icon="list-outline"
            variant="secondary"
            onPress={() => actions.viewAnswers(result.id)}
          />
        ) : null}
        <AppButton label="Back to Home" icon="home-outline" variant="secondary" onPress={actions.goHome} />
      </View>
    </ScreenContainer>
  );
}

function UnsavedResults({ summary }: { summary: GameSummary | null }) {
  const actions = useResultActions();

  if (!summary) {
    return (
      <ScreenContainer>
        <EmptyState icon="alert-circle-outline" title="No results to show" message="The game results could not be read.">
          <AppButton label="Back to Home" icon="home-outline" onPress={actions.goHome} />
        </EmptyState>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <GameResultSummary
        heading="Topic Completed!"
        result={{
          topicTitle: summary.topicTitle,
          score: summary.score,
          totalQuestions: summary.totalDescriptions,
          correctMatches: summary.correctMatches,
          incorrectAttempts: summary.incorrectAttempts,
          durationMs: summary.durationMs,
          completedAt: summary.completedAt,
        }}
      />

      <View style={[styles.savedChip, styles.unsavedChip]}>
        <Ionicons name="alert-circle" size={iconSize.sm} color={colors.danger} />
        <Text style={[styles.savedText, styles.unsavedText]}>
          Not saved: this game won't appear in History.
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton label="Play Again" icon="refresh" onPress={() => actions.playAgain(summary.topicId)} />
        <AppButton label="Back to Home" icon="home-outline" variant="secondary" onPress={actions.goHome} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  savedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryMuted,
  },
  savedText: {
    ...typography.label,
    color: colors.highlight,
  },
  unsavedChip: {
    backgroundColor: colors.dangerMuted,
  },
  unsavedText: {
    color: colors.danger,
  },
  actions: {
    gap: spacing.md,
  },
  note: {
    ...typography.caption,
    textAlign: 'center',
  },
});
