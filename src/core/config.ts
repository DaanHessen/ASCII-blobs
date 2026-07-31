export interface ColorConfig {
  primary?: string;
  background?: string;
  /** Colour of glyphs facing away from the light. Defaults to a dimmed primary. */
  inkShadow?: string;
}

export interface LightingConfig {
  /** Vertical exaggeration applied to the field gradient before shading. */
  relief?: number;
  /** Floor brightness on unlit faces. */
  ambient?: number;
  /** Strength of the ordered dither, in ramp steps. */
  dither?: number;
  /** Light azimuth in degrees. 0 points right, 90 points down the screen. */
  azimuth?: number;
  /** Light elevation in degrees above the screen plane. */
  elevation?: number;
  /** Density of the field at its troughs. */
  baseDensity?: number;
  /** Overall glyph opacity. */
  opacity?: number;
  /** How much quieter the top of the frame is than the bottom, 0-1. */
  horizon?: number;
  /** Number of baked ramp steps. Higher gives finer shading. */
  rampSteps?: number;
}

export interface FieldConfig {
  /** Spatial frequency, in inverse cells. Smaller means larger structures. */
  scale?: number;
  /** Strength of the domain warp. This is what makes the field fold. */
  warp?: number;
  /** fBm octaves, 1-8. */
  octaves?: number;
  /** Contrast curve applied around the field's midpoint. */
  contrast?: number;
  /** How fast the field evolves. One unit is roughly one full turnover. */
  speed?: number;
}

export interface AnimationConfig {
  /** Minimum milliseconds between draws. */
  frameInterval?: number;
  /** Spread of the per-cell reveal delay, in milliseconds. */
  revealDuration?: number;
  /** Length of each cell's reveal fade, in milliseconds. */
  revealFade?: number;
}

export interface PerformanceConfig {
  cellSize?: number;
  targetFPS?: number;
}

export type RendererPreference = 'auto' | 'webgl2' | 'canvas2d';

export interface PortraitConfig {
  /** URL of the RGBA field produced by tools/build_portrait.py. */
  src?: string;
  /** Height of the portrait as a fraction of the viewport. */
  scale?: number;
  /** Centre of the portrait in normalised viewport coordinates. */
  centerX?: number;
  centerY?: number;
  /** Seconds for one full coalesce → hold → dissolve → drift cycle. */
  cycleSeconds?: number;
  /** Peak displacement, in cells, at full dissolve. */
  warpCells?: number;
  /** How far the pointer pushes cells, in cells. */
  pointerStrength?: number;
  /** Radius of the pointer's influence, in cells. */
  pointerRadius?: number;
}

export interface AsciiBlobsConfig {
  colors?: ColorConfig;
  characters?: string;
  field?: FieldConfig;
  animation?: AnimationConfig;
  performance?: PerformanceConfig;
  lighting?: LightingConfig;
  portrait?: PortraitConfig;
  /** Which render path to use. 'auto' prefers WebGL2 and falls back to 2D. */
  renderer?: RendererPreference;
  className?: string;
  style?: React.CSSProperties;
  onReady?: () => void;
}

/**
 * A wide candidate set is deliberate. The ramp is built by measuring each
 * glyph's ink coverage and picking the closest match for each step, so the more
 * candidates there are the more evenly the ramp can be spaced — unused glyphs
 * cost nothing.
 */
export const DEFAULT_CHARACTERS =
  ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

export const defaultConfig: Required<
  Omit<AsciiBlobsConfig, 'className' | 'style' | 'onReady'>
