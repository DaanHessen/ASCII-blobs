import { buildGlyphAtlas } from '../glyphAtlas';
import type { GlyphAtlas } from '../glyphAtlas';
import { warpedField } from '../noise';

/**
 * Fallback rasteriser for browsers without WebGL2.
 *
 * It runs the same field, gradient and lighting model as the shader, so the
 * two paths look like the same artwork rather than two different effects. Two
 * deliberate differences, both forced by running on a CPU:
 *
 *   - one domain-warp level instead of two, and fewer octaves
 *   - a coarser grid, since cost here scales with cell count
 *
 * Glyphs are also pre-tinted in the atlas and only their alpha is modulated,
 * because per-cell tinting in 2D canvas means a composite operation per cell.
 */

export type Canvas2DRendererOptions = {
  canvas: HTMLCanvasElement;
  characters: string;
  fontFamily: string;
  cellSize: number;
  rampSteps: number;
  ink: string;
  light: [number, number, number];
  relief: number;
  ambient: number;
  dither: number;
  baseDensity: number;
  opacity: number;
  horizon: number;
  fieldScale: number;
  warp: number;
  octaves: number;
  contrast: number;
  revealSpread: number;
  revealFade: number;
};

const ALPHA_EPSILON = 0.015;

/** Cells are this many times larger than the WebGL path's. */
const CELL_MULTIPLIER = 1.8;

/** Precomputed 8×8 Bayer matrix, normalised to 0-1. */
const BAYER = (() => {
  const size = 8;
  const matrix = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let value = 0;
      let mask = size >> 1;
      let bit = 0;
      while (mask > 0) {
        const xBit = (x & mask) > 0 ? 1 : 0;
        const yBit = (y & mask) > 0 ? 1 : 0;
        value |= (xBit ^ yBit) << (2 * bit + 1);
        value |= yBit << (2 * bit);
        mask >>= 1;
        bit += 1;
      }
      matrix[y * size + x] = value / (size * size);
    }
  }
  return matrix;
})();

const hash21 = (x: number, y: number): number => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

