import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreventRemove, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import {
  AppButton,
  DescriptionCardGhost,
  DraggableDescriptionCard,
  EmptyState,
  GameStatsBar,
  IconButton,
  MatchFeedbackBanner,
  TermDropTarget,
} from '@/components';
import type { FeedbackKind, TermFlash, WindowRect } from '@/components';
import { colors, radius, spacing, typography } from '@/constants';
import { getErrorMessage } from '@/services/errors';
import { getTopicWithTerms } from '@/services/topicService';
import type { GameCard, GameState } from '@/types';
import { findDropTarget, type Point, type Rect } from '@/utils/dropTargets';
import {
  attemptMatch,
  getGameProgress,
  isTermComplete,
  prepareGame,
  summarizeGame,
  summaryToParams,
} from '@/utils/gameEngine';

interface GameScreenProps {
  topicId: number;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; title: string; message: string }
  | { status: 'ready' };

/** The card currently being dragged, and where its floating copy starts (relative to the screen root). */
interface ActiveDrag {
  card: GameCard;
  suitIndex: number;
  left: number;
  top: number;
  width: number;
  height: number;
  /** Where the finger holds the card (inside the card). The card shrinks around this point. */
  touch: Point;
}

/** Positions measured when a drag starts (window coordinates). */
interface DragGeometry {
  fingerStart: Point;
  terms: Map<number, Rect>;
  termsPanel: Rect | null;
}

const FEEDBACK_MS = 1800;
const FLASH_MS = 700;
const FINISH_DELAY_MS = 900;
const DEFAULT_HINT = 'Drag the top card onto its term. Use ◀ ▶ to see other cards.';

/** How long a card takes to fly back to the pile after a miss. */
const RETURN_MS = 160;
/** How long the card takes to shrink after being picked up. */
const SHRINK_MS = 140;
/** While dragging, the card shrinks to about a term card's width, within these limits. */
const MIN_DRAG_SCALE = 0.4;
const MAX_DRAG_SCALE = 0.8;

/** A rendered native view (has measureInWindow). */
type ViewHandle = ComponentRef<typeof View>;

function measure(view: ViewHandle | null): Promise<Rect | null> {
  return new Promise((resolve) => {
    if (!view) {
      resolve(null);
      return;
    }
    view.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
  });
}

