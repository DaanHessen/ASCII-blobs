import { describe, expect, it } from 'vitest';
import { buildGlyphAtlas, computeRamp, measureGlyphCoverage } from '../glyphAtlas';
import { DEFAULT_CHARACTERS } from '../config';

/**
 * jsdom has no 2D context, so the rasterising half of the atlas cannot run
 * here. The ramp selection is pure and is what actually determines whether the
 * shading reads correctly, so that is what these cover; `buildGlyphAtlas` is
 * only asserted to degrade rather than throw.
 */

const coverageOf = (glyphs: readonly [string, number][]) => new Map(glyphs);

describe('computeRamp', () => {
  const spread = coverageOf(
    Array.from(DEFAULT_CHARACTERS).map((glyph, index, all) => [
      glyph,
      index / (all.length - 1),
    ]),
  );

  it('produces a ramp of the requested length', () => {
    const ramp = computeRamp(spread, 28);
    expect(ramp.glyphs).toHaveLength(28);
    expect(ramp.coverage).toHaveLength(28);
  });

  it('orders the ramp by non-decreasing ink coverage', () => {
    const ramp = computeRamp(spread, 28);
    for (let i = 1; i < ramp.coverage.length; i += 1) {
      expect(ramp.coverage[i]!).toBeGreaterThanOrEqual(ramp.coverage[i - 1]!);
    }
  });

  it('starts at the emptiest glyph so the background can stay clear', () => {
    const ramp = computeRamp(
      coverageOf([
        ['@', 0.9],
        [' ', 0],
        ['.', 0.1],
      ]),
      3,
    );
    expect(ramp.glyphs[0]).toBe(' ');
    expect(ramp.glyphs[2]).toBe('@');
  });

  it('picks the nearest coverage to each evenly spaced target', () => {
    // The point of measuring rather than hardcoding a ramp: steps are spaced in
    // coverage, not by position in the candidate list.
    const candidates: [string, number][] = [
      [' ', 0],
      ['.', 0.05],
      ['+', 0.34],
      ['#', 0.82],
      ['@', 0.9],
    ];
    const steps = 6;
    const ramp = computeRamp(coverageOf(candidates), steps);

    for (let step = 0; step < steps; step += 1) {
      const target = (step / (steps - 1)) * 0.9;
      const nearest = candidates.reduce((best, entry) =>
        Math.abs(entry[1] - target) < Math.abs(best[1] - target) ? entry : best,
      );
      expect(ramp.glyphs[step]).toBe(nearest[0]);
    }
  });

  it('repeats glyphs when there are fewer candidates than steps', () => {
    const ramp = computeRamp(
      coverageOf([
        [' ', 0],
        ['@', 1],
      ]),
      5,
    );
    expect(ramp.glyphs).toHaveLength(5);
    expect(new Set(ramp.glyphs).size).toBe(2);
  });

  it('returns an empty ramp for an empty candidate set', () => {
    expect(computeRamp(new Map(), 8).glyphs).toHaveLength(0);
  });
});

describe('measureGlyphCoverage', () => {
  it('falls back to input order when no canvas can be rasterised', () => {
    const coverage = measureGlyphCoverage(' .:#@', 24, 'monospace');
    expect(coverage.get(' ')).toBe(0);
    expect(coverage.get('@')).toBe(1);
  });
});

describe('buildGlyphAtlas', () => {
  it('returns null rather than throwing on an empty character set', () => {
    expect(
      buildGlyphAtlas({ characters: '', fontFamily: 'monospace', slotPx: 24 }),
    ).toBeNull();
  });

  it('returns null rather than throwing when no canvas is available', () => {
    expect(
      buildGlyphAtlas({ characters: ' .:#@', fontFamily: 'monospace', slotPx: 24 }),
    ).toBeNull();
  });
});
