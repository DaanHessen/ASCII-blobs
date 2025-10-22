import { CELL_SIZE, HALF_CELL, CANVAS_FONT, OVERLAY_RGB } from './constants';

export const createGlyphAtlas = (
  scale: number,
  characters: readonly string[],
): (CanvasImageSource | null)[] => {
  const atlas: (CanvasImageSource | null)[] = new Array(characters.length).fill(null);
  const pixelSize = Math.max(1, Math.ceil(CELL_SIZE * scale));

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    if (!character || !character.trim()) {
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
