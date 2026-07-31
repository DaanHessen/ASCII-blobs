/**
 * Gradient noise and domain-warped fBm for the 2D fallback.
 *
 * This is the same *algorithm* as the GLSL in `gl/shaders.ts` — same octave
 * structure, same rotation between octaves, same two-level domain warp — but
 * not the same hash. The shader uses a sin-based hash because that is what is
 * cheap on a GPU; here a permutation table is roughly an order of magnitude
 * faster than calling Math.sin three times per lattice corner. So the two
 * paths produce fields of the same character, not identical fields. Nothing
 * depends on them matching pixel for pixel.
 */

const PERMUTATION = (() => {
  // Fixed table rather than a seeded shuffle: the field should look the same
  // on every visit, so that reloading the page is not a different artwork.
  const source = new Uint8Array(256);
  for (let i = 0; i < 256; i += 1) {
    source[i] = i;
  }
  let seed = 1013904223;
  for (let i = 255; i > 0; i -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const swap = source[i]!;
    source[i] = source[j]!;
    source[j] = swap;
  }

  const table = new Uint8Array(512);
  for (let i = 0; i < 512; i += 1) {
    table[i] = source[i & 255]!;
  }
  return table;
})();

/** The 12 edge-midpoint gradients of a cube, the standard Perlin set. */
const GRADIENTS = new Float32Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1,
  0, 1, -1, 0, -1, -1,
]);

const fade = (t: number): number => t * t * (3 - 2 * t);

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const dotGradient = (hash: number, x: number, y: number, z: number): number => {
  const index = (hash % 12) * 3;
  return GRADIENTS[index]! * x + GRADIENTS[index + 1]! * y + GRADIENTS[index + 2]! * z;
};

/** Gradient noise in three dimensions. The third is time. */
export const gradientNoise = (x: number, y: number, z: number): number => {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  const fz = Math.floor(z);

  const xi = fx & 255;
  const yi = fy & 255;
  const zi = fz & 255;

  const dx = x - fx;
  const dy = y - fy;
  const dz = z - fz;

  const u = fade(dx);
  const v = fade(dy);
  const w = fade(dz);

  const a = PERMUTATION[xi]! + yi;
  const aa = PERMUTATION[a & 255]! + zi;
  const ab = PERMUTATION[(a + 1) & 255]! + zi;
  const b = PERMUTATION[(xi + 1) & 255]! + yi;
  const ba = PERMUTATION[b & 255]! + zi;
  const bb = PERMUTATION[(b + 1) & 255]! + zi;

  return lerp(
    lerp(
      lerp(
        dotGradient(PERMUTATION[aa & 255]!, dx, dy, dz),
        dotGradient(PERMUTATION[ba & 255]!, dx - 1, dy, dz),
        u,
      ),
      lerp(
        dotGradient(PERMUTATION[ab & 255]!, dx, dy - 1, dz),
        dotGradient(PERMUTATION[bb & 255]!, dx - 1, dy - 1, dz),
        u,
      ),
      v,
    ),
    lerp(
      lerp(
        dotGradient(PERMUTATION[(aa + 1) & 255]!, dx, dy, dz - 1),
        dotGradient(PERMUTATION[(ba + 1) & 255]!, dx - 1, dy, dz - 1),
        u,
      ),
      lerp(
        dotGradient(PERMUTATION[(ab + 1) & 255]!, dx, dy - 1, dz - 1),
        dotGradient(PERMUTATION[(bb + 1) & 255]!, dx - 1, dy - 1, dz - 1),
        u,
      ),
      v,
    ),
    w,
  );
};

// Rotating between octaves stops the lobes of successive octaves lining up,
// which otherwise leaves faint diagonal seams across the whole field.
const ROTATION_COS = 0.8;
const ROTATION_SIN = 0.6;

export const fbm = (x: number, y: number, t: number, octaves: number): number => {
  let sum = 0;
  let amplitude = 0.5;
  let normalisation = 0;
  let px = x;
  let py = y;
  let time = t;

  for (let i = 0; i < octaves; i += 1) {
    sum += amplitude * gradientNoise(px, py, time);
    normalisation += amplitude;

    const rx = ROTATION_COS * px + ROTATION_SIN * py;
    const ry = -ROTATION_SIN * px + ROTATION_COS * py;
    px = rx * 2.02;
    py = ry * 2.02;
    time *= 1.17;
    amplitude *= 0.5;
  }

  return sum / Math.max(normalisation, 1e-4);
};

/**
 * Domain-warped fBm. The fallback uses a single warp level where the shader
 * uses two: the second level costs another three fBm evaluations per cell,
 * which the GPU does not notice and a CPU very much does. The result is
 * softer — billows rather than filaments — which is the right thing to lose.
 */
export const warpedField = (
  x: number,
  y: number,
  t: number,
  warp: number,
  octaves: number,
): number => {
  const qx = fbm(x, y, t, octaves);
  const qy = fbm(x + 5.2, y + 1.3, t, octaves);
  return fbm(x + warp * qx, y + warp * qy, t * 0.71, octaves);
};
