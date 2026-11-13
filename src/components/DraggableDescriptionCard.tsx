import { useEffect, useRef, type ComponentRef } from 'react';
import { PanResponder, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius, spacing, typography } from '@/constants';
import type { GameCard } from '@/types';

import { getSuit } from './cardSuits';

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DragCallbacks {
  /** Card was picked up. `cardRect` is in window coordinates; `touch` is the finger offset inside the card. */
  onDragStart: (card: GameCard, cardRect: WindowRect, touch: { x: number; y: number }) => void;
  /** Finger moved by (dx, dy) since the press began. */
  onDragMove: (dx: number, dy: number) => void;
  /** Finger lifted after moving by (dx, dy). */
  onDragEnd: (dx: number, dy: number) => void;
  /** The system interrupted the drag (e.g. an incoming call). */
  onDragCancel: () => void;
}

interface DraggableDescriptionCardProps extends DragCallbacks {
  card: GameCard;
  /**
   * Which decorative suit to print (0–3). Based on the card's place in the shuffled deck,
   * NOT on its answer, so suits never give away the matching term.
   */
  suitIndex: number;
  /** No new drag can start (another card is moving, or the game is over). */
  disabled: boolean;
  /** This card is the one being dragged (show a placeholder in its slot). */
  isDragging: boolean;
  style?: StyleProp<ViewStyle>;
}

/** The card lifts after being held this long... */
const HOLD_TO_DRAG_MS = 150;
/** ...or as soon as the finger moves this far, whichever comes first. */
const MOVE_TO_DRAG = 6;

/**
 * A description shown as a face-up playing card that can be picked up and dragged.
 * Built on React Native's PanResponder (no extra libraries, works in Expo Go).
 * The game screen draws the moving copy; this card just reports the gesture.
 *
 * The card must NOT be inside a scroll view: dragging and scrolling would compete for the same touch.
 */
export function DraggableDescriptionCard({
  card,
  suitIndex,
  disabled,
  isDragging,
  style,
  ...callbacks
}: DraggableDescriptionCardProps) {
  const viewRef = useRef<ComponentRef<typeof View>>(null);

  // PanResponder is created once, so it reads the latest props through refs.
  const latest = useRef({ card, disabled, callbacks });
  latest.current = { card, disabled, callbacks };

  const gesture = useRef({
    /** Finger is currently down on this card. */
    touching: false,
    /** Lift has been requested (waiting for the card's position to be measured). */
    lifting: false,
    /** Card is lifted and following the finger. */
    active: false,
    touch: { x: 0, y: 0 },
    /** Last finger offset, so the first move after lifting isn't lost. */
    last: { dx: 0, dy: 0 },
    holdTimer: null as ReturnType<typeof setTimeout> | null,
  });

  const clearHoldTimer = () => {
    if (gesture.current.holdTimer) {
      clearTimeout(gesture.current.holdTimer);
      gesture.current.holdTimer = null;
    }
  };

  // If the card disappears mid-drag, end the drag cleanly so the game never stays "holding" it.
  useEffect(
    () => () => {
      clearHoldTimer();
      if (gesture.current.active) {
        gesture.current.active = false;
        latest.current.callbacks.onDragCancel();
      }
    },
    [],
  );

  /** Measures the card, then tells the game screen it was picked up. */
  const lift = () => {
    const g = gesture.current;
    if (g.lifting || g.active || latest.current.disabled) return;
    g.lifting = true;
    clearHoldTimer();
    viewRef.current?.measureInWindow((x, y, width, height) => {
      g.lifting = false;
      // The finger may have lifted while we were measuring: then don't start a drag at all.
      if (!g.touching || latest.current.disabled) return;
      g.active = true;
      latest.current.callbacks.onDragStart(latest.current.card, { x, y, width, height }, g.touch);
      latest.current.callbacks.onDragMove(g.last.dx, g.last.dy);
    });
  };

  const endTouch = () => {
    const g = gesture.current;
    g.touching = false;
    g.lifting = false;
    clearHoldTimer();
    const wasActive = g.active;
    g.active = false;
    return wasActive;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !latest.current.disabled,
      onMoveShouldSetPanResponder: () => false,

      onPanResponderGrant: (event) => {
        const g = gesture.current;
        g.touching = true;
        g.touch = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
        g.last = { dx: 0, dy: 0 };
        clearHoldTimer();
        g.holdTimer = setTimeout(lift, HOLD_TO_DRAG_MS);
      },

      onPanResponderMove: (_event, state) => {
        const g = gesture.current;
        g.last = { dx: state.dx, dy: state.dy };
        if (g.active) {
          latest.current.callbacks.onDragMove(state.dx, state.dy);
        } else if (Math.abs(state.dx) > MOVE_TO_DRAG || Math.abs(state.dy) > MOVE_TO_DRAG) {
          lift(); // started moving before the hold finished: pick the card up now
        }
      },

      onPanResponderRelease: (_event, state) => {
        if (endTouch()) {
          latest.current.callbacks.onDragEnd(state.dx, state.dy);
        }
      },

      onPanResponderTerminate: () => {
        if (endTouch()) {
          latest.current.callbacks.onDragCancel();
        }
      },

      // Once a card is lifted, don't let anything else take the gesture away.
      onPanResponderTerminationRequest: () => !gesture.current.active,
    }),
  ).current;

  return (
    <View
      ref={viewRef}
      collapsable={false}
      style={[styles.card, style, isDragging && styles.placeholder]}
      accessibilityLabel={`Description card: ${card.text}. Press and hold, then drag onto a term.`}
      {...panResponder.panHandlers}
    >
      {isDragging ? (
        // Empty slot while the card is being dragged.
        <Ionicons name="ellipsis-horizontal" size={iconSize.lg} color={colors.border} />
      ) : (
        <PlayingCardFace text={card.text} suitIndex={suitIndex} />
      )}
    </View>
  );
}

/** Playing-card front: suit in two corners, a faint suit in the middle, the description on top. */
function PlayingCardFace({ text, suitIndex }: { text: string; suitIndex: number }) {
  const suit = getSuit(suitIndex);
  return (
    <>
      <Text style={[styles.watermark, { color: suit.color }]} accessible={false}>
        {suit.symbol}
      </Text>
      <Text style={[styles.corner, styles.cornerTop, { color: suit.color }]} accessible={false}>
        {suit.symbol}
      </Text>
      <Text style={[styles.corner, styles.cornerBottom, { color: suit.color }]} accessible={false}>
        {suit.symbol}
      </Text>
      {/* Very long descriptions shrink to fit instead of being cut off. */}
      <Text style={styles.text} adjustsFontSizeToFit minimumFontScale={0.6} numberOfLines={12}>
        {text}
      </Text>
    </>
  );
}

/** The floating copy that follows the finger (rendered by the game screen). */
export function DescriptionCardGhost({ text, suitIndex }: { text: string; suitIndex: number }) {
  return (
    <View style={[styles.card, styles.ghost]}>
      <PlayingCardFace text={text} suitIndex={suitIndex} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Playing-card shaped box
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    overflow: 'hidden',
  },
  placeholder: {
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ghost: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.primary,
    elevation: 8, // Android shadow so the card looks lifted
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  corner: {
    position: 'absolute',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
  },
  cornerTop: {
    top: spacing.sm,
    left: spacing.sm,
  },
  cornerBottom: {
    bottom: spacing.sm,
    right: spacing.sm,
    transform: [{ rotate: '180deg' }], // upside-down, like a real card
  },
  watermark: {
    position: 'absolute',
    fontSize: 84,
    opacity: 0.07,
  },
  text: {
    ...typography.body,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
});
