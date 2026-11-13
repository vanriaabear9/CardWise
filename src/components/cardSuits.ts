import { colors } from '@/constants';

/**
 * Decorative playing-card suits for description cards.
 * "︎" asks the phone to draw the symbol as plain text (not a colorful emoji),
 * so the suit can use our theme colors.
 *
 * ♥ and ♦ use lavender instead of red, because red already means "wrong answer" in the game.
 */
const SUITS = [
  { name: 'spades', symbol: '♠︎', color: colors.textPrimary },
  { name: 'hearts', symbol: '♥︎', color: colors.highlight },
  { name: 'clubs', symbol: '♣︎', color: colors.textPrimary },
  { name: 'diamonds', symbol: '♦︎', color: colors.highlight },
] as const;

export type Suit = (typeof SUITS)[number];

/** Suit for a card at position `index` in the shuffled deck (cycles ♠ ♥ ♣ ♦). */
export function getSuit(index: number): Suit {
  return SUITS[((index % SUITS.length) + SUITS.length) % SUITS.length];
}
