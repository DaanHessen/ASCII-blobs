import { describe, it, expect } from 'vitest';
import { pickShadeIndex } from '../renderer';

describe('Renderer Utilities', () => {
  describe('pickShadeIndex', () => {
    it('should return index within palette range', () => {
      const index = pickShadeIndex(0.5, 0, 0, 12);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(12);
    });

    it('should return 0 for brightness 0', () => {
      const index = pickShadeIndex(0, 0, 0, 12);
      expect(index).toBe(0);
    });

    it('should return max index for brightness 1', () => {
      const index = pickShadeIndex(1, 0, 0, 12);
      expect(index).toBe(11);
    });

    it('should handle jitter', () => {
      const index1 = pickShadeIndex(0.5, 0, 0, 12);
      const index2 = pickShadeIndex(0.5, 0.1, 0, 12);
      expect(typeof index1).toBe('number');
      expect(typeof index2).toBe('number');
    });
  });
});
