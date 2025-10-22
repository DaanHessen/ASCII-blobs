import { describe, it, expect } from 'vitest';
import { createBlob, updateBlob, pickSpawnPoint, randomBetween, clamp } from '../blob';

describe('Blob Utilities', () => {
  describe('randomBetween', () => {
    it('should return value within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomBetween(10, 20);
        expect(result).toBeGreaterThanOrEqual(10);
        expect(result).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('clamp', () => {
    it('should clamp value to min', () => {
      expect(clamp(5, 10, 20)).toBe(10);
    });

    it('should clamp value to max', () => {
      expect(clamp(25, 10, 20)).toBe(20);
    });

    it('should return value if within range', () => {
      expect(clamp(15, 10, 20)).toBe(15);
    });
  });

  describe('pickSpawnPoint', () => {
    it('should return valid spawn point', () => {
      const spawn = pickSpawnPoint(100, 100);
      expect(spawn).toHaveProperty('cx');
      expect(spawn).toHaveProperty('cy');
      expect(spawn).toHaveProperty('baseDirection');
      expect(typeof spawn.baseDirection).toBe('number');
    });
  });

  describe('createBlob', () => {
    it('should create blob with all properties', () => {
      const blob = createBlob(100, 100);
      expect(blob).toHaveProperty('cx');
      expect(blob).toHaveProperty('cy');
      expect(blob).toHaveProperty('baseRadiusX');
      expect(blob).toHaveProperty('baseRadiusY');
      expect(blob).toHaveProperty('rotation');
      expect(blob).toHaveProperty('velocityX');
      expect(blob).toHaveProperty('velocityY');
      expect(blob).toHaveProperty('life');
      expect(blob).toHaveProperty('maxLife');
    });

    it('should create blob with positive life', () => {
      const blob = createBlob(100, 100);
      expect(blob.life).toBeGreaterThan(0);
      expect(blob.maxLife).toBeGreaterThan(0);
    });
  });

  describe('updateBlob', () => {
    it('should decrease blob life', () => {
      const blob = createBlob(100, 100);
      const initialLife = blob.life;
      const updated = updateBlob(blob, 1000, 100, 100, Date.now());
      expect(updated.life).toBeLessThan(initialLife);
    });

    it('should update blob position', () => {
      const blob = createBlob(100, 100);
      const initialCx = blob.cx;
      const initialCy = blob.cy;
      const updated = updateBlob(blob, 1000, 100, 100, Date.now());
      const moved = updated.cx !== initialCx || updated.cy !== initialCy;
      expect(moved).toBe(true);
    });
  });
});
