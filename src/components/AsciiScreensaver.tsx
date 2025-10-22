import { useEffect, useRef } from "react";
import type { State, BlobTempBuffers } from "../core/types";
import {
  CELL_SIZE,
  HALF_CELL,
  FRAME_INTERVAL,
  REVEAL_DURATION,
  REVEAL_FADE,
  ASCII_PALETTE,
  CANVAS_FONT,
  OVERLAY_RGB,
} from "../core/constants";
import { createBlob, resetBlob, updateBlob, randomBetween, clamp } from "../core/blob";
import { setupGrid } from "../core/grid";
import { drawFrame } from "../core/renderer";
import "./AsciiScreensaver.css";

const blobTemp: BlobTempBuffers = {
  centersX: [],
  centersY: [],
  cos: [],
  sin: [],
  invRadiusX: [],
  invRadiusY: [],
  intensity: [],
};

const createGlyphAtlas = (
  scale: number,
  characters: readonly string[],
): (CanvasImageSource | null)[] => {
  const atlas: (CanvasImageSource | null)[] = new Array(characters.length).fill(null);
  const pixelSize = Math.max(1, Math.ceil(CELL_SIZE * scale));

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    if (!character.trim()) {
      atlas[index] = null;
      continue;
    }

    const needsOffscreen = typeof OffscreenCanvas !== "undefined";
    if (needsOffscreen) {
      const canvas = new OffscreenCanvas(pixelSize, pixelSize);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        atlas[index] = null;
        continue;
      }
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, CELL_SIZE, CELL_SIZE);
      ctx.fillStyle = "rgba(96, 165, 250, 0.35)";
      ctx.shadowColor = "rgba(59, 130, 246, 0.6)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = CANVAS_FONT;
      ctx.fillText(character, HALF_CELL, HALF_CELL);
      ctx.shadowColor = "rgba(59, 130, 246, 0.3)";
      ctx.shadowBlur = 2;
      ctx.fillStyle = OVERLAY_RGB;
      ctx.fillText(character, HALF_CELL, HALF_CELL);
      atlas[index] = canvas.transferToImageBitmap();
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = pixelSize;
      canvas.height = pixelSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        atlas[index] = null;
        continue;
      }
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, CELL_SIZE, CELL_SIZE);
      ctx.fillStyle = "rgba(96, 165, 250, 0.35)";
      ctx.shadowColor = "rgba(59, 130, 246, 0.6)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = CANVAS_FONT;
      ctx.fillText(character, HALF_CELL, HALF_CELL);
      ctx.shadowColor = "rgba(59, 130, 246, 0.3)";
      ctx.shadowBlur = 2;
      ctx.fillStyle = OVERLAY_RGB;
      ctx.fillText(character, HALF_CELL, HALF_CELL);
      atlas[index] = canvas;
    }
  }

  return atlas;
};

const AsciiScreensaver = () => {
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>();
  const stateRef = useRef<State | null>(null);
  const lastTimestampRef = useRef<number>(performance.now());
  const lastDrawRef = useRef<number>(performance.now());
  const revealStartRef = useRef<number>(performance.now());

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

    const characterLUT = Array.from({ length: ASCII_PALETTE.length }, (_, index) => {
      const baseIndex = index;
      const bias = randomBetween(-0.2, 0.2);
      const adjusted = clamp(baseIndex + bias, 0, ASCII_PALETTE.length - 1);
      return ASCII_PALETTE[Math.round(adjusted)];
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
        revealDelays[idx] = Math.max(0, randomBetween(-REVEAL_FADE * 0.65, REVEAL_DURATION));
      }

      const blobCount = width < 640 ? 2 : width < 1024 ? 3 : width < 1600 ? 4 : 5;
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

      const delta = Math.min(now - lastTimestampRef.current, 120);
      lastTimestampRef.current = now;

      const revealElapsed = Math.max(0, now - revealStartRef.current);
      const movementFactor = clamp(revealElapsed / REVEAL_DURATION, 0, 1);
      const effectiveDelta = delta * movementFactor;

      const { blobs, columns, rows } = state;
      for (let index = 0; index < blobs.length; index += 1) {
        let blob = blobs[index];
        if (blob.life <= 0) {
          blob = createBlob(columns, rows);
        }
        const updated = updateBlob(blob, effectiveDelta, columns, rows, now);
        blobs[index] = updated.life <= 0 ? resetBlob(columns, rows) : updated;
      }

      if (now - lastDrawRef.current >= FRAME_INTERVAL) {
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
    <div className="ascii-screensaver" aria-hidden="true">
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
};

export default AsciiScreensaver;
