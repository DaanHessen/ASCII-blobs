import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import type { CSSProperties } from "react";
import type { State, BlobTempBuffers } from "../core/types";
import type { AsciiBlobsConfig } from "../core/config";
import { mergeConfig } from "../core/config";
import { getCanvasFont } from "../core/constants";
import { createBlob, resetBlob, updateBlob, randomBetween, clamp } from "../core/blob";
import { setupGrid } from "../core/grid";
import { drawFrame } from "../core/renderer";
import { createGlyphAtlas } from "../core/atlas";
import { createGaussianSampler } from "../core/gaussian";
import "./AsciiBlobs.css";

export interface AsciiBlobsRef {
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

const AsciiBlobsComponent = forwardRef<AsciiBlobsRef, AsciiBlobsConfig>((userConfig, ref) => {
  const config = useMemo(() => mergeConfig(userConfig), [userConfig]);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
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
      if (!state) {
        return;
      }
      const { columns, rows, blobs } = state;
      for (let index = 0; index < blobs.length; index += 1) {
        blobs[index] = createBlob(columns, rows, { warmStart: true, behavior: config.blobBehavior });
      }
      revealStartRef.current = performance.now();
    },
    getStats: () => ({
      blobCount: stateRef.current?.blobs.length ?? 0,
      fps: fpsRef.current,
      isPaused: isPausedRef.current,
    }),
  }));

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || typeof window === "undefined") {
      return;
    }
    const parent = wrapper.parentElement;
    if (!parent) {
      return;
    }
    const computed = window.getComputedStyle(parent);
    if (computed.position === "static" && !parent.style.position) {
      parent.style.position = "relative";
    }
  }, []);

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

    const gaussian = createGaussianSampler(config.performance.gaussianLutSize);
    const canvasFont = getCanvasFont(config.performance.cellSize);

    const setupState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const scale = window.devicePixelRatio || 1;

      const gridData = setupGrid({
        width,
        height,
        cellSize: config.performance.cellSize,
      });
      const { columns, rows, cellCount } = gridData;

      baseCanvas.style.width = `${width}px`;
      baseCanvas.style.height = `${height}px`;
      baseCanvas.width = Math.floor(width * scale);
      baseCanvas.height = Math.floor(height * scale);
      baseCtx.setTransform(scale, 0, 0, scale, 0, 0);
      baseCtx.font = canvasFont;

      const glyphs = createGlyphAtlas(scale, characterLUT, {
        primaryColor: config.colors.primary,
        glowColor: config.colors.glow,
        shadowColor: config.colors.shadow,
        cellSize: config.performance.cellSize,
        enableBlur: config.performance.enableBlur,
        useOffscreenCanvas: config.performance.useOffscreenCanvas,
      });

      overlayCanvas.style.width = `${width}px`;
      overlayCanvas.style.height = `${height}px`;
      overlayCanvas.width = Math.floor(width * scale);
      overlayCanvas.height = Math.floor(height * scale);
      overlayCtx.setTransform(scale, 0, 0, scale, 0, 0);
      overlayCtx.font = canvasFont;
      overlayCtx.textAlign = "center";
      overlayCtx.textBaseline = "middle";

      baseCtx.clearRect(0, 0, width, height);

      const revealDelays = new Float32Array(cellCount);
      for (let idx = 0; idx < cellCount; idx += 1) {
        revealDelays[idx] = Math.max(
          0,
          randomBetween(-config.animation.revealFade * 0.65, config.animation.revealDuration),
        );
      }

      const blobCount = config.blobBehavior.count;
      const blobs = Array.from({ length: blobCount }, () =>
        createBlob(columns, rows, { warmStart: true, behavior: config.blobBehavior }),
      );

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

      frameCountRef.current += 1;
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
          const newBlob = createBlob(columns, rows, { behavior: config.blobBehavior });
          blobs[index] = newBlob;
          config.onBlobSpawn?.(newBlob);
        } else {
          const updated = updateBlob(blob, effectiveDelta, columns, rows, now);
          if (updated.life <= 0) {
            const newBlob = resetBlob(columns, rows, { behavior: config.blobBehavior });
            blobs[index] = newBlob;
            config.onBlobSpawn?.(newBlob);
          } else {
            blobs[index] = updated;
          }
        }
      }

      if (now - lastDrawRef.current >= config.animation.frameInterval) {
        drawFrame(
          overlayCtx,
          state,
          now,
          characterLUT,
          revealElapsed,
          blobTemp,
          {
            cellSize: config.performance.cellSize,
            revealFade: config.animation.revealFade,
            fadeInDuration: config.blobBehavior.fadeInDuration,
            gaussianFalloff: gaussian.falloff,
          },
        );
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
      stateRef.current = null;
    };
  }, [config]);

  const inlineStyle = useMemo(() => {
    const style: CSSProperties = { zIndex: -1 };
    const styleVars = style as Record<string, string | number>;
    styleVars["--ascii-primary"] = config.colors.primary;
    styleVars["--ascii-glow"] = config.colors.glow;
    styleVars["--ascii-shadow"] = config.colors.shadow;

    if (config.colors.background) {
      styleVars["--ascii-bg-base"] = config.colors.background;
      styleVars["--ascii-bg-mid"] = config.colors.background;
      styleVars["--ascii-bg-dark"] = config.colors.background;
    }

    if (config.style) {
      Object.assign(style, config.style);
    }

    return style;
  }, [config]);

  const wrapperClassName = useMemo(() => {
    return ["ascii-blobs", config.className].filter(Boolean).join(" ");
  }, [config.className]);

  return (
    <div ref={wrapperRef} className={wrapperClassName} style={inlineStyle} aria-hidden="true">
      <div className="ascii-blobs__backdrop"></div>
      <canvas
        ref={baseCanvasRef}
        className="ascii-blobs__canvas ascii-blobs__canvas--base"
      />
      <canvas
        ref={overlayCanvasRef}
        className="ascii-blobs__canvas ascii-blobs__canvas--overlay"
      />
      <div className="ascii-blobs__texture"></div>
      <div className="ascii-blobs__vignette"></div>
    </div>
  );
});

AsciiBlobsComponent.displayName = "AsciiBlobs";

export default AsciiBlobsComponent;
