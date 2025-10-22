import { CELL_SIZE } from './constants';
import { randomBetween } from './blob';

export type GridConfig = {
  width: number;
  height: number;
};

export type GridData = {
  columns: number;
  rows: number;
  cellCount: number;
  gridOffsetX: number;
  gridOffsetY: number;
  cellCentersX: Float32Array;
  cellCentersY: Float32Array;
  cellColumns: Float32Array;
  cellRows: Float32Array;
  baseBrightness: Float32Array;
  noiseJitter: Float32Array;
  noisePaletteBias: Float32Array;
};

export const setupGrid = (config: GridConfig): GridData => {
  const { width, height } = config;

  const columns = Math.ceil(width / CELL_SIZE) + 6;
  const rows = Math.ceil(height / CELL_SIZE) + 6;
  const gridOffsetX = -CELL_SIZE * 3;
  const gridOffsetY = -CELL_SIZE * 3;

  const cellCount = columns * rows;

  const cellCentersX = new Float32Array(cellCount);
  const cellCentersY = new Float32Array(cellCount);
  const cellColumns = new Float32Array(cellCount);
  const cellRows = new Float32Array(cellCount);
  const baseBrightness = new Float32Array(cellCount);
  const noiseJitter = new Float32Array(cellCount);
  const noisePaletteBias = new Float32Array(cellCount);

  let index = 0;
  for (let row = 0; row < rows; row += 1) {
    const verticalGradient = 0.14 + (1 - row / rows) * 0.06;
    const centerY = gridOffsetY + row * CELL_SIZE + CELL_SIZE / 2;
    
    for (let col = 0; col < columns; col += 1) {
      const jitter = randomBetween(-0.05, 0.05);
      const bias = Math.random() - 0.5;
      const centerX = gridOffsetX + col * CELL_SIZE + CELL_SIZE / 2;

      cellCentersX[index] = centerX;
      cellCentersY[index] = centerY;
      cellColumns[index] = col;
      cellRows[index] = row;
      baseBrightness[index] = verticalGradient + jitter * 0.12;
      noiseJitter[index] = jitter;
      noisePaletteBias[index] = bias;
      index += 1;
    }
  }

  return {
    columns,
    rows,
    cellCount,
    gridOffsetX,
    gridOffsetY,
    cellCentersX,
    cellCentersY,
    cellColumns,
    cellRows,
    baseBrightness,
    noiseJitter,
    noisePaletteBias,
  };
};
