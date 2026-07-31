import { describe, expect, it } from 'vitest';
import { fbm, gradientNoise, warpedField } from '../noise';

describe('gradientNoise', () => {
  it('is zero at lattice points', () => {
    // Gradient noise is a dot product with the offset from the corner, so at a
    // corner every term is zero. If this fails the lattice is misaligned and
    // the field will show a visible grid.
    for (const [x, y, z] of [
      [0, 0, 0],
      [3, -7, 12],
      [128, 64, 1],
    ]) {
      expect(Math.abs(gradientNoise(x!, y!, z!))).toBeLessThan(1e-12);
    }
  });

  it('stays within the expected range', () => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 20000; i += 1) {
      const value = gradientNoise(i * 0.017, i * 0.031 + 4.2, i * 0.009);
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
    expect(min).toBeGreaterThan(-1.2);
    expect(max).toBeLessThan(1.2);
    // A field that never leaves the middle would quantise to one glyph.
    expect(max - min).toBeGreaterThan(0.8);
  });

  it('is continuous', () => {
    const step = 1e-4;
    for (let i = 0; i < 500; i += 1) {
      const x = i * 0.37;
      const a = gradientNoise(x, 2.5, 1.25);
      const b = gradientNoise(x + step, 2.5, 1.25);
      expect(Math.abs(b - a)).toBeLessThan(0.02);
    }
  });

  it('is deterministic across calls', () => {
    expect(gradientNoise(1.5, 2.5, 3.5)).toBe(gradientNoise(1.5, 2.5, 3.5));
  });
});

describe('fbm', () => {
  it('is normalised to roughly the noise range regardless of octave count', () => {
    for (const octaves of [1, 3, 5, 8]) {
      let max = 0;
      for (let i = 0; i < 4000; i += 1) {
        max = Math.max(max, Math.abs(fbm(i * 0.013, i * 0.021, 0.5, octaves)));
      }
      expect(max).toBeLessThan(1.2);
    }
  });

  it('adds detail as octaves increase', () => {
    const roughness = (octaves: number): number => {
      let total = 0;
      for (let i = 1; i < 800; i += 1) {
        total += Math.abs(
          fbm(i * 0.05, 1.0, 0.0, octaves) - fbm((i - 1) * 0.05, 1.0, 0.0, octaves),
        );
      }
      return total;
    };
    expect(roughness(6)).toBeGreaterThan(roughness(2));
  });
});

describe('warpedField', () => {
  it('evolves over time without discontinuities', () => {
    let previous = warpedField(3, 4, 0, 4.2, 5);
    let moved = 0;
    for (let step = 1; step <= 400; step += 1) {
      const value = warpedField(3, 4, step * 0.01, 4.2, 5);
      // No jumps: the field must never appear to cut.
      expect(Math.abs(value - previous)).toBeLessThan(0.2);
      moved += Math.abs(value - previous);
      previous = value;
    }
    // But it does have to actually change.
    expect(moved).toBeGreaterThan(0.1);
  });

  it('covers a usable range of the ramp', () => {
    let min = Infinity;
    let max = -Infinity;
    for (let y = 0; y < 60; y += 1) {
      for (let x = 0; x < 90; x += 1) {
        const value = warpedField(x * 0.034, y * 0.034, 2.0, 4.2, 5);
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }
    expect(max - min).toBeGreaterThan(0.3);
  });
});
