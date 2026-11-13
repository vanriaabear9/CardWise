import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

/** Any valid Ionicons glyph name, e.g. 'home' or 'time-outline'. */
export type IconName = ComponentProps<typeof Ionicons>['name'];

/*
 * Core data models for CardWise.
 * These describe the shape of the data only; nothing reads or stores them yet.
 * The local database (src/database) will use these same types later.
 */

/** A single flashcard: a term and its description. */
export interface Term {
  id: string;
  term: string;
  description: string;
}

/** A study topic made of terms. */
export interface Topic {
  id: string;
  title: string;
  description: string;
  terms: Term[];
  isFavorite: boolean;
  createdAt: string; // ISO date string
}

/**
 * Lightweight topic info for lists and cards (no full term list).
 * `cardCount` is the number of terms in the topic.
 */
export interface TopicSummary {
  id: string;
  title: string;
  description: string;
  cardCount: number;
}

/** The result of one finished game. */
export interface GameResult {
  id: string;
  topicId: string;
  topicTitle: string;
  score: number;
  totalQuestions: number;
  playedAt: string; // ISO date string
}
