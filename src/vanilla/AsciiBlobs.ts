import type { State, BlobTempBuffers } from '../core/types';
import type { AsciiBlobsConfig } from '../core/config';
import { mergeConfig } from '../core/config';
import { getCanvasFont, GAUSSIAN_LUT_SIZE } from '../core/constants';
import { createBlob, resetBlob, updateBlob, randomBetween, clamp } from '../core/blob';
import { setupGrid } from '../core/grid';
import { drawFrame } from '../core/renderer';
import { createGlyphAtlas } from '../core/atlas';
import { createGaussianSampler } from '../core/gaussian';

export class AsciiBlobs {
  private container: HTMLElement;
  private config: ReturnType<typeof mergeConfig>;
  private baseCanvas: HTMLCanvasElement | null = null;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private baseCtx: CanvasRenderingContext2D | null = null;
  private overlayCtx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private state: State | null = null;
  private lastTimestamp = performance.now();
  private lastDraw = performance.now();
  private revealStart = performance.now();
  private isPaused = false;
  private fps = 0;
  private frameCount = 0;
  private fpsTimestamp = performance.now();
  private resizeTimeout: number | undefined;
  private characterLUT: string[] = [];
  private gaussian = createGaussianSampler(GAUSSIAN_LUT_SIZE);
  
  private readonly blobTemp: BlobTempBuffers = {
    centersX: [],
    centersY: [],
    cos: [],
    sin: [],
    invRadiusX: [],
    invRadiusY: [],
    intensity: [],
  };

