import asciiBlobsCss from './components/AsciiBlobs.css?inline';
import './components/AsciiBlobs.css';
import { ensureAsciiBlobsStyles } from './core/styles';

ensureAsciiBlobsStyles(asciiBlobsCss);

export { default as AsciiBlobs } from './components/AsciiBlobs';
export type { AsciiBlobsRef } from './components/AsciiBlobs';

export type { CloudBlob, State, BlobTempBuffers } from './core/types';
export type {
  AsciiBlobsConfig,
  ColorConfig,
  BlobBehaviorConfig,
  AnimationConfig,
  PerformanceConfig,
  MergedConfig,
} from './core/config';

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
  FONT_FAMILY,
  getCanvasFont,
  OVERLAY_RGB,
  ALPHA_EPSILON,
  GAUSSIAN_LUT_SIZE,
  GAUSSIAN_LUT_MAX,
  GAUSSIAN_SCALE,
} from './core/constants';

export { gaussianFalloff, gaussianLUT, createGaussianSampler } from './core/gaussian';

export { 
  createBlob, 
  resetBlob, 
  updateBlob, 
  pickSpawnPoint,
  randomBetween, 
  clamp 
} from './core/blob';

export { setupGrid } from './core/grid';
export type { GridConfig, GridData } from './core/grid';

export { drawFrame, pickShadeIndex } from './core/renderer';

export { createGlyphAtlas } from './core/atlas';

export { defaultConfig, mergeConfig } from './core/config';

export { themes, getThemeClassName } from './themes';
export type { ThemeName } from './themes';
