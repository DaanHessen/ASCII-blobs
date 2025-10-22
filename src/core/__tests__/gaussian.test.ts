import { describe, it, expect } from 'vitest';
import { gaussianFalloff, gaussianLUT } from '../gaussian';

describe('Gaussian Functions', () => {
  it('should create LUT with correct size', () => {
    expect(gaussianLUT.length).toBe(1024);
  });

  it('should have values between 0 and 1', () => {
    for (let i = 0; i < gaussianLUT.length; i++) {
      const value = gaussianLUT[i]!;
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('should return falloff for distance 0', () => {
    const result = gaussianFalloff(0);
    expect(result).toBeGreaterThan(0);
  });

  it('should return lower falloff for larger distances', () => {
    const close = gaussianFalloff(0.1);
    const far = gaussianFalloff(1.0);
    expect(close).toBeGreaterThan(far);
  });

  it('should return 0 for very large distances', () => {
    const result = gaussianFalloff(100);
    expect(result).toBe(0);
  });
});
