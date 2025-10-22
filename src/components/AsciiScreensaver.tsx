import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import type { State, BlobTempBuffers } from "../core/types";
import type { AsciiBlobsConfig } from "../core/config";
import { mergeConfig } from "../core/config";
import { CANVAS_FONT } from "../core/constants";
import { createBlob, resetBlob, updateBlob, randomBetween, clamp } from "../core/blob";
import { setupGrid } from "../core/grid";
import { drawFrame } from "../core/renderer";
import { createGlyphAtlas } from "../core/atlas";
import "./AsciiScreensaver.css";

export interface AsciiScreensaverRef {
  pause: () => void;
  resume: () => void;
  reset: () => void;
  getStats: () => {
    blobCount: number;
    fps: number;
    isPaused: boolean;
  };
}

const blobTemp: BlobTempBuffers = {
  centersX: [],
  centersY: [],
  cos: [],
  sin: [],
  invRadiusX: [],
  invRadiusY: [],
  intensity: [],
};

const AsciiScreensaver = forwardRef<AsciiScreensaverRef, AsciiBlobsConfig>((userConfig, ref) => {
  const config = mergeConfig(userConfig);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>();
  const stateRef = useRef<State | null>(null);
  const lastTimestampRef = useRef<number>(performance.now());
  const lastDrawRef = useRef<number>(performance.now());
  const revealStartRef = useRef<number>(performance.now());
  const isPausedRef = useRef(false);
  const fpsRef = useRef(0);
  const frameCountRef = useRef(0);
  const fpsTimestampRef = useRef(performance.now());

  useImperativeHandle(ref, () => ({
    pause: () => {
      isPausedRef.current = true;
    },
    resume: () => {
      isPausedRef.current = false;
      lastTimestampRef.current = performance.now();
    },
    reset: () => {
      const state = stateRef.current;
      if (state) {
        const { columns, rows, blobs } = state;
        for (let i = 0; i < blobs.length; i++) {
          blobs[i] = createBlob(columns, rows, true);
        }
        revealStartRef.current = performance.now();
      }
    },
    getStats: () => ({
      blobCount: stateRef.current?.blobs.length ?? 0,
      fps: fpsRef.current,
      isPaused: isPausedRef.current,
    }),
  }));

  useEffect(() => {
    const baseCanvas = baseCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!baseCanvas || !overlayCanvas) {
      return;
    }

    const baseCtx = baseCanvas.getContext("2d");
    const overlayCtx = overlayCanvas.getContext("2d");
    if (!baseCtx || !overlayCtx) {
      return;
    }

    const characterLUT = Array.from({ length: config.characters.length }, (_, index) => {
      const baseIndex = index;
      const bias = randomBetween(-0.2, 0.2);
      const adjusted = clamp(baseIndex + bias, 0, config.characters.length - 1);
      return config.characters[Math.round(adjusted)]!;
    });

    const setupState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const scale = window.devicePixelRatio || 1;

      // Set up grid using the grid module
      const gridData = setupGrid({ width, height });
      const { columns, rows, cellCount } = gridData;

      baseCanvas.style.width = `${width}px`;
      baseCanvas.style.height = `${height}px`;
      baseCanvas.width = Math.floor(width * scale);
      baseCanvas.height = Math.floor(height * scale);
      baseCtx.setTransform(scale, 0, 0, scale, 0, 0);
      baseCtx.font = CANVAS_FONT;

      const glyphs = createGlyphAtlas(scale, characterLUT);

      overlayCanvas.style.width = `${width}px`;
      overlayCanvas.style.height = `${height}px`;
      overlayCanvas.width = Math.floor(width * scale);
      overlayCanvas.height = Math.floor(height * scale);
      overlayCtx.setTransform(scale, 0, 0, scale, 0, 0);
      overlayCtx.font = CANVAS_FONT;
      overlayCtx.textAlign = "center";
      overlayCtx.textBaseline = "middle";

      baseCtx.clearRect(0, 0, width, height);

      // Initialize reveal delays for animation
      const revealDelays = new Float32Array(cellCount);
      for (let idx = 0; idx < cellCount; idx += 1) {
        revealDelays[idx] = Math.max(0, randomBetween(-config.animation.revealFade * 0.65, config.animation.revealDuration));
      }

      const blobCount = config.blobBehavior.count;
      const blobs = Array.from({ length: blobCount }, () => createBlob(columns, rows, true));

      stateRef.current = {
        ...gridData,
        revealDelays,
        glyphs,
        blobs,
      };

      revealStartRef.current = performance.now();
      lastTimestampRef.current = performance.now();
      lastDrawRef.current = performance.now();
    };

    setupState();

    config.onReady?.();

    let resizeTimeout: number | undefined;
    const handleResize = () => {
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(() => {
        setupState();
      }, 180);
    };

    const tick = (timestamp: number) => {
      const now = timestamp || performance.now();
      const state = stateRef.current;
      if (!state) {
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      if (isPausedRef.current) {
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const delta = Math.min(now - lastTimestampRef.current, 120);
      lastTimestampRef.current = now;

      frameCountRef.current++;
      if (now - fpsTimestampRef.current >= 1000) {
        fpsRef.current = Math.round((frameCountRef.current * 1000) / (now - fpsTimestampRef.current));
        frameCountRef.current = 0;
        fpsTimestampRef.current = now;
      }

      const revealElapsed = Math.max(0, now - revealStartRef.current);
      const movementFactor = clamp(revealElapsed / config.animation.revealDuration, 0, 1);
      const effectiveDelta = delta * movementFactor;

      const { blobs, columns, rows } = state;
      for (let index = 0; index < blobs.length; index += 1) {
        const blob = blobs[index]!;
        if (blob.life <= 0) {
          const newBlob = createBlob(columns, rows);
          blobs[index] = newBlob;
          config.onBlobSpawn?.(newBlob);
        } else {
          const updated = updateBlob(blob, effectiveDelta, columns, rows, now);
          if (updated.life <= 0) {
            const newBlob = resetBlob(columns, rows);
            blobs[index] = newBlob;
            config.onBlobSpawn?.(newBlob);
          } else {
            blobs[index] = updated;
          }
        }
      }

      if (now - lastDrawRef.current >= config.animation.frameInterval) {
        drawFrame(overlayCtx, state, now, characterLUT, revealElapsed, blobTemp);
        lastDrawRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", handleResize);
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout);
      }
    };
  }, []);

  return (
    <div 
      className={`ascii-screensaver ${config.className || ''}`} 
      style={config.style}
      aria-hidden="true"
    >
      <div className="ascii-screensaver__backdrop"></div>
      <canvas
        ref={baseCanvasRef}
        className="ascii-screensaver__canvas ascii-screensaver__canvas--base"
      />
      <canvas
        ref={overlayCanvasRef}
        className="ascii-screensaver__canvas ascii-screensaver__canvas--overlay"
      />
      <div className="ascii-screensaver__texture"></div>
      <div className="ascii-screensaver__vignette"></div>
    </div>
  );
});

AsciiScreensaver.displayName = 'AsciiScreensaver';

export default AsciiScreensaver;
