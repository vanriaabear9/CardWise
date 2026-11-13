import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius, spacing, typography } from '@/constants';
import type { GameAnswer } from '@/types';

import { EmptyState } from './EmptyState';

interface AnswerReviewProps {
  /** Saved snapshots of the game's descriptions (never the current topic data). */
  answers: GameAnswer[];
}

interface TermGroup {
  key: string;
  termText: string;
  answers: GameAnswer[];
}

/** Groups answers by their correct term, keeping the topic's order at the time of playing. */
function groupByTerm(answers: GameAnswer[]): TermGroup[] {
  const groups = new Map<string, TermGroup>();
  for (const answer of answers) {
    const key = `${answer.termPosition}:${answer.termText}`;
    let group = groups.get(key);
    if (!group) {
      group = { key, termText: answer.termText, answers: [] };
      groups.set(key, group);
    }
    group.answers.push(answer);
  }
  return [...groups.values()];
}

/**
 * Every term with all its correct descriptions, plus what the player first tried.
 * Only shows attempt details that were actually recorded.
 */
export function AnswerReview({ answers }: AnswerReviewProps) {
  if (answers.length === 0) {
    return (
      <EmptyState
        icon="document-text-outline"
        title="No answer details"
        message="Answer details were not recorded for this game."
      />
    );
  }

  const recorded = answers.filter((a) => a.firstAttemptCorrect !== null);
  const firstTryCorrect = recorded.filter((a) => a.firstAttemptCorrect).length;

  return (
    <View style={styles.container}>
      {recorded.length > 0 ? (
        <Text style={styles.summary}>
          {firstTryCorrect} of {recorded.length} descriptions were matched correctly on the first try.
        </Text>
      ) : null}

      {groupByTerm(answers).map((group) => (
        <View key={group.key} style={styles.termCard}>
          <View style={styles.termHeader}>
            <Text style={styles.termLabel}>TERM</Text>
            <Text style={styles.termText}>{group.termText}</Text>
            <Text style={styles.termCount}>
              {group.answers.length} {group.answers.length === 1 ? 'description' : 'descriptions'}
            </Text>
          </View>

          {group.answers.map((answer) => (
            <AnswerRow key={answer.id} answer={answer} />
          ))}
        </View>
      ))}
    </View>
  );
}

function AnswerRow({ answer }: { answer: GameAnswer }) {
  const correct = answer.firstAttemptCorrect;

  return (
    <View
      style={[
        styles.answer,
        correct === true && styles.answerCorrect,
        correct === false && styles.answerIncorrect,
      ]}
    >
      <Text style={styles.descriptionText}>{answer.descriptionText}</Text>

      <View style={styles.line}>
        <Ionicons name="link-outline" size={iconSize.sm} color={colors.secondary} />
        <Text style={styles.lineText}>
          Correct term: <Text style={styles.strong}>{answer.termText}</Text>
        </Text>
      </View>

      {correct === null ? (
        <View style={styles.line}>
          <Ionicons name="help-circle-outline" size={iconSize.sm} color={colors.textSecondary} />
          <Text style={styles.lineText}>First attempt: not recorded</Text>
        </View>
      ) : (
        <View style={styles.line}>
          <Ionicons
            name={correct ? 'checkmark-circle' : 'close-circle'}
            size={iconSize.sm}
            color={correct ? colors.highlight : colors.danger}
          />
          <Text style={styles.lineText}>
            Your first attempt:{' '}
            <Text style={[styles.strong, { color: correct ? colors.highlight : colors.danger }]}>
              {answer.firstAttemptTermText ?? 'unknown term'}
            </Text>{' '}
            {correct ? '(correct)' : '(incorrect)'}
          </Text>
        </View>
      )}

      {answer.attempts !== null && answer.attempts > 1 ? (
        <Text style={styles.attempts}>Placed correctly after {answer.attempts} attempts</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  summary: {
    ...typography.body,
    color: colors.highlight,
    fontWeight: '600',
  },
  termCard: {
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  termHeader: {
    gap: 2,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  termLabel: {
    ...typography.label,
    color: colors.secondary,
    letterSpacing: 1,
    fontSize: 11,
  },
  termText: {
    ...typography.heading,
    color: colors.highlight,
  },
  termCount: typography.caption,
  answer: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
  },
  answerCorrect: {
    borderLeftColor: colors.highlight,
  },
  answerIncorrect: {
    borderLeftColor: colors.danger,
  },
  descriptionText: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  lineText: {
    ...typography.caption,
    flex: 1,
  },
  strong: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  attempts: {
    ...typography.caption,
    fontStyle: 'italic',
  },
});
