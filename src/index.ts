/**
 * ASCII Blobs Library
 * Main entry point for React components
 */

export { default as AsciiScreensaver } from './components/AsciiScreensaver';
export type { AsciiScreensaverRef } from './components/AsciiScreensaver';

// Export types for TypeScript users
export type { CloudBlob, State, BlobTempBuffers } from './core/types';
export type {
  AsciiBlobsConfig,
  ColorConfig,
  BlobBehaviorConfig,
  AnimationConfig,
  PerformanceConfig,
  MergedConfig,
} from './core/config';

// Export constants for advanced customization
export {
  CELL_SIZE,
  HALF_CELL,
  FRAME_INTERVAL,
  REVEAL_DURATION,
  REVEAL_FADE,
  WRAP_MARGIN,
  SPAWN_MARGIN,
  INTERIOR_MIN,
  INTERIOR_MAX,
  ASCII_PALETTE,
  CANVAS_FONT,
  OVERLAY_RGB,
  ALPHA_EPSILON,
  GAUSSIAN_LUT_SIZE,
  GAUSSIAN_LUT_MAX,
  GAUSSIAN_SCALE,
} from './core/constants';

// Export Gaussian utilities for advanced use cases
export { gaussianFalloff, gaussianLUT } from './core/gaussian';

// Export blob utilities for advanced use cases
export { 
  createBlob, 
  resetBlob, 
  updateBlob, 
  pickSpawnPoint,
  randomBetween, 
  clamp 
} from './core/blob';

// Export grid utilities for advanced use cases
export { setupGrid } from './core/grid';
export type { GridConfig, GridData } from './core/grid';

export { drawFrame, pickShadeIndex } from './core/renderer';

export { createGlyphAtlas } from './core/atlas';

export { defaultConfig, mergeConfig } from './core/config';
