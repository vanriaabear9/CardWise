import type { IconName } from '@/types';

export interface AvatarOption {
  /** Stored in the database (user_profile.avatar_id). Never change an existing id. */
  id: string;
  icon: IconName;
  label: string;
}

/** Built-in avatars (icons only; no photos or personal data). */
export const AVATARS: readonly AvatarOption[] = [
  { id: 'person', icon: 'person', label: 'Classic' },
  { id: 'school', icon: 'school', label: 'Graduate' },
  { id: 'book', icon: 'book', label: 'Bookworm' },
  { id: 'rocket', icon: 'rocket', label: 'Rocket' },
  { id: 'planet', icon: 'planet', label: 'Planet' },
  { id: 'flash', icon: 'flash', label: 'Lightning' },
  { id: 'flask', icon: 'flask', label: 'Scientist' },
  { id: 'leaf', icon: 'leaf', label: 'Leaf' },
  { id: 'paw', icon: 'paw', label: 'Paw' },
  { id: 'diamond', icon: 'diamond', label: 'Diamond' },
  { id: 'musical-notes', icon: 'musical-notes', label: 'Music' },
  { id: 'game-controller', icon: 'game-controller', label: 'Gamer' },
];

export const DEFAULT_AVATAR_ID = 'person';
export const DEFAULT_PLAYER_NAME = 'Player';
export const MAX_PLAYER_NAME_LENGTH = 30;

/** The avatar with this id, or the default one if the id is unknown. */
export function getAvatar(id: string | null | undefined): AvatarOption {
  return AVATARS.find((avatar) => avatar.id === id) ?? AVATARS[0];
}
