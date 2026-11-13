import type { ComponentRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius, spacing, typography } from '@/constants';
import type { GameTerm } from '@/types';
import { isTermComplete } from '@/utils/gameEngine';

export type TermFlash = 'correct' | 'incorrect' | null;

interface TermDropTargetProps {
  term: GameTerm;
  /** A dragged card is currently over this term. */
  hovered: boolean;
  /** Brief highlight right after a drop on this term. */
  flash: TermFlash;
  /** Receives the underlying view so the game screen can measure where it is. */
  targetRef: (view: ComponentRef<typeof View> | null) => void;
}

/** Show one dot per description up to this many; beyond that, only the "x/y" count. */
const MAX_DOTS = 6;

/**
 * A term shown as a solitaire-style "pile" that description cards are dropped onto:
 * a card outline with an inner frame, the term in the middle, and progress dots.
 */
export function TermDropTarget({ term, hovered, flash, targetRef }: TermDropTargetProps) {
  const complete = isTermComplete(term);

  let badge: { icon: 'checkmark-circle' | 'close-circle'; color: string } | null = null;
  if (flash === 'incorrect') badge = { icon: 'close-circle', color: colors.danger };
  else if (flash === 'correct' || complete) badge = { icon: 'checkmark-circle', color: colors.highlight };

  const frameColor = flash === 'incorrect' ? colors.danger : hovered || flash === 'correct' || complete ? colors.highlight : colors.border;

  return (
    <View
      ref={targetRef}
      collapsable={false} // keep a real native view on Android so it can be measured
      style={[
        styles.pile,
        complete && styles.complete,
        hovered && styles.hovered,
        flash === 'correct' && styles.flashCorrect,
        flash === 'incorrect' && styles.flashIncorrect,
      ]}
      accessibilityLabel={`${term.termText}. ${term.matchedCount} of ${term.totalDescriptions} matched${complete ? ', complete' : ''}`}
    >
      {/* Inner frame, like the border printed on a card */}
      <View
        pointerEvents="none"
        style={[styles.frame, { borderColor: frameColor }, complete && styles.frameComplete]}
      />

      {badge ? (
        <Ionicons name={badge.icon} size={iconSize.md} color={badge.color} style={styles.badge} />
      ) : null}

      <Text style={styles.termText} numberOfLines={3}>
        {term.termText}
      </Text>

      <View style={styles.footer}>
        {term.totalDescriptions <= MAX_DOTS ? (
          <View style={styles.dots}>
            {Array.from({ length: term.totalDescriptions }, (_, index) => (
              // Filled = matched, hollow = still open (shape, not just color).
              <View key={index} style={[styles.dot, index < term.matchedCount && styles.dotFilled]} />
            ))}
          </View>
        ) : null}
        <Text style={[styles.count, complete && styles.countComplete]}>
          {complete ? 'Complete' : `${term.matchedCount}/${term.totalDescriptions}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Card-shaped pile, two per row
  pile: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 116,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  frame: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  frameComplete: {
    borderStyle: 'dashed',
  },
  complete: {
    borderColor: colors.highlight,
  },
  hovered: {
    backgroundColor: colors.primaryMuted,
    transform: [{ scale: 1.04 }],
  },
  flashCorrect: {
    borderColor: colors.highlight,
    backgroundColor: colors.primaryMuted,
  },
  flashIncorrect: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerMuted,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm + 2,
    right: spacing.sm + 2,
  },
  termText: {
    ...typography.subheading,
    fontSize: 17,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.secondary,
  },
  dotFilled: {
    backgroundColor: colors.highlight,
    borderColor: colors.highlight,
  },
  count: typography.caption,
  countComplete: {
    color: colors.highlight,
    fontWeight: '600',
  },
});