export class Canvas2DRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private options: Canvas2DRendererOptions;
  private atlas: GlyphAtlas | null = null;
  private cssWidth = 0;
  private cssHeight = 0;
  private scale = 1;
  private cellPx = 18;
  private revealHash = new Float32Array(0);
  private height = new Float32Array(0);

  columns = 0;
  rows = 0;

  private constructor(ctx: CanvasRenderingContext2D, options: Canvas2DRendererOptions) {
    this.ctx = ctx;
    this.options = options;
  }

  static create(options: Canvas2DRendererOptions): Canvas2DRenderer | null {
    const ctx = options.canvas.getContext('2d', { alpha: true });
    return ctx ? new Canvas2DRenderer(ctx, options) : null;
  }

  setOptions(options: Canvas2DRendererOptions): void {
    const rebuild =
      options.characters !== this.options.characters ||
      options.fontFamily !== this.options.fontFamily ||
      options.rampSteps !== this.options.rampSteps ||
      options.ink !== this.options.ink;
    this.options = options;
    if (rebuild) {
      this.buildAtlas();
    }
  }

  private buildAtlas(): void {
    this.atlas = buildGlyphAtlas({
      characters: this.options.characters,
      fontFamily: this.options.fontFamily,
      // Same formula as the WebGL path so both rasterisers measure coverage at
      // the same size and land on the same ramp.
      slotPx: Math.max(16, Math.round(this.cellPx * this.scale * 1.5)),
      steps: this.options.rampSteps,
      fill: this.options.ink,
    });
  }

  resize(cssWidth: number, cssHeight: number, devicePixelRatio: number): void {
    const { canvas } = this.options;
    // The 2D path is draw-call bound, so it does not follow DPR upward.
    this.scale = Math.min(devicePixelRatio, 1.5);
    this.cellPx = Math.round(this.options.cellSize * CELL_MULTIPLIER);
    this.cssWidth = cssWidth;
    this.cssHeight = cssHeight;

    canvas.width = Math.max(1, Math.floor(cssWidth * this.scale));
    canvas.height = Math.max(1, Math.floor(cssHeight * this.scale));
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);

    this.columns = Math.ceil(cssWidth / this.cellPx);
    this.rows = Math.ceil(cssHeight / this.cellPx);

    const count = this.columns * this.rows;
    this.revealHash = new Float32Array(count);
    this.height = new Float32Array(count);
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.columns; col += 1) {
        this.revealHash[row * this.columns + col] = hash21(col, row);
      }
    }

    this.buildAtlas();
  }

  render(elapsedMs: number, revealElapsed: number): void {
    const { ctx, atlas, options } = this;
    if (!atlas) {
      return;
    }

    ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);

    const time = elapsedMs * 0.001;
    // Cells are larger here, so the frequency is scaled to keep structures the
    // same size on screen as the WebGL path.
    const frequency = options.fieldScale * CELL_MULTIPLIER;

    // Height first, for the whole grid, so lighting can read neighbours.
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.columns; col += 1) {
        const raw = warpedField(col * frequency, row * frequency, time, options.warp, options.octaves);
        const normalised = raw * 0.5 + 0.5;
        this.height[row * this.columns + col] = Math.min(
          Math.max((normalised - 0.5) * options.contrast + 0.5, 0),
          1,
        );
      }
    }

    const [lightX, lightY, lightZ] = options.light;
    const lightLength = Math.hypot(lightX, lightY, lightZ) || 1;
    const lx = lightX / lightLength;
    const ly = lightY / lightLength;
    const lz = lightZ / lightLength;

    const steps = atlas.steps;
    const slot = atlas.slotPx;
    const at = (col: number, row: number): number =>
      this.height[
        Math.min(Math.max(row, 0), this.rows - 1) * this.columns +
          Math.min(Math.max(col, 0), this.columns - 1)
      ]!;

    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.columns; col += 1) {
        const index = row * this.columns + col;
        const height = this.height[index]!;

        const slopeX = (at(col + 1, row) - at(col - 1, row)) * 0.5;
        const slopeY = (at(col, row + 1) - at(col, row - 1)) * 0.5;

        const normalX = -slopeX * options.relief;
        const normalY = -slopeY * options.relief;
        const length = Math.hypot(normalX, normalY, 1) || 1;
        const nx = normalX / length;
        const ny = normalY / length;
        const nz = 1 / length;

        const ndl = Math.max(nx * lx + ny * ly + nz * lz, 0);
        const rim = Math.pow(1 - nz, 2.5);
        const lit = options.ambient + 0.92 * ndl + 0.34 * rim * ndl;

        const t = Math.min(Math.max((height - 0.25) / (0.8 - 0.25), 0), 1);
        const form = t * t * (3 - 2 * t);
        const horizon = 1 - (row / this.rows) * options.horizon;

        const revealProgress = Math.min(
          Math.max(
            (revealElapsed - this.revealHash[index]! * options.revealSpread) / options.revealFade,
            0,
          ),
          1,
        );
        const reveal = revealProgress * revealProgress * (3 - 2 * revealProgress);

        const shade = Math.min(
          Math.max((options.baseDensity + form * lit * horizon) * reveal, 0),
          1,
        );

        const dither = (BAYER[(row & 7) * 8 + (col & 7)]! - 0.5) * options.dither;
        const glyph = Math.min(
          Math.max(Math.round(shade * (steps - 1) + dither), 0),
          steps - 1,
        );
        if (glyph === 0) continue;

        const presenceT = Math.min(shade / 0.1, 1);
        const presence = presenceT * presenceT * (3 - 2 * presenceT);
        const alpha = options.opacity * reveal * presence;
        if (alpha <= ALPHA_EPSILON) continue;

        ctx.globalAlpha = alpha;
        ctx.drawImage(
          atlas.source,
          glyph * slot,
          0,
          slot,
          slot,
          col * this.cellPx,
          row * this.cellPx,
          this.cellPx,
          this.cellPx,
        );
      }
    }

    ctx.globalAlpha = 1;
  }

  dispose(): void {
    this.atlas = null;
  }
}
