/*
 * CardWise matching-game rules. No UI code, so it can be tested on its own.
 *
 * - Each description is a separate card worth at most 1 point.
 * - A card dropped on its own term is correct; on another term it is incorrect.
 * - FIRST-TRY POINTS: a card earns its point only if its very first drop is correct.
 *   After a wrong drop it can still be placed (to finish the game) but no longer scores.
 * - A matched card can never score again.
 * - The game is complete when every card is matched.
 * - Every card remembers its first attempted term and number of attempts (for the answer review).
 */
import type {
  GameCard,
  GameState,
  GameSummary,
  GameTerm,
  MatchOutcome,
  NewGameAnswerInput,
  NewGameResultInput,
  TopicWithTerms,
} from '@/types';

type RandomFn = () => number;

/** Fisher–Yates shuffle. Returns a NEW array; the input is not changed. */
export function shuffle<T>(items: readonly T[], random: RandomFn = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Shuffles so the result is NOT in the original order (when that's possible, i.e. 2+ items).
 * A random shuffle can occasionally return the same order, so retry, then rotate as a last resort.
 */
export function shuffleAwayFromOriginal<T>(items: readonly T[], random: RandomFn = Math.random): T[] {
  if (items.length < 2) {
    return [...items];
  }
  const sameOrder = (candidate: T[]) => candidate.every((item, index) => item === items[index]);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = shuffle(items, random);
    if (!sameOrder(candidate)) {
      return candidate;
    }
  }
  return [...items.slice(1), items[0]];
}

/** A unique id for one play-through (time + randomness; no extra libraries needed). */
export function createGameId(random: RandomFn = Math.random): string {
  const randomPart = Array.from({ length: 3 }, () => Math.floor(random() * 0x100000000).toString(36)).join('');
  return `${Date.now().toString(36)}-${randomPart}`;
}

export type PrepareGameResult =
  | { ok: true; game: GameState }
  | { ok: false; reason: string };

/**
 * Builds a new game from a saved topic. The topic object is only read, never modified.
 * Terms without descriptions are left out (they have nothing to match).
 */
export function prepareGame(
  topic: TopicWithTerms,
  options: { random?: RandomFn; now?: () => string; gameId?: string } = {},
): PrepareGameResult {
  const random = options.random ?? Math.random;
  const now = options.now ?? (() => new Date().toISOString());

  const playableTerms = topic.terms.filter((term) =>
    term.descriptions.some((d) => d.descriptionText.trim() !== ''),
  );

  if (playableTerms.length === 0) {
    return {
      ok: false,
      reason: 'This topic has no terms with descriptions yet, so there is nothing to match.',
    };
  }

  const terms: GameTerm[] = [];
  const cards: GameCard[] = [];
  for (const term of playableTerms) {
    const descriptions = term.descriptions.filter((d) => d.descriptionText.trim() !== '');
    terms.push({
      id: term.id,
      termText: term.termText,
      totalDescriptions: descriptions.length,
      matchedCount: 0,
    });
    for (const description of descriptions) {
      cards.push({
        id: description.id,
        termId: term.id,
        text: description.descriptionText,
        matched: false,
        order: cards.length,
        attempts: 0,
        firstAttemptTermId: null,
      });
    }
  }

  return {
    ok: true,
    game: {
      gameId: options.gameId ?? createGameId(random),
      topicId: topic.id,
      topicTitle: topic.title,
      terms,
      cards: shuffleAwayFromOriginal(cards, random),
      score: 0,
      totalDescriptions: cards.length,
      incorrectAttempts: 0,
      startedAt: now(),
      completedAt: null,
    },
  };
}

/**
 * Applies one drop of a card onto a term. Returns a NEW state plus what happened.
 * - 'ignored': game already over, card unknown/already matched, or term unknown.
 * - `pointAwarded`: true only for a correct drop that was the card's FIRST drop.
 */
export function attemptMatch(
  state: GameState,
  cardId: number,
  termId: number,
  now: () => string = () => new Date().toISOString(),
): { state: GameState; outcome: MatchOutcome; pointAwarded: boolean } {
  if (state.completedAt) {
    return { state, outcome: 'ignored', pointAwarded: false };
  }
  const card = state.cards.find((c) => c.id === cardId);
  const term = state.terms.find((t) => t.id === termId);
  if (!card || card.matched || !term) {
    return { state, outcome: 'ignored', pointAwarded: false };
  }

  const isCorrect = card.termId === termId;
  const isFirstTry = card.attempts === 0;
  // Record the attempt on the card (first attempted term is kept forever).
  const recorded: GameCard = {
    ...card,
    matched: isCorrect,
    attempts: card.attempts + 1,
    firstAttemptTermId: card.firstAttemptTermId ?? termId,
  };
  const cards = state.cards.map((c) => (c.id === cardId ? recorded : c));

  if (!isCorrect) {
    return {
      state: { ...state, cards, incorrectAttempts: state.incorrectAttempts + 1 },
      outcome: 'incorrect',
      pointAwarded: false,
    };
  }

  const terms = state.terms.map((t) =>
    t.id === termId ? { ...t, matchedCount: t.matchedCount + 1 } : t,
  );
  const score = state.score + (isFirstTry ? 1 : 0);
  const isComplete = cards.every((c) => c.matched);

  return {
    state: { ...state, cards, terms, score, completedAt: isComplete ? now() : null },
    outcome: 'correct',
    pointAwarded: isFirstTry,
  };
}

export function isTermComplete(term: GameTerm): boolean {
  return term.matchedCount >= term.totalDescriptions;
}

export interface GameProgress {
  score: number;
  total: number;
  matched: number;
  remaining: number;
  /** 0..1 */
  fraction: number;
  isComplete: boolean;
}

export function getGameProgress(state: GameState): GameProgress {
  const matched = state.cards.filter((c) => c.matched).length;
  const total = state.totalDescriptions;
  return {
    score: state.score,
    total,
    matched,
    remaining: total - matched,
    fraction: total === 0 ? 0 : matched / total,
    isComplete: state.completedAt !== null,
  };
}

/** Final numbers of a completed game. Returns null if the game isn't finished. */
export function summarizeGame(state: GameState): GameSummary | null {
  if (!state.completedAt) {
    return null;
  }
  return {
    topicId: state.topicId,
    topicTitle: state.topicTitle,
    score: state.score,
    totalDescriptions: state.totalDescriptions,
    correctMatches: state.cards.filter((c) => c.matched).length,
    incorrectAttempts: state.incorrectAttempts,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
    durationMs: Math.max(0, Date.parse(state.completedAt) - Date.parse(state.startedAt)),
  };
}

/**
 * Everything to save for a completed game, including a text snapshot of every description
 * in the topic's order. Returns null if the game isn't finished.
 */
export function buildGameRecord(state: GameState): NewGameResultInput | null {
  const summary = summarizeGame(state);
  if (!summary) {
    return null;
  }
  const termIndex = new Map(state.terms.map((term, index) => [term.id, index]));
  const termText = new Map(state.terms.map((term) => [term.id, term.termText]));

  const answers: NewGameAnswerInput[] = [...state.cards]
    .sort((a, b) => a.order - b.order)
    .map((card) => ({
      termPosition: termIndex.get(card.termId) ?? 0,
      termText: termText.get(card.termId) ?? '',
      descriptionText: card.text,
      firstAttemptTermText:
        card.firstAttemptTermId === null ? null : (termText.get(card.firstAttemptTermId) ?? null),
      // Compare ids, not text: two terms could have the same wording.
      firstAttemptCorrect: card.firstAttemptTermId === null ? null : card.firstAttemptTermId === card.termId,
      attempts: card.attempts,
    }));

  return {
    gameUid: state.gameId,
    topicId: summary.topicId,
    topicTitle: summary.topicTitle,
    score: summary.score,
    totalQuestions: summary.totalDescriptions,
    correctMatches: summary.correctMatches,
    incorrectAttempts: summary.incorrectAttempts,
    durationMs: summary.durationMs,
    startedAt: summary.startedAt,
    completedAt: summary.completedAt,
    answers,
  };
}

// ---------- Passing the summary to the Results screen (route params are strings) ----------
// Used only as a fallback when a finished game could not be saved.

export type GameSummaryParams = Record<keyof GameSummary, string>;

export function summaryToParams(summary: GameSummary): GameSummaryParams {
  return {
    topicId: String(summary.topicId),
    topicTitle: summary.topicTitle,
    score: String(summary.score),
    totalDescriptions: String(summary.totalDescriptions),
    correctMatches: String(summary.correctMatches),
    incorrectAttempts: String(summary.incorrectAttempts),
    startedAt: summary.startedAt,
    completedAt: summary.completedAt,
    durationMs: String(summary.durationMs),
  };
}

/** Reads the summary back from route params. Returns null if anything is missing or invalid. */
export function paramsToSummary(params: Partial<Record<string, string | string[]>>): GameSummary | null {
  const get = (key: keyof GameSummary): string | undefined => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const toInt = (key: keyof GameSummary): number | null => {
    const raw = get(key);
    if (raw === undefined || !/^\d+$/.test(raw)) return null;
    return Number(raw);
  };

  const topicId = toInt('topicId');
  const score = toInt('score');
  const totalDescriptions = toInt('totalDescriptions');
  const correctMatches = toInt('correctMatches');
  const incorrectAttempts = toInt('incorrectAttempts');
  const durationMs = toInt('durationMs');
  const topicTitle = get('topicTitle');
  const startedAt = get('startedAt');
  const completedAt = get('completedAt');

  if (
    topicId === null ||
    score === null ||
    totalDescriptions === null ||
    correctMatches === null ||
    incorrectAttempts === null ||
    durationMs === null ||
    !topicTitle ||
    !startedAt ||
    !completedAt ||
    score > totalDescriptions
  ) {
    return null;
  }
  return {
    topicId,
    topicTitle,
    score,
    totalDescriptions,
    correctMatches,
    incorrectAttempts,
    startedAt,
    completedAt,
    durationMs,
  };
}
