/**
 * Generates CardWise's sound effects as small WAV files in assets/sounds/.
 *
 * The sounds are ORIGINAL: they are synthesized here from plain sine-wave tones, so there are
 * no licensing concerns and nothing is downloaded. Run again after changing a sound:
 *
 *   node scripts/generate-sounds.mjs
 *
 * Format: 22,050 Hz, 16-bit, mono WAV (plays on Android and iOS; each file is only a few KB).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 22050;
/** Peak loudness (0..1). Kept well below full scale so effects are gentle, never jarring. */
const PEAK = 0.32;

/**
 * One tone.
 * @param {number} start   seconds from the beginning of the sound
 * @param {number} length  seconds
 * @param {number} freq    start frequency (Hz)
 * @param {object} [opts]
 * @param {number} [opts.endFreq]   glide to this frequency (Hz)
 * @param {number} [opts.decay]     larger = fades faster (a bell-like "ding")
 * @param {number} [opts.overtone]  loudness of a soft octave overtone (0..1)
 * @param {number} [opts.gain]      relative loudness of this tone
 */
const tone = (start, length, freq, opts = {}) => ({ start, length, freq, ...opts });

function render(tones) {
  const total = Math.max(...tones.map((t) => t.start + t.length)) + 0.02;
  const samples = new Float64Array(Math.ceil(total * SAMPLE_RATE));

  for (const t of tones) {
    const { start, length, freq, endFreq = freq, decay = 6, overtone = 0.15, gain = 1 } = t;
    const first = Math.floor(start * SAMPLE_RATE);
    const count = Math.floor(length * SAMPLE_RATE);
    let phase = 0;
    for (let i = 0; i < count; i += 1) {
      const time = i / SAMPLE_RATE;
      const progress = i / count;
      const f = freq + (endFreq - freq) * progress;
      phase += (2 * Math.PI * f) / SAMPLE_RATE;
      // Envelope: 6 ms soft start, exponential decay, 15 ms fade-out (no clicks).
      const attack = Math.min(1, time / 0.006);
      const release = Math.min(1, (length - time) / 0.015);
      const env = attack * release * Math.exp(-decay * time);
      const wave = Math.sin(phase) + overtone * Math.sin(2 * phase);
      samples[first + i] += gain * env * wave;
    }
  }

  // Normalize to PEAK so every sound has the same gentle maximum loudness.
  const max = samples.reduce((m, s) => Math.max(m, Math.abs(s)), 0) || 1;
  return samples.map((s) => (s / max) * PEAK);
}

function toWav(samples) {
  const dataBytes = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);
  samples.forEach((s, i) => buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2));
  return buffer;
}

const SOUNDS = {
  // Correct: a bright two-note chime going up (C6 → G6). ~0.35 s.
  correct: [
    tone(0, 0.18, 1046.5, { decay: 9, overtone: 0.2 }),
    tone(0.08, 0.27, 1568.0, { decay: 7, overtone: 0.15 }),
  ],
  // Wrong: a soft, low "boop" sliding down (A3 → E3). Gentle, not a buzzer. ~0.3 s.
  wrong: [tone(0, 0.3, 220, { endFreq: 165, decay: 5, overtone: 0.3 })],
  // Complete: a rising C-major arpeggio ending on a held chord. Distinct from "correct". ~0.8 s,
  // so it finishes before the game opens the Results screen (FINISH_DELAY_MS = 900 ms).
  complete: [
    tone(0.0, 0.17, 523.25, { decay: 6 }),
    tone(0.09, 0.17, 659.25, { decay: 6 }),
    tone(0.18, 0.17, 783.99, { decay: 6 }),
    tone(0.27, 0.55, 1046.5, { decay: 3.5, gain: 1 }),
    tone(0.27, 0.55, 783.99, { decay: 3.5, gain: 0.55 }),
    tone(0.27, 0.55, 659.25, { decay: 3.5, gain: 0.45 }),
  ],
};

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');
mkdirSync(outDir, { recursive: true });
for (const [name, tones] of Object.entries(SOUNDS)) {
  const wav = toWav(render(tones));
  writeFileSync(path.join(outDir, `${name}.wav`), wav);
  console.log(`${name}.wav  ${(wav.length / 1024).toFixed(1)} KB  ${((wav.length - 44) / 2 / SAMPLE_RATE).toFixed(2)} s`);
}