  constructor(container: HTMLElement | string, config?: AsciiBlobsConfig) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) as HTMLElement
      : container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    this.config = mergeConfig(config);
    this.gaussian = createGaussianSampler(this.config.performance.gaussianLutSize);
    this.init();
  }

  private init(): void {
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.style.isolation = 'isolate';

    const wrapper = document.createElement('div');
    wrapper.className = 'ascii-screensaver';
    wrapper.setAttribute('aria-hidden', 'true');
    if (this.config.className) {
      wrapper.className += ` ${this.config.className}`;
    }
    if (this.config.style) {
      Object.assign(wrapper.style, this.config.style);
    }

    // Apply color configuration via CSS variables
    wrapper.style.setProperty('--ascii-primary', this.config.colors.primary);
    if (this.config.colors.background) {
      wrapper.style.setProperty('--ascii-bg-base', this.config.colors.background);
      wrapper.style.setProperty('--ascii-bg-mid', this.config.colors.background);
      wrapper.style.setProperty('--ascii-bg-dark', this.config.colors.background);
    }
    if (this.config.colors.glow) {
      wrapper.style.setProperty('--ascii-glow', this.config.colors.glow);
    }
    if (this.config.colors.shadow) {
      wrapper.style.setProperty('--ascii-shadow', this.config.colors.shadow);
    }

    const backdrop = document.createElement('div');
    backdrop.className = 'ascii-screensaver__backdrop';

    this.baseCanvas = document.createElement('canvas');
    this.baseCanvas.className = 'ascii-screensaver__canvas ascii-screensaver__canvas--base';

    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.className = 'ascii-screensaver__canvas ascii-screensaver__canvas--overlay';

    const texture = document.createElement('div');
    texture.className = 'ascii-screensaver__texture';

    const vignette = document.createElement('div');
    vignette.className = 'ascii-screensaver__vignette';

    wrapper.appendChild(backdrop);
    wrapper.appendChild(this.baseCanvas);
    wrapper.appendChild(this.overlayCanvas);
    wrapper.appendChild(texture);
    wrapper.appendChild(vignette);
    this.container.appendChild(wrapper);

    this.baseCtx = this.baseCanvas.getContext('2d');
    this.overlayCtx = this.overlayCanvas.getContext('2d');

    if (!this.baseCtx || !this.overlayCtx) {
      throw new Error('Could not get canvas context');
    }

    this.characterLUT = Array.from({ length: this.config.characters.length }, (_, index) => {
      const baseIndex = index;
      const bias = randomBetween(-0.2, 0.2);
      const adjusted = clamp(baseIndex + bias, 0, this.config.characters.length - 1);
      return this.config.characters[Math.round(adjusted)]!;
    });

    this.setupState();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    this.tick = this.tick.bind(this);
    this.animationFrameId = requestAnimationFrame(this.tick);

    this.config.onReady?.();
  }

  private setupState(): void {
    if (!this.baseCanvas || !this.overlayCanvas || !this.baseCtx || !this.overlayCtx) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const scale = window.devicePixelRatio || 1;

    const gridData = setupGrid({
      width,
      height,
      cellSize: this.config.performance.cellSize,
    });
    const { columns, rows, cellCount } = gridData;

    this.baseCanvas.style.width = `${width}px`;
    this.baseCanvas.style.height = `${height}px`;
    this.baseCanvas.width = Math.floor(width * scale);
    this.baseCanvas.height = Math.floor(height * scale);
    this.baseCtx.setTransform(scale, 0, 0, scale, 0, 0);
    const canvasFont = getCanvasFont(this.config.performance.cellSize);
    this.baseCtx.font = canvasFont;

    const glyphs = createGlyphAtlas(scale, this.characterLUT, {
      primaryColor: this.config.colors.primary,
      glowColor: this.config.colors.glow,
      shadowColor: this.config.colors.shadow,
      cellSize: this.config.performance.cellSize,
      enableBlur: this.config.performance.enableBlur,
      useOffscreenCanvas: this.config.performance.useOffscreenCanvas,
    });

    this.overlayCanvas.style.width = `${width}px`;
    this.overlayCanvas.style.height = `${height}px`;
    this.overlayCanvas.width = Math.floor(width * scale);
    this.overlayCanvas.height = Math.floor(height * scale);
    this.overlayCtx.setTransform(scale, 0, 0, scale, 0, 0);
    this.overlayCtx.font = canvasFont;
    this.overlayCtx.textAlign = 'center';
    this.overlayCtx.textBaseline = 'middle';

    this.baseCtx.clearRect(0, 0, width, height);

    const revealDelays = new Float32Array(cellCount);
    for (let idx = 0; idx < cellCount; idx += 1) {
      revealDelays[idx] = Math.max(0, randomBetween(-this.config.animation.revealFade * 0.65, this.config.animation.revealDuration));
    }

    const blobCount = this.config.blobBehavior.count;
    const blobs = Array.from({ length: blobCount }, () =>
      createBlob(columns, rows, { warmStart: true, behavior: this.config.blobBehavior }),
    );

    this.state = {
      ...gridData,
      revealDelays,
      glyphs,
      blobs,
    };

    this.revealStart = performance.now();
    this.lastTimestamp = performance.now();
    this.lastDraw = performance.now();
  }

  private handleResize(): void {
    if (this.resizeTimeout) {
      window.clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = window.setTimeout(() => {
      this.setupState();
    }, 180);
  }

  private tick(timestamp: number): void {
    const now = timestamp || performance.now();
    const state = this.state;
    
    if (!state || !this.overlayCtx) {
      this.animationFrameId = requestAnimationFrame(this.tick);
      return;
    }

    if (this.isPaused) {
      this.animationFrameId = requestAnimationFrame(this.tick);
      return;
    }

    const delta = Math.min(now - this.lastTimestamp, 120);
    this.lastTimestamp = now;

    this.frameCount++;
    if (now - this.fpsTimestamp >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.fpsTimestamp));
      this.frameCount = 0;
      this.fpsTimestamp = now;
    }

    const revealElapsed = Math.max(0, now - this.revealStart);
    const movementFactor = clamp(revealElapsed / this.config.animation.revealDuration, 0, 1);
    const effectiveDelta = delta * movementFactor;

    const { blobs, columns, rows } = state;
    for (let index = 0; index < blobs.length; index += 1) {
      const blob = blobs[index]!;
      if (blob.life <= 0) {
        const newBlob = createBlob(columns, rows, { behavior: this.config.blobBehavior });
        blobs[index] = newBlob;
        this.config.onBlobSpawn?.(newBlob);
      } else {
        const updated = updateBlob(blob, effectiveDelta, columns, rows, now);
        if (updated.life <= 0) {
          const newBlob = resetBlob(columns, rows, { behavior: this.config.blobBehavior });
          blobs[index] = newBlob;
          this.config.onBlobSpawn?.(newBlob);
        } else {
          blobs[index] = updated;
        }
      }
    }

    if (now - this.lastDraw >= this.config.animation.frameInterval) {
      drawFrame(
        this.overlayCtx,
        state,
        now,
        this.characterLUT,
        revealElapsed,
        this.blobTemp,
        {
          cellSize: this.config.performance.cellSize,
          revealFade: this.config.animation.revealFade,
          fadeInDuration: this.config.blobBehavior.fadeInDuration,
          gaussianFalloff: this.gaussian.falloff,
        },
      );
      this.lastDraw = now;
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    this.lastTimestamp = performance.now();
  }

  reset(): void {
    const state = this.state;
    if (state) {
      const { columns, rows, blobs } = state;
      for (let i = 0; i < blobs.length; i++) {
        blobs[i] = createBlob(columns, rows, { warmStart: true, behavior: this.config.blobBehavior });
      }
      this.revealStart = performance.now();
    }
  }

  getStats(): { blobCount: number; fps: number; isPaused: boolean } {
    return {
      blobCount: this.state?.blobs.length ?? 0,
      fps: this.fps,
      isPaused: this.isPaused,
    };
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('resize', this.handleResize);

    if (this.resizeTimeout) {
      window.clearTimeout(this.resizeTimeout);
    }

    this.container.innerHTML = '';
    this.baseCanvas = null;
    this.overlayCanvas = null;
    this.baseCtx = null;
    this.overlayCtx = null;
    this.state = null;
  }
}
