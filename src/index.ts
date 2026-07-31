import asciiBlobsCss from './components/AsciiBlobs.css?inline';
import './components/AsciiBlobs.css';
import { ensureAsciiBlobsStyles } from './core/styles';

ensureAsciiBlobsStyles(asciiBlobsCss);

export { default as AsciiBlobs } from './components/AsciiBlobs';
export type { AsciiBlobsRef } from './components/AsciiBlobs';

export { AsciiBlobsEngine } from './core/engine';
export type { EngineStats, RendererKind } from './core/engine';

export { defaultConfig, mergeConfig, DEFAULT_CHARACTERS } from './core/config';
export type {
  AsciiBlobsConfig,
  ColorConfig,
  FieldConfig,
  AnimationConfig,
  PerformanceConfig,
  LightingConfig,
  PortraitConfig,
  RendererPreference,
  MergedConfig,
} from './core/config';

export { gradientNoise, fbm, warpedField } from './core/noise';

export { buildGlyphAtlas, computeRamp, measureGlyphCoverage } from './core/glyphAtlas';
export type { GlyphAtlas, GlyphAtlasOptions, Ramp } from './core/glyphAtlas';

export { CELL_SIZE, FONT_FAMILY } from './core/constants';

export { themes, getThemeClassName } from './themes';
export type { ThemeName } from './themes';
