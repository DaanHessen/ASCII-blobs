/**
 * The coalesce/dissolve cycle, and the pointer that disturbs it.
 *
 * Kept as pure functions so the timing can be tested without a GPU. The shape
 * of the cycle is the whole design: a portrait that simply pulsed in and out
 * on a sine would read as a loop within two repetitions. This holds at each
 * extreme instead, so the eye gets a formed face long enough to recognise and
 * a dispersed field long enough to forget it — and the asymmetry between the
 * fast gather and the slow scatter is what makes it feel like settling rather
 * than blinking.
 */

export type CoherencePhase = 'gathering' | 'held' | 'scattering' | 'drifting';

/** Fractions of one cycle. They sum to 1. */
const GATHER = 0.24;
const HOLD = 0.26;
const SCATTER = 0.32;

const smootherstep = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

export const coherenceAt = (elapsedMs: number, cycleSeconds: number): number => {
  const cycle = Math.max(1e-3, cycleSeconds * 1000);
  const t = ((elapsedMs % cycle) + cycle) % cycle / cycle;

  if (t < GATHER) {
    return smootherstep(t / GATHER);
  }
  if (t < GATHER + HOLD) {
    return 1;
  }
  if (t < GATHER + HOLD + SCATTER) {
    return 1 - smootherstep((t - GATHER - HOLD) / SCATTER);
  }
  return 0;
};

export const phaseAt = (elapsedMs: number, cycleSeconds: number): CoherencePhase => {
  const cycle = Math.max(1e-3, cycleSeconds * 1000);
  const t = ((elapsedMs % cycle) + cycle) % cycle / cycle;
  if (t < GATHER) return 'gathering';
  if (t < GATHER + HOLD) return 'held';
  if (t < GATHER + HOLD + SCATTER) return 'scattering';
  return 'drifting';
};

export type PointerState = {
  /** Position in grid cells. */
  x: number;
  y: number;
  /** 0-1, eased toward 1 while active and decaying while idle. */
  strength: number;
};

export type PointerTargets = {
  x: number;
  y: number;
  active: boolean;
};

/**
 * Eases the pointer toward its target. The position lags deliberately: a well
 * that tracks the cursor exactly feels like a cursor-shaped hole, while one
 * that trails slightly feels like something being pushed through a material.
 */
export const advancePointer = (
  state: PointerState,
  targets: PointerTargets,
  deltaMs: number,
): void => {
  const follow = 1 - Math.pow(0.988, deltaMs);
  state.x += (targets.x - state.x) * follow;
  state.y += (targets.y - state.y) * follow;

  const target = targets.active ? 1 : 0;
  // Asymmetric: engages quickly, releases slowly, so the face reassembles as a
  // settling rather than a snap.
  const rate = targets.active ? 0.992 : 0.9985;
  state.strength += (target - state.strength) * (1 - Math.pow(rate, deltaMs));
};

/**
 * Where the well sits when there is no pointer at all — every touch device,
 * and any desktop visitor who has not moved the mouse yet. A slow Lissajous
 * wander reads as something moving over the surface of its own accord; the
 * incommensurate frequencies keep it from retracing a visible loop.
 */
export const idlePointer = (
  elapsedMs: number,
  columns: number,
  rows: number,
): PointerTargets => {
  const t = elapsedMs * 0.00008;
  return {
    x: columns * (0.5 + 0.34 * Math.sin(t) * Math.cos(t * 0.41)),
    y: rows * (0.5 + 0.3 * Math.sin(t * 0.73 + 1.1)),
    active: true,
  };
};

export type PortraitRect = {
  /** Top-left corner in cells. */
  x: number;
  y: number;
  /** Size in cells. */
  width: number;
  height: number;
};

/**
 * Places the portrait in grid space. Sized from the viewport's shorter
 * relationship to its own aspect so the face neither overflows a phone in
 * portrait nor shrinks to a stamp on a wide desktop.
 */
export const portraitRect = (
  columns: number,
  rows: number,
  aspect: number,
  scale: number,
  centerX: number,
  centerY: number,
): PortraitRect => {
  const byHeight = rows * scale;
  const byWidth = (columns * scale) / aspect;
  const height = Math.min(byHeight, byWidth);
  const width = height * aspect;

  return {
    x: columns * centerX - width / 2,
    y: rows * centerY - height / 2,
    width,
    height,
  };
};
