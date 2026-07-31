import { describe, expect, it } from 'vitest';
import { defaultConfig, mergeConfig } from '../config';

describe('mergeConfig', () => {
  it('fills every section from defaults', () => {
    const config = mergeConfig();
    expect(config.lighting.rampSteps).toBe(defaultConfig.lighting.rampSteps);
    expect(config.field.warp).toBe(defaultConfig.field.warp);
    expect(config.renderer).toBe('auto');
  });

  it('merges partial sections without dropping siblings', () => {
    const config = mergeConfig({ lighting: { ambient: 0.5 } });
    expect(config.lighting.ambient).toBe(0.5);
    expect(config.lighting.relief).toBe(defaultConfig.lighting.relief);
  });

  it('clamps values that would break the renderer', () => {
    const config = mergeConfig({
      lighting: { rampSteps: 4096, ambient: 9, opacity: -3, baseDensity: 8, horizon: 4 },
      field: { octaves: 99, scale: -1, contrast: 0, warp: -5 },
      performance: { cellSize: 0 },
    });
    expect(config.lighting.rampSteps).toBe(64);
    expect(config.lighting.ambient).toBe(1);
    expect(config.lighting.opacity).toBe(0);
    expect(config.lighting.baseDensity).toBe(1);
    expect(config.lighting.horizon).toBe(1);
    // The octave loop in the shader is bounded at 8; anything above would
    // silently do nothing, so it is clamped rather than trusted.
    expect(config.field.octaves).toBe(8);
    expect(config.field.scale).toBeGreaterThan(0);
    expect(config.field.contrast).toBeGreaterThan(0);
    expect(config.field.warp).toBe(0);
    expect(config.performance.cellSize).toBeGreaterThanOrEqual(4);
  });

  it('rounds octaves to an integer', () => {
    expect(mergeConfig({ field: { octaves: 4.7 } }).field.octaves).toBe(5);
  });

  it('derives frameInterval from targetFPS when no interval is given', () => {
    const config = mergeConfig({ performance: { targetFPS: 30 } });
    expect(config.animation.frameInterval).toBe(33);
  });

  it('keeps an explicit frameInterval over targetFPS', () => {
    const config = mergeConfig({
      performance: { targetFPS: 30 },
      animation: { frameInterval: 16 },
    });
    expect(config.animation.frameInterval).toBe(16);
  });
});
