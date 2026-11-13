import { useCallback, useEffect, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useSQLiteContext } from 'expo-sqlite';

import { getErrorMessage } from '@/services/errors';
import {
  DEFAULT_SOUND_EFFECTS_ENABLED,
  getSoundEffectsEnabled,
  setSoundEffectsEnabled,
} from '@/services/settingsService';
import type { SoundEffect } from '@/utils/soundRules';

import { useDatabaseQuery } from './useDatabaseQuery';

/** Bundled with the app (works offline). Regenerate with `node scripts/generate-sounds.mjs`. */
const SOUND_FILES: Record<SoundEffect, number> = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  complete: require('../../assets/sounds/complete.wav'),
};

/** Effects play a little below full volume so they stay pleasant. */
const EFFECT_VOLUME = 0.8;

/** The saved "Sound Effects" preference (on by default) and a function to change it. */
export function useSoundSetting() {
  const db = useSQLiteContext();
  const query = useDatabaseQuery(getSoundEffectsEnabled, DEFAULT_SOUND_EFFECTS_ENABLED);
  const setEnabled = useCallback(
    async (enabled: boolean) => {
      await setSoundEffectsEnabled(db, enabled);
    },
    [db],
  );
  return { enabled: query.data, isLoading: query.isLoading, error: query.error, setEnabled };
}

/**
 * Game sound effects. `play` is stable (safe in callbacks) and does nothing when sound is off.
 * Players are created once per screen and freed automatically when the screen closes.
 */
export function useSoundEffects() {
  const { enabled } = useSoundSetting();
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const players = {
    correct: useAudioPlayer(SOUND_FILES.correct),
    wrong: useAudioPlayer(SOUND_FILES.wrong),
    complete: useAudioPlayer(SOUND_FILES.complete),
  };
  const playersRef = useRef(players);
  playersRef.current = players;

  useEffect(() => {
    // Short effects mix with the player's own music instead of stopping it.
    // playsInSilentMode MUST stay true: on Android, false makes expo-audio silently skip every
    // sound whenever the phone is on vibrate or silent. The in-app "Sound Effects" switch
    // (Profile → Settings) is how players mute the game; loudness follows the media volume.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch((error) =>
      console.warn('[sounds] Could not set the audio mode:', getErrorMessage(error)),
    );
  }, []);

  const play = useCallback((effect: SoundEffect) => {
    if (!enabledRef.current) return;
    const player = playersRef.current[effect];
    try {
      player.volume = EFFECT_VOLUME;
      // Rewind first so the same sound can play again (e.g. two correct matches in a row).
      player.seekTo(0).catch(() => {});
      player.play();
    } catch (error) {
      // A sound problem must never break the game.
      console.warn(`[sounds] Could not play "${effect}":`, getErrorMessage(error));
    }
  }, []);

  return { play };
}