> = {
  colors: {
    primary: 'rgb(214, 220, 230)',
    background: '#07080b',
    inkShadow: 'rgb(56, 64, 78)',
  },
  characters: DEFAULT_CHARACTERS,
  field: {
    // Low. The largest structures need to span most of the viewport, or the
    // field reads as texture rather than as landscape. With a lacunarity of
    // 2.02 the finest of four octaves lands near 0.09 cells⁻¹ — a period of
    // about eleven cells, comfortably above the grid's Nyquist limit. Pushing
    // either number higher aliases into static.
    scale: 0.011,
    warp: 3.2,
    octaves: 4,
    // Measured, not guessed. Raw domain-warped fBm only spans about 0.28-0.65
    // once mapped into 0-1, so a mild curve leaves the ramp permanently in its
    // midtones — no cell is ever empty and none is ever full, which is exactly
    // what "flat grey static" looks like. At 5 the field clips at both ends:
    // roughly a third of the grid breathes and an eighth reaches full density.
    contrast: 5,
    // Slow on purpose. The field should never appear to loop or to be
    // "playing"; it should look like weather.
    speed: 0.03,
  },
  animation: {
    frameInterval: 16,
    // The last cell starts at `revealDuration` and takes `revealFade` to
    // finish, so the field is fully up at the sum of the two. Kept under
    // 600ms so it lands with, rather than after, whatever the page animates
    // in over it — a background still assembling once the foreground has
    // settled reads as a slow page, not as an effect.
    revealDuration: 260,
    revealFade: 280,
  },
  performance: {
    // A cell this size gives a 1440px viewport about 144 columns, which is
    // enough for the fine filaments the domain warp produces to survive
    // quantisation.
    cellSize: 10,
    targetFPS: 60,
  },
  lighting: {
    // High because the field is low-frequency: a gentle slope spread over
    // eighty cells has a tiny per-cell gradient, and without exaggeration the
    // whole surface faces the viewer and shades flat.
    relief: 90,
    ambient: 0.32,
    dither: 1,
    azimuth: 218,
    elevation: 38,
    // Zero. Troughs going completely empty is what gives the field negative
    // space to breathe, and negative space is most of why it reads as
    // composed rather than as noise.
    baseDensity: 0,
    opacity: 1,
    horizon: 0.25,
    rampSteps: 28,
  },
  portrait: {
    src: '',
    scale: 0.88,
    centerX: 0.5,
    centerY: 0.5,
    cycleSeconds: 26,
    warpCells: 34,
    pointerStrength: 7,
    pointerRadius: 16,
  },
  renderer: 'auto',
};

export type MergedConfig = {
  colors: Required<ColorConfig>;
  characters: string;
  field: Required<FieldConfig>;
  animation: Required<AnimationConfig>;
  performance: Required<PerformanceConfig>;
  lighting: Required<LightingConfig>;
  portrait: Required<PortraitConfig>;
  renderer: RendererPreference;
  className?: string;
  style?: React.CSSProperties;
  onReady?: () => void;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function mergeConfig(userConfig?: AsciiBlobsConfig): MergedConfig {
  const colors = {
    ...defaultConfig.colors,
    ...userConfig?.colors,
  } as Required<ColorConfig>;

  const performance = {
    ...defaultConfig.performance,
    ...userConfig?.performance,
  } as Required<PerformanceConfig>;
  performance.cellSize = Math.max(4, Math.floor(performance.cellSize));
  performance.targetFPS = clamp(performance.targetFPS, 1, 240);

  const field = {
    ...defaultConfig.field,
    ...userConfig?.field,
  } as Required<FieldConfig>;
  field.scale = Math.max(1e-4, field.scale);
  field.octaves = Math.round(clamp(field.octaves, 1, 8));
  field.contrast = Math.max(0.1, field.contrast);
  field.warp = Math.max(0, field.warp);

  const lighting = {
    ...defaultConfig.lighting,
    ...userConfig?.lighting,
  } as Required<LightingConfig>;
  lighting.rampSteps = Math.round(clamp(lighting.rampSteps, 4, 64));
  lighting.ambient = clamp(lighting.ambient, 0, 1);
  lighting.opacity = clamp(lighting.opacity, 0, 1);
  lighting.baseDensity = clamp(lighting.baseDensity, 0, 1);
  lighting.horizon = clamp(lighting.horizon, 0, 1);

  const portrait = {
    ...defaultConfig.portrait,
    ...userConfig?.portrait,
  } as Required<PortraitConfig>;
  portrait.scale = clamp(portrait.scale, 0.05, 2);
  portrait.cycleSeconds = Math.max(4, portrait.cycleSeconds);

  const animation = {
    ...defaultConfig.animation,
    ...userConfig?.animation,
  } as Required<AnimationConfig>;

  if (!userConfig?.animation?.frameInterval && userConfig?.performance?.targetFPS) {
    animation.frameInterval = Math.max(5, Math.round(1000 / performance.targetFPS));
  }
  animation.frameInterval = Math.max(5, animation.frameInterval);
  animation.revealDuration = Math.max(0, animation.revealDuration);
  animation.revealFade = Math.max(1, animation.revealFade);

  return {
    colors,
    characters: userConfig?.characters ?? defaultConfig.characters,
    field,
    animation,
    performance,
    lighting,
    portrait,
    renderer: userConfig?.renderer ?? defaultConfig.renderer,
    className: userConfig?.className,
    style: userConfig?.style,
    onReady: userConfig?.onReady,
  };
}
