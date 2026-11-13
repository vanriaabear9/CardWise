import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

/** Any valid Ionicons glyph name, e.g. 'home' or 'time-outline'. */
export type IconName = ComponentProps<typeof Ionicons>['name'];

// Data models — these match the local SQLite tables (see src/database/schema.ts).
export type { Description } from './description';
export type { GameCard, GameState, GameSummary, GameTerm, MatchOutcome } from './game';
export type {
  GameAnswer,
  GameResult,
  GameResultDetail,
  HistoryStats,
  HistoryTopic,
  NewGameAnswerInput,
  NewGameResultInput,
} from './gameHistory';
export type {
  EditDescriptionInput,
  EditTermInput,
  NewTermInput,
  Term,
  TermWithDescriptions,
} from './term';
export type {
  NewTopicInput,
  Topic,
  TopicEditInput,
  TopicSummary,
  TopicUpdate,
  TopicWithTerms,
} from './topic';
