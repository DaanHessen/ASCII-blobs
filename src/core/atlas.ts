import { CELL_SIZE, HALF_CELL, CANVAS_FONT } from './constants';

export const createGlyphAtlas = (
  scale: number,
  characters: readonly string[],
  primaryColor: string = 'rgb(100, 180, 255)',
): (CanvasImageSource | null)[] => {
  const atlas: (CanvasImageSource | null)[] = new Array(characters.length).fill(null);
  const pixelSize = Math.max(1, Math.ceil(CELL_SIZE * scale));

  // Parse primary color to create glow/shadow variants
  const glowColor = primaryColor.replace('rgb', 'rgba').replace(')', ', 0.35)');
  const shadowColor1 = primaryColor.replace('rgb', 'rgba').replace(')', ', 0.6)');
  const shadowColor2 = primaryColor.replace('rgb', 'rgba').replace(')', ', 0.3)');

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
      ctx.fillStyle = glowColor;
      ctx.shadowColor = shadowColor1;
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = CANVAS_FONT;
      ctx.fillText(character, HALF_CELL, HALF_CELL);
      ctx.shadowColor = shadowColor2;
      ctx.shadowBlur = 2;
      ctx.fillStyle = primaryColor;
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
      ctx.fillStyle = glowColor;
      ctx.shadowColor = shadowColor1;
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = CANVAS_FONT;
      ctx.fillText(character, HALF_CELL, HALF_CELL);
      ctx.shadowColor = shadowColor2;
      ctx.shadowBlur = 2;
      ctx.fillStyle = primaryColor;
      ctx.fillText(character, HALF_CELL, HALF_CELL);
      atlas[index] = canvas;
    }
  }

  return atlas;
};
