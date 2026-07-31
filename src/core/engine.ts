import type { MergedConfig } from './config';
import { FONT_FAMILY } from './constants';
import { Canvas2DRenderer } from './canvas2d/renderer';
import { GlRenderer } from './gl/renderer';

export type RendererKind = 'webgl2' | 'canvas2d';

export type EngineStats = {
  fps: number;
  isPaused: boolean;
  renderer: RendererKind | null;
  columns: number;
  rows: number;
};

type Rasteriser =
  | { kind: 'webgl2'; instance: GlRenderer }
  | { kind: 'canvas2d'; instance: Canvas2DRenderer };

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const lightVector = (azimuthDegrees: number, elevationDegrees: number): [number, number, number] => {
  const azimuth = (azimuthDegrees * Math.PI) / 180;
  const elevation = (elevationDegrees * Math.PI) / 180;
  const horizontal = Math.cos(elevation);
  return [Math.cos(azimuth) * horizontal, Math.sin(azimuth) * horizontal, Math.sin(elevation)];
};

export class AsciiBlobsEngine {
  private readonly canvas: HTMLCanvasElement;
  private config: MergedConfig;
  private rasteriser: Rasteriser | null = null;
  private frame: number | null = null;
  private paused = false;
  private hidden = false;
  private reducedMotion = false;

  /**
   * Field time, advanced by hand rather than read from the clock. Pausing, a
   * hidden tab or a dropped frame must not jump the field forward — the whole
   * point of the motion is that it never appears to cut.
   */
  private fieldTime = 0;
  private lastTimestamp = 0;
  private lastDraw = 0;
  private revealStart = 0;
  private frameCount = 0;
  private fpsWindowStart = 0;
  private fps = 0;

  private resizeObserver: ResizeObserver | null = null;
  private readonly boundVisibility = () => this.handleVisibility();
  private readonly boundMotionChange = () => this.handleMotionChange();
  private readonly boundResize = () => this.resize();
  private motionQuery: MediaQueryList | null = null;

  constructor(canvas: HTMLCanvasElement, config: MergedConfig) {
    this.canvas = canvas;
    this.config = config;
    this.reducedMotion = prefersReducedMotion();
  }

  start(): void {
    this.attachRasteriser();
    this.observeSize();

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.boundVisibility);
      this.hidden = document.hidden;
    }
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.motionQuery.addEventListener?.('change', this.boundMotionChange);
    }

    const now = performance.now();
    this.lastTimestamp = now;
    this.lastDraw = now;
    this.revealStart = now;
    this.fpsWindowStart = now;
    this.frame = requestAnimationFrame(this.loop);
  }

  /**
   * Resolved before the canvas is touched: a canvas can only ever hand out one
   * context type, so a failed 'webgl2' request cannot be retried as '2d'.
   */
  private preferredRenderer(): RendererKind {
    if (this.config.renderer !== 'auto') {
      return this.config.renderer;
    }
    return GlRenderer.isSupported() ? 'webgl2' : 'canvas2d';
  }

  private attachRasteriser(): void {
    const shared = this.rasteriserOptions();

    if (this.preferredRenderer() === 'webgl2') {
      const instance = GlRenderer.create({
        ...shared,
        inkShadow: this.config.colors.inkShadow,
      });
      if (instance) {
        this.rasteriser = { kind: 'webgl2', instance };
        this.resize();
        return;
      }
    }

    const instance = Canvas2DRenderer.create(shared);
    if (instance) {
      this.rasteriser = { kind: 'canvas2d', instance };
      this.resize();
    }
  }

  private rasteriserOptions() {
    const { colors, characters, lighting, performance: perf, animation, field } = this.config;
    return {
      canvas: this.canvas,
      characters,
      fontFamily: FONT_FAMILY,
      cellSize: perf.cellSize,
      rampSteps: lighting.rampSteps,
      ink: colors.primary,
      light: lightVector(lighting.azimuth, lighting.elevation),
      relief: lighting.relief,
      ambient: lighting.ambient,
      dither: lighting.dither,
      baseDensity: lighting.baseDensity,
      opacity: lighting.opacity,
      horizon: lighting.horizon,
      fieldScale: field.scale,
      warp: field.warp,
      octaves: field.octaves,
      contrast: field.contrast,
      revealSpread: animation.revealDuration,
      revealFade: animation.revealFade,
    };
  }

  private observeSize(): void {
    if (typeof ResizeObserver === 'undefined') {
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', this.boundResize);
      }
      return;
    }
    this.resizeObserver = new ResizeObserver(this.boundResize);
    this.resizeObserver.observe(this.canvas.parentElement ?? this.canvas);
  }

  private resize(): void {
    const rasteriser = this.rasteriser;
    if (!rasteriser) {
      return;
    }
    const parent = this.canvas.parentElement;
    const width = parent?.clientWidth || window.innerWidth;
    const height = parent?.clientHeight || window.innerHeight;
    const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
    rasteriser.instance.resize(width, height, dpr);
  }

  private handleVisibility(): void {
    this.hidden = typeof document !== 'undefined' && document.hidden;
    if (!this.hidden) {
      // Discard the time spent in the background so the field resumes where it
      // left off rather than jumping.
      this.lastTimestamp = performance.now();
    }
  }

  private handleMotionChange(): void {
    this.reducedMotion = this.motionQuery?.matches ?? false;
  }

  private loop = (timestamp: number): void => {
    this.frame = requestAnimationFrame(this.loop);

    const now = timestamp || performance.now();
    const delta = Math.min(now - this.lastTimestamp, 120);
    this.lastTimestamp = now;

    if (this.paused || this.hidden || !this.rasteriser) {
      return;
    }

    this.frameCount += 1;
    if (now - this.fpsWindowStart >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.fpsWindowStart));
      this.frameCount = 0;
      this.fpsWindowStart = now;
    }

    if (!this.reducedMotion) {
      this.fieldTime += delta * this.config.field.speed;
    }

    if (now - this.lastDraw < this.config.animation.frameInterval) {
      return;
    }
    this.lastDraw = now;

    this.rasteriser.instance.render(this.fieldTime, now - this.revealStart);
  };

  updateConfig(config: MergedConfig): void {
    const previousRenderer = this.config.renderer;
    this.config = config;

    if (previousRenderer !== config.renderer) {
      this.rasteriser?.instance.dispose();
      this.rasteriser = null;
      this.attachRasteriser();
      return;
    }

    const shared = this.rasteriserOptions();
    if (this.rasteriser?.kind === 'webgl2') {
      this.rasteriser.instance.setOptions({ ...shared, inkShadow: config.colors.inkShadow });
    } else if (this.rasteriser?.kind === 'canvas2d') {
      this.rasteriser.instance.setOptions(shared);
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
    this.lastTimestamp = performance.now();
  }

  /** Restarts the reveal without discontinuity in the field itself. */
  reset(): void {
    this.revealStart = performance.now();
  }

  getStats(): EngineStats {
    return {
      fps: this.fps,
      isPaused: this.paused,
      renderer: this.rasteriser?.kind ?? null,
      columns: Math.round(this.rasteriser?.instance.columns ?? 0),
      rows: Math.round(this.rasteriser?.instance.rows ?? 0),
    };
  }

  destroy(): void {
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.boundVisibility);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.boundResize);
    }
    this.motionQuery?.removeEventListener?.('change', this.boundMotionChange);
    this.motionQuery = null;
    this.rasteriser?.instance.dispose();
    this.rasteriser = null;
  }
}
