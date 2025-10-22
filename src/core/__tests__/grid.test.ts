import { describe, it, expect } from 'vitest';
import { setupGrid } from '../grid';
import { CELL_SIZE } from '../constants';

describe('Grid Setup', () => {
  it('should create grid with correct dimensions', () => {
    const result = setupGrid({ width: 1000, height: 800, cellSize: CELL_SIZE });
    expect(result.columns).toBeGreaterThan(0);
    expect(result.rows).toBeGreaterThan(0);
    expect(result.cellCount).toBe(result.columns * result.rows);
  });

  it('should create Float32Arrays with correct length', () => {
    const result = setupGrid({ width: 1000, height: 800, cellSize: CELL_SIZE });
    const { cellCount } = result;
    
    expect(result.cellColumns.length).toBe(cellCount);
    expect(result.cellRows.length).toBe(cellCount);
    expect(result.cellCentersX.length).toBe(cellCount);
    expect(result.cellCentersY.length).toBe(cellCount);
    expect(result.baseBrightness.length).toBe(cellCount);
    expect(result.noiseJitter.length).toBe(cellCount);
    expect(result.noisePaletteBias.length).toBe(cellCount);
  });

  it('should create brightness gradient', () => {
    const result = setupGrid({ width: 1000, height: 800, cellSize: CELL_SIZE });
    const firstRow = result.baseBrightness[0]!;
    const lastRow = result.baseBrightness[result.cellCount - 1]!;
    expect(firstRow).not.toBe(lastRow);
  });

  it('should handle small dimensions', () => {
    const result = setupGrid({ width: 100, height: 100, cellSize: CELL_SIZE });
    expect(result.columns).toBeGreaterThan(0);
    expect(result.rows).toBeGreaterThan(0);
  });

  it('should handle large dimensions', () => {
    const result = setupGrid({ width: 3840, height: 2160, cellSize: CELL_SIZE });
    expect(result.columns).toBeGreaterThan(0);
    expect(result.rows).toBeGreaterThan(0);
  });
});