/** Drag-and-drop matching game for one topic. */
export function GameScreen({ topicId }: GameScreenProps) {
  const db = useSQLiteContext();
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [game, setGame] = useState<GameState | null>(null);
  const gameRef = useRef<GameState | null>(null);
  const updateGame = (next: GameState) => {
    gameRef.current = next;
    setGame(next);
  };

  // ----- Drag state -----
  const [drag, setDrag] = useState<ActiveDrag | null>(null);
  /** Which remaining card is on top of the draw pile (wraps around). */
  const [deckIndex, setDeckIndex] = useState(0);
  const [scrollLocked, setScrollLocked] = useState(false);
  const [hoveredTermId, setHoveredTermId] = useState<number | null>(null);
  const hoveredRef = useRef<number | null>(null);
  const dragCardRef = useRef<GameCard | null>(null);
  const geometry = useRef<DragGeometry | null>(null);
  /** Resolves when the term positions for the current drag have been measured. */
  const geometryReady = useRef<Promise<DragGeometry | null> | null>(null);
  const ghostOffset = useRef(new Animated.ValueXY()).current;
  const ghostScale = useRef(new Animated.Value(1)).current;
  const returnAnimation = useRef<Animated.CompositeAnimation | null>(null);
  /** Window position of the screen root (measured on layout), so the floating card can appear instantly. */
  const rootOffset = useRef<Point>({ x: 0, y: 0 });

  const rootRef = useRef<ViewHandle>(null);
  const termsPanelRef = useRef<ViewHandle>(null);
  const termViews = useRef(new Map<number, ViewHandle>());

  // ----- Feedback -----
  const [feedback, setFeedback] = useState<{ kind: FeedbackKind; message: string; id: number } | null>(null);
  const [flash, setFlash] = useState<{ termId: number; kind: Exclude<TermFlash, null>; id: number } | null>(null);
  const showFeedback = (kind: FeedbackKind, message: string) =>
    setFeedback({ kind, message, id: Date.now() });

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash]);

  // ----- Load the topic (read-only) and prepare the game -----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const topic = await getTopicWithTerms(db, topicId);
        if (cancelled) return;
        if (!topic) {
          setLoadState({ status: 'error', title: 'Topic not found', message: 'This topic may have been deleted.' });
          return;
        }
        const prepared = prepareGame(topic);
        if (!prepared.ok) {
          setLoadState({ status: 'error', title: 'Nothing to play yet', message: prepared.reason });
          return;
        }
        updateGame(prepared.game);
        setLoadState({ status: 'ready' });
      } catch (error) {
        if (!cancelled) {
          setLoadState({ status: 'error', title: "Couldn't load this topic", message: getErrorMessage(error) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, topicId]);

  const progress = game ? getGameProgress(game) : null;
  const isPlaying = loadState.status === 'ready' && !!game && !game.completedAt;

  // ----- Leaving: confirm before abandoning an unfinished game (✕, Android back, swipe back) -----
  usePreventRemove(isPlaying, ({ repeat }) => {
    Alert.alert('Leave this game?', 'Your progress in this game will be lost.', [
      { text: 'Keep Playing', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: repeat },
    ]);
  });

  const leave = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // ----- Completion: hand the final numbers to the Results screen -----
  useEffect(() => {
    if (!game?.completedAt) return;
    const summary = summarizeGame(game);
    if (!summary) return;
    showFeedback('correct', 'All descriptions matched! Opening your results…');
    const timer = setTimeout(() => {
      router.replace({ pathname: '/game/results', params: summaryToParams(summary) });
    }, FINISH_DELAY_MS);
    return () => clearTimeout(timer);
    // Runs once when the game becomes complete.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.completedAt]);

  // ----- Drag handlers -----
  const finishDrag = () => {
    returnAnimation.current = null;
    dragCardRef.current = null;
    geometry.current = null;
    geometryReady.current = null;
    hoveredRef.current = null;
    setHoveredTermId(null);
    setDrag(null);
    setScrollLocked(false);
  };

  /** Quickly flies the card back to the pile (and back to full size), then ends the drag. */
  const returnCardToList = () => {
    const timing = { duration: RETURN_MS, easing: Easing.out(Easing.quad), useNativeDriver: false };
    const animation = Animated.parallel([
      Animated.timing(ghostOffset, { ...timing, toValue: { x: 0, y: 0 } }),
      Animated.timing(ghostScale, { ...timing, toValue: 1 }),
    ]);
    returnAnimation.current = animation;
    animation.start(() => {
      // Only the latest animation may end the drag.
      if (returnAnimation.current === animation) {
        finishDrag();
      }
    });
  };

  /** Measures where the terms are on screen right now (they may have been scrolled). */
  const measureGeometry = async (fingerStart: Point): Promise<DragGeometry> => {
    const [rootRect, panelRect, ...termRects] = await Promise.all([
      measure(rootRef.current),
      measure(termsPanelRef.current),
      ...[...termViews.current].map(([id, view]) => measure(view).then((rect) => [id, rect] as const)),
    ]);
    if (rootRect) rootOffset.current = { x: rootRect.x, y: rootRect.y };
    const terms = new Map<number, Rect>();
    for (const entry of termRects as (readonly [number, Rect | null])[]) {
      if (entry[1]) terms.set(entry[0], entry[1]);
    }
    return { fingerStart, terms, termsPanel: panelRect as Rect | null };
  };

  const handleDragStart = (card: GameCard, cardRect: WindowRect, touch: Point) => {
    returnAnimation.current?.stop();
    returnAnimation.current = null;
    dragCardRef.current = card;
    geometry.current = null;
    hoveredRef.current = null;
    ghostOffset.setValue({ x: 0, y: 0 });
    ghostScale.setValue(1);

    // Show the floating card IMMEDIATELY (no waiting for measurements).
    setScrollLocked(true);
    setDrag({
      card,
      suitIndex: Math.max(0, gameRef.current?.cards.findIndex((c) => c.id === card.id) ?? 0),
      left: cardRect.x - rootOffset.current.x,
      top: cardRect.y - rootOffset.current.y,
      width: cardRect.width,
      height: cardRect.height,
      touch,
    });

    // Measure the terms in the background; drops wait for this if needed.
    const fingerStart = { x: cardRect.x + touch.x, y: cardRect.y + touch.y };
    geometryReady.current = measureGeometry(fingerStart).then((geo) => {
      if (dragCardRef.current !== card) return null; // this drag is already over
      geometry.current = geo;

      // Shrink to about a term card's width so it fits over the terms.
      const termWidth = geo.terms.values().next().value?.width ?? cardRect.width * 0.5;
      const target = Math.min(MAX_DRAG_SCALE, Math.max(MIN_DRAG_SCALE, (termWidth * 0.9) / cardRect.width));
      Animated.timing(ghostScale, {
        toValue: target,
        duration: SHRINK_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
      return geo;
    });
  };

  const fingerPoint = (dx: number, dy: number): Point | null => {
    const geo = geometry.current;
    return geo ? { x: geo.fingerStart.x + dx, y: geo.fingerStart.y + dy } : null;
  };

  const handleDragMove = (dx: number, dy: number) => {
    ghostOffset.setValue({ x: dx, y: dy });
    const point = fingerPoint(dx, dy);
    const geo = geometry.current;
    if (!point || !geo) return;
    const termId = findDropTarget(point, geo.terms, geo.termsPanel);
    if (termId !== hoveredRef.current) {
      hoveredRef.current = termId;
      setHoveredTermId(termId);
    }
  };

  const handleDragEnd = async (dx: number, dy: number) => {
    const card = dragCardRef.current;
    hoveredRef.current = null;
    setHoveredTermId(null);
    if (!card) return;

    // A very quick drop can happen before the term positions are measured: wait for them.
    const geo = geometry.current ?? (await geometryReady.current) ?? null;
    if (dragCardRef.current !== card) return; // drag was already ended elsewhere
    const current = gameRef.current;

    if (!geo || !current) {
      returnCardToList();
      return;
    }

    const point = { x: geo.fingerStart.x + dx, y: geo.fingerStart.y + dy };
    const termId = findDropTarget(point, geo.terms, geo.termsPanel);
    if (termId === null) {
      showFeedback('info', 'Drop the card on a term to check your answer.');
      returnCardToList();
      return;
    }

    const { state, outcome } = attemptMatch(current, card.id, termId);
    const termText = state.terms.find((t) => t.id === termId)?.termText ?? 'that term';

    if (outcome === 'correct') {
      updateGame(state);
      setFlash({ termId, kind: 'correct', id: Date.now() });
      showFeedback('correct', `Correct! Matched to "${termText}". +1 point`);
      finishDrag(); // the card is now matched and leaves the list
    } else if (outcome === 'incorrect') {
      updateGame(state);
      setFlash({ termId, kind: 'incorrect', id: Date.now() });
      showFeedback('incorrect', `Not a match for "${termText}". Try another term.`);
      returnCardToList(); // the card stays available
    } else {
      returnCardToList();
    }
  };

  // ----- Render -----
  const header = (
    <View style={styles.header}>
      <IconButton icon="close" accessibilityLabel="Leave game" onPress={leave} />
      <View style={styles.headerText}>
        <Text style={styles.headerLabel}>Matching game</Text>
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {game?.topicTitle ?? 'Loading…'}
        </Text>
      </View>
    </View>
  );

  if (loadState.status !== 'ready' || !game || !progress) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.root}>
          {header}
          {loadState.status === 'error' ? (
            <EmptyState icon="alert-circle-outline" title={loadState.title} message={loadState.message}>
              <AppButton label="Back" icon="arrow-back" onPress={leave} />
            </EmptyState>
          ) : (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const remainingCards = game.cards.filter((card) => !card.matched);
  // Decorative suit per card = its position in the shuffled deck (unrelated to the answer).
  const suitIndexById = new Map(game.cards.map((card, index) => [card.id, index]));
  const completedTerms = game.terms.filter(isTermComplete).length;
  const cardsDisabled = drag !== null || game.completedAt !== null;

  // Draw pile: one card on top. After a correct match the matched card leaves the list,
  // so the same index now points at the next card. Wrap around at the end.
  const deckSize = remainingCards.length;
  const topPosition = deckSize === 0 ? 0 : deckIndex % deckSize;
  const topCard = deckSize === 0 ? null : remainingCards[topPosition];
  const browseDisabled = deckSize < 2 || cardsDisabled;
  const showPrevious = () => setDeckIndex((topPosition - 1 + deckSize) % deckSize);
  const showNext = () => setDeckIndex((topPosition + 1) % deckSize);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View
        ref={rootRef}
        collapsable={false}
        style={styles.root}
        onLayout={() => {
          // Remember where the screen sits in the window, so a picked-up card can appear instantly.
          void measure(rootRef.current).then((rect) => {
            if (rect) rootOffset.current = { x: rect.x, y: rect.y };
          });
        }}
      >
        {header}

        <GameStatsBar progress={progress} />

        <Text style={styles.instructions}>Drag each description to its matching term.</Text>
        <MatchFeedbackBanner
          kind={feedback?.kind ?? 'info'}
          message={feedback?.message ?? DEFAULT_HINT}
        />

        {/* Terms (drop targets) */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Terms</Text>
            <Text style={styles.panelMeta}>
              {completedTerms}/{game.terms.length} complete
            </Text>
          </View>
          <View ref={termsPanelRef} collapsable={false} style={styles.panelBody}>
            <ScrollView
              scrollEnabled={!scrollLocked}
              contentContainerStyle={styles.termsGrid}
              showsVerticalScrollIndicator
            >
              {game.terms.map((term) => (
                <TermDropTarget
                  key={term.id}
                  term={term}
                  hovered={hoveredTermId === term.id}
                  flash={flash?.termId === term.id ? flash.kind : null}
                  targetRef={(view) => {
                    if (view) termViews.current.set(term.id, view);
                    else termViews.current.delete(term.id);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Descriptions: a solitaire-style draw pile (no scrolling, so drags are never mistaken for scrolls) */}
        <View style={[styles.panel, styles.descriptionsPanel]}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Descriptions</Text>
            <Text style={styles.panelMeta}>
              {deckSize === 0 ? 'All matched' : `Card ${topPosition + 1} of ${deckSize}`}
            </Text>
          </View>

          {topCard ? (
            <View style={styles.deckRow}>
              <View style={browseDisabled && styles.browseDisabled}>
                <IconButton
                  icon="chevron-back"
                  accessibilityLabel="Previous card"
                  onPress={browseDisabled ? undefined : showPrevious}
                />
              </View>

              <View style={styles.pile}>
                {/* Edges of the cards underneath, so it reads as a stack */}
                {deckSize > 2 ? <View style={[styles.pileEdge, styles.pileEdgeBack]} /> : null}
                {deckSize > 1 ? <View style={[styles.pileEdge, styles.pileEdgeMiddle]} /> : null}
                <DraggableDescriptionCard
                  key={topCard.id}
                  card={topCard}
                  suitIndex={suitIndexById.get(topCard.id) ?? 0}
                  disabled={cardsDisabled}
                  isDragging={drag?.card.id === topCard.id || dragCardRef.current?.id === topCard.id}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onDragCancel={returnCardToList}
                  style={styles.topCard}
                />
              </View>

              <View style={browseDisabled && styles.browseDisabled}>
                <IconButton
                  icon="chevron-forward"
                  accessibilityLabel="Next card"
                  onPress={browseDisabled ? undefined : showNext}
                />
              </View>
            </View>
          ) : (
            <View style={[styles.panelBody, styles.allDoneBox]}>
              <Text style={styles.allDone}>All descriptions matched!</Text>
            </View>
          )}
        </View>

        {/* Floating copy of the dragged card, drawn above everything */}
        {drag ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ghostLayer,
              { left: drag.left, top: drag.top, width: drag.width, height: drag.height },
              {
                // Shrink around the finger so the card stays under the fingertip.
                transformOrigin: [drag.touch.x, drag.touch.y, 0],
                transform: [...ghostOffset.getTranslateTransform(), { scale: ghostScale }],
              },
            ]}
          >
            <DescriptionCardGhost text={drag.card.text} suitIndex={drag.suitIndex} />
          </Animated.View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  root: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerLabel: typography.label,
  title: typography.heading,
  instructions: {
    ...typography.body,
    color: colors.highlight,
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    flex: 1,
    minHeight: 140,
    gap: spacing.sm,
  },
  descriptionsPanel: {
    flex: 1.15,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  panelTitle: typography.subheading,
  panelMeta: typography.caption,
  panelBody: {
    flex: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  termsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  // Draw pile: ◀ [stacked cards] ▶
  deckRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  browseDisabled: {
    opacity: 0.35,
  },
  pile: {
    flex: 1,
    alignSelf: 'stretch',
    paddingTop: 10, // room for the stacked edges peeking out above the top card
  },
  pileEdge: {
    position: 'absolute',
    height: 24,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pileEdgeBack: {
    top: 0,
    left: 16,
    right: 16,
  },
  pileEdgeMiddle: {
    top: 5,
    left: 8,
    right: 8,
    borderColor: colors.secondary,
    opacity: 0.6,
  },
  topCard: {
    flex: 1,
  },
  allDoneBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  allDone: {
    ...typography.subheading,
    color: colors.highlight,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  ghostLayer: {
    position: 'absolute',
    zIndex: 10,
    elevation: 10,
  },
});
