/**
 * Glyph ramps are usually hardcoded (" .:-=+*#%@") and assumed to be
 * perceptually even. They are not: the spacing depends entirely on which font
 * actually resolved at runtime, and in most fonts the middle of that ramp
 * bunches up while the dark end has gaps. We measure instead — rasterise every
 * candidate, take its mean alpha, then fill a fixed number of ramp slots by
 * picking the glyph closest to each target coverage. The resulting strip is
 * monotonic and evenly stepped for whatever font the browser gave us, and the
 * shader can index it with a plain multiply.
 */

export type GlyphAtlas = {
  source: CanvasImageSource;
  /** Glyph drawn into each ramp slot, dark to light. Repeats are expected. */
  ramp: string[];
  /** Measured ink coverage (0-1) of each ramp slot. */
  coverage: number[];
  /** Edge length in pixels of one square slot. */
  slotPx: number;
  steps: number;
};

export type GlyphAtlasOptions = {
  characters: string;
  /** Slot resolution in device pixels. Rounded up to a multiple of 2. */
  slotPx: number;
  fontFamily: string;
  /** Number of ramp steps to bake. More steps means finer shading. */
  steps?: number;
  /** Glyph fill colour. The WebGL path samples alpha only and leaves this white. */
  fill?: string;
};

const DEFAULT_STEPS = 24;

type Canvas2D = {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
};

/**
 * `preferDom` matters: an OffscreenCanvas is fine as a scratch surface, but
 * some ANGLE backends reject one as a texImage2D source and leave the texture
 * incomplete — which samples as opaque black and floods the screen with
 * glyphs. The strip that becomes a texture is always a DOM canvas.
 */
const createCanvas = (width: number, height: number, preferDom = false): Canvas2D | null => {
  if (preferDom && typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      return { canvas, ctx };
    }
  }

  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    return ctx ? { canvas, ctx } : null;
  }
  if (typeof document === 'undefined') {
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return ctx ? { canvas, ctx } : null;
};

const paintGlyph = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  glyph: string,
  x: number,
  y: number,
  slotPx: number,
  fill = '#fff',
): void => {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = fill;
  ctx.fillText(glyph, x + slotPx / 2, y + slotPx * 0.54);
};

const measureCoverage = (
  characters: readonly string[],
  slotPx: number,
  font: string,
): Map<string, number> => {
  const coverage = new Map<string, number>();
  const scratch = createCanvas(slotPx, slotPx);
  if (!scratch) {
    // No canvas (SSR/jsdom): fall back to the conventional ordering by
    // assigning evenly spaced synthetic coverage in the order given.
    characters.forEach((glyph, index) => {
      coverage.set(glyph, characters.length < 2 ? 0 : index / (characters.length - 1));
    });
    return coverage;
  }

  const { ctx } = scratch;
  ctx.font = font;
  const area = slotPx * slotPx * 255;

  for (const glyph of characters) {
    ctx.clearRect(0, 0, slotPx, slotPx);
    if (glyph.trim()) {
      paintGlyph(ctx, glyph, 0, 0, slotPx);
    }
    const { data } = ctx.getImageData(0, 0, slotPx, slotPx);
    let sum = 0;
    for (let i = 3; i < data.length; i += 4) {
      sum += data[i]!;
    }
    coverage.set(glyph, sum / area);
  }

  return coverage;
};

export type Ramp = {
  glyphs: string[];
  coverage: number[];
};

/**
 * Picks the glyph closest to each evenly spaced coverage target. Pure, so the
 * ramp's monotonicity can be tested without a canvas.
 */
export const computeRamp = (
  coverageByGlyph: ReadonlyMap<string, number>,
  steps: number,
): Ramp => {
  const sorted = [...coverageByGlyph.keys()].sort(
    (a, b) => (coverageByGlyph.get(a) ?? 0) - (coverageByGlyph.get(b) ?? 0),
  );
  if (sorted.length === 0) {
    return { glyphs: [], coverage: [] };
  }

  const darkest = coverageByGlyph.get(sorted[0]!) ?? 0;
  const lightest = coverageByGlyph.get(sorted[sorted.length - 1]!) ?? 1;
  const span = Math.max(lightest - darkest, 1e-6);

  const glyphs: string[] = [];
  const coverage: number[] = [];
  for (let step = 0; step < steps; step += 1) {
    const target = darkest + (steps < 2 ? 0 : step / (steps - 1)) * span;
    let best = sorted[0]!;
    let bestDistance = Infinity;
    for (const glyph of sorted) {
      const distance = Math.abs((coverageByGlyph.get(glyph) ?? 0) - target);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = glyph;
      }
    }
    glyphs.push(best);
    coverage.push(coverageByGlyph.get(best) ?? 0);
  }

  return { glyphs, coverage };
};

/** Measured ink coverage per glyph. Returns an empty map without a canvas. */
export const measureGlyphCoverage = (
  characters: string,
  slotPx: number,
  fontFamily: string,
): Map<string, number> => {
  const unique = Array.from(new Set(Array.from(characters)));
  const normalised = Math.max(8, Math.ceil(slotPx / 2) * 2);
  return measureCoverage(unique, normalised, `${Math.round(normalised * 0.86)}px ${fontFamily}`);
};

export const buildGlyphAtlas = (options: GlyphAtlasOptions): GlyphAtlas | null => {
  const steps = Math.max(2, Math.floor(options.steps ?? DEFAULT_STEPS));
  const slotPx = Math.max(8, Math.ceil(options.slotPx / 2) * 2);
  const font = `${Math.round(slotPx * 0.86)}px ${options.fontFamily}`;

  const characters = Array.from(new Set(Array.from(options.characters)));
  if (characters.length === 0) {
    return null;
  }

  const coverageByGlyph = measureCoverage(characters, slotPx, font);
  const { glyphs: ramp, coverage } = computeRamp(coverageByGlyph, steps);

  const strip = createCanvas(slotPx * steps, slotPx, true);
  if (!strip) {
    return null;
  }

  strip.ctx.font = font;
  strip.ctx.clearRect(0, 0, slotPx * steps, slotPx);
  ramp.forEach((glyph, index) => {
    if (glyph.trim()) {
      paintGlyph(strip.ctx, glyph, index * slotPx, 0, slotPx, options.fill);
    }
  });

  return {
    source: strip.canvas as CanvasImageSource,
    ramp,
    coverage,
    slotPx,
    steps,
  };
};
