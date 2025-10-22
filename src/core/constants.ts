/** Size of each grid cell in pixels */
export const CELL_SIZE = 14;

export const HALF_CELL = CELL_SIZE / 2;

export const FRAME_INTERVAL = 1000 / 22;

/** Duration of initial reveal animation in milliseconds */
export const REVEAL_DURATION = 100;

/** Duration of fade-in effect in milliseconds */
export const REVEAL_FADE = 520;

/** Soft boundary margin for blob wrapping (in pixels) */
export const WRAP_MARGIN = 8;

/** Hard boundary margin for blob spawning (in pixels) */
export const SPAWN_MARGIN = 18;

/** Minimum interior position (as fraction of canvas size) for spawn targeting */
export const INTERIOR_MIN = 0.18;

/** Maximum ... */
export const INTERIOR_MAX = 0.82;

/** ASCII characters used for rendering, ordered from lightest to darkest */
export const ASCII_PALETTE = [" ", "`", ".", ":", ";", "~", "+", "=", "*", "#", "%", "@"] as const;

/** Font configuration for canvas rendering */
export const CANVAS_FONT = `${CELL_SIZE * 0.86}px "JetBrains Mono", "Fira Code", "Menlo", monospace`;

/** Overlay color for character rendering */
export const OVERLAY_RGB = "rgb(186, 194, 209)";

/** Alpha threshold - pixels below this are considered transparent */
export const ALPHA_EPSILON = 0.012;

/**
 * Size of the Gaussian lookup table.
 * Larger values = more precision but more memory.
 */
export const GAUSSIAN_LUT_SIZE = 1024;

/**
 * Maximum distance squared covered by the LUT.
 * Distances beyond this return 0.
 */
export const GAUSSIAN_LUT_MAX = 8;

/**
 * Scale factor for converting distance to LUT index.
 * Calculated as (LUT_SIZE - 1) / LUT_MAX
 */
export const GAUSSIAN_SCALE = (GAUSSIAN_LUT_SIZE - 1) / GAUSSIAN_LUT_MAX;
