import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton, Card, EmptyState, ScreenContainer, StatTile } from '@/components';
import { colors, radius, spacing, typography } from '@/constants';
import { paramsToSummary } from '@/utils/gameEngine';

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * TEMPORARY results screen (Phase 5).
 * Shows the summary handed over by the game. Phase 6 replaces this with the full
 * Results screen and saves the game to history.
 */
export function GameResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const summary = paramsToSummary(params);

  const goHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  if (!summary) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="alert-circle-outline"
          title="No results to show"
          message="The game results could not be read."
        >
          <AppButton label="Back to Home" icon="home-outline" onPress={goHome} />
        </EmptyState>
      </ScreenContainer>
    );
  }

  const totalAttempts = summary.correctMatches + summary.incorrectAttempts;
  const accuracy = totalAttempts === 0 ? 0 : Math.round((summary.correctMatches / totalAttempts) * 100);

  return (
    <ScreenContainer>
      <Card style={styles.hero}>
        <View style={styles.trophy}>
          <Ionicons name="trophy" size={36} color={colors.highlight} />
        </View>
        <Text style={styles.heading} accessibilityRole="header">
          Topic complete!
        </Text>
        <Text style={styles.topic} numberOfLines={2}>
          {summary.topicTitle}
        </Text>
        <Text style={styles.score} accessibilityLabel={`Score ${summary.score} out of ${summary.totalDescriptions}`}>
          {summary.score}/{summary.totalDescriptions}
        </Text>
        <Text style={styles.caption}>points — every description matched</Text>
      </Card>

      <View style={styles.stats}>
        <StatTile icon="checkmark-circle-outline" label="Correct" value={String(summary.correctMatches)} />
        <StatTile icon="close-circle-outline" label="Mistakes" value={String(summary.incorrectAttempts)} />
        <StatTile icon="time-outline" label="Time" value={formatDuration(summary.durationMs)} />
      </View>
      <Text style={styles.accuracy}>First-try accuracy: {accuracy}%</Text>

      <View style={styles.actions}>
        <AppButton
          label="Play Again"
          icon="refresh"
          onPress={() =>
            router.replace({ pathname: '/game/[topicId]', params: { topicId: String(summary.topicId) } })
          }
        />
        <AppButton label="Back to Home" icon="home-outline" variant="secondary" onPress={goHome} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.xl,
  },
  trophy: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  heading: typography.title,
  topic: {
    ...typography.subheading,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  score: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.highlight,
  },
  caption: typography.caption,
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  accuracy: {
    ...typography.caption,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.md,
  },
});
