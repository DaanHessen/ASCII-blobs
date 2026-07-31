import { describe, expect, it } from 'vitest';
import { advancePointer, coherenceAt, idlePointer, phaseAt, portraitRect } from '../portrait';
import type { PointerState } from '../portrait';

describe('coherenceAt', () => {
  it('holds fully formed and fully dispersed rather than easing straight through', () => {
    // The hold is the point: a sine would never let the face sit still long
    // enough to be recognised.
    const cycle = 26;
    expect(coherenceAt(cycle * 1000 * 0.35, cycle)).toBe(1);
    expect(coherenceAt(cycle * 1000 * 0.45, cycle)).toBe(1);
    expect(coherenceAt(cycle * 1000 * 0.9, cycle)).toBe(0);
    expect(coherenceAt(cycle * 1000 * 0.99, cycle)).toBe(0);
  });

  it('starts dispersed and reaches full coherence', () => {
    expect(coherenceAt(0, 26)).toBeCloseTo(0, 6);
    expect(coherenceAt(26_000 * 0.24, 26)).toBeCloseTo(1, 6);
  });

  it('is continuous across every phase boundary', () => {
    const cycle = 26;
    for (let t = 0; t < cycle * 1000; t += 37) {
      const a = coherenceAt(t, cycle);
      const b = coherenceAt(t + 37, cycle);
      expect(Math.abs(b - a)).toBeLessThan(0.05);
    }
  });

  it('wraps cleanly, including across the cycle seam', () => {
    expect(coherenceAt(26_000, 26)).toBeCloseTo(coherenceAt(0, 26), 6);
    expect(coherenceAt(-1000, 26)).toBe(coherenceAt(25_000, 26));
  });

  it('scatters more slowly than it gathers', () => {
    const cycle = 26;
    const phases = new Set<string>();
    let gathering = 0;
    let scattering = 0;
    for (let t = 0; t < cycle * 1000; t += 100) {
      const phase = phaseAt(t, cycle);
      phases.add(phase);
      if (phase === 'gathering') gathering += 1;
      if (phase === 'scattering') scattering += 1;
    }
    expect(phases.size).toBe(4);
    expect(scattering).toBeGreaterThan(gathering);
  });
});

describe('advancePointer', () => {
  it('lags the target rather than snapping to it', () => {
    const state: PointerState = { x: 0, y: 0, strength: 0 };
    advancePointer(state, { x: 100, y: 0, active: true }, 16);
    expect(state.x).toBeGreaterThan(0);
    expect(state.x).toBeLessThan(50);
  });

  it('converges on the target when held still', () => {
    const state: PointerState = { x: 0, y: 0, strength: 0 };
    for (let i = 0; i < 400; i += 1) {
      advancePointer(state, { x: 100, y: 40, active: true }, 16);
    }
    expect(state.x).toBeCloseTo(100, 1);
    expect(state.y).toBeCloseTo(40, 1);
    expect(state.strength).toBeCloseTo(1, 2);
  });

  it('releases more slowly than it engages', () => {
    const engaging: PointerState = { x: 0, y: 0, strength: 0 };
    for (let i = 0; i < 60; i += 1) {
      advancePointer(engaging, { x: 0, y: 0, active: true }, 16);
    }

    const releasing: PointerState = { x: 0, y: 0, strength: 1 };
    for (let i = 0; i < 60; i += 1) {
      advancePointer(releasing, { x: 0, y: 0, active: false }, 16);
    }

    expect(engaging.strength).toBeGreaterThan(1 - releasing.strength);
  });
});

describe('idlePointer', () => {
  it('stays inside the grid', () => {
    for (let t = 0; t < 400_000; t += 971) {
      const point = idlePointer(t, 120, 80);
      expect(point.x).toBeGreaterThan(0);
      expect(point.x).toBeLessThan(120);
      expect(point.y).toBeGreaterThan(0);
      expect(point.y).toBeLessThan(80);
    }
  });

  it('does not retrace a short loop', () => {
    const a = idlePointer(0, 120, 80);
    const b = idlePointer(60_000, 120, 80);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(1);
  });
});

describe('portraitRect', () => {
  it('preserves the portrait aspect ratio', () => {
    const rect = portraitRect(144, 90, 0.8, 0.88, 0.5, 0.5);
    expect(rect.width / rect.height).toBeCloseTo(0.8, 6);
  });

  it('fits within the viewport on a tall narrow grid', () => {
    const rect = portraitRect(40, 90, 0.8, 0.95, 0.5, 0.5);
    expect(rect.width).toBeLessThanOrEqual(40);
  });

  it('centres on the requested point', () => {
    const rect = portraitRect(144, 90, 0.8, 0.5, 0.25, 0.4);
    expect(rect.x + rect.width / 2).toBeCloseTo(36, 6);
    expect(rect.y + rect.height / 2).toBeCloseTo(36, 6);
  });
});
