export const CELL_SIZE = 14;

export const HALF_CELL = CELL_SIZE / 2;

export const FRAME_INTERVAL = 1000 / 22;

export const REVEAL_DURATION = 100;

export const REVEAL_FADE = 520;

export const WRAP_MARGIN = 8;

export const SPAWN_MARGIN = 18;

export const INTERIOR_MIN = 0.18;

export const INTERIOR_MAX = 0.82;

export const ASCII_PALETTE = [" ", "`", ".", ":", ";", "~", "+", "=", "*", "#", "%", "@"] as const;

export const FONT_FAMILY = `"JetBrains Mono", "Fira Code", "Menlo", monospace`;

export const getCanvasFont = (cellSize: number): string =>
  `${Math.max(cellSize * 0.86, 1)}px ${FONT_FAMILY}`;

export const CANVAS_FONT = getCanvasFont(CELL_SIZE);

export const OVERLAY_RGB = "rgb(186, 194, 209)";

export const ALPHA_EPSILON = 0.012;

export const GAUSSIAN_LUT_SIZE = 1024;

export const GAUSSIAN_LUT_MAX = 8;

export const GAUSSIAN_SCALE = (GAUSSIAN_LUT_SIZE - 1) / GAUSSIAN_LUT_MAX;
