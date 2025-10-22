import { CELL_SIZE, CANVAS_FONT } from './constants';

export type GlyphAtlasOptions =
  | undefined
  | {
      primaryColor?: string;
      glowColor?: string;
      shadowColor?: string;
      cellSize?: number;
      enableBlur?: boolean;
      useOffscreenCanvas?: boolean;
    };

const DEFAULT_PRIMARY = 'rgb(100, 180, 255)';
const FONT_FAMILY = CANVAS_FONT.slice(CANVAS_FONT.indexOf(' ') + 1);

const toRgba = (color: string | undefined, alpha: number): string => {
  if (!color) {
    return `rgba(100, 180, 255, ${alpha})`;
  }

  const trimmed = color.trim();
  if (trimmed.startsWith('rgba')) {
    const match = trimmed.match(/rgba?\(([^)]+)\)/);
    if (!match) {
      return trimmed;
    }
    const channelsRaw = match[1] ?? '';
    if (!channelsRaw) {
      return trimmed;
    }
    const channels = channelsRaw.split(',').map((part) => part.trim()).slice(0, 3);
    return `rgba(${channels.join(', ')}, ${alpha})`;
  }

  if (trimmed.startsWith('rgb')) {
    return trimmed.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  }

  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    let normalized = hex;
    if (hex.length === 3) {
      normalized = hex
        .split('')
        .map((char) => `${char}${char}`)
        .join('');
    }
    if (normalized.length !== 6) {
      return trimmed;
    }

    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);

    if ([r, g, b].some((value) => Number.isNaN(value))) {
      return trimmed;
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return trimmed;
};

const resolveOptions = (
  primaryOrOptions?: string | GlyphAtlasOptions,
  maybeOptions?: GlyphAtlasOptions,
) => {
  if (typeof primaryOrOptions === 'string') {
    return {
      primaryColor: primaryOrOptions,
      ...(maybeOptions ?? {}),
    };
  }

  return primaryOrOptions ?? maybeOptions ?? {};
};

export const createGlyphAtlas = (
  scale: number,
  characters: readonly string[],
  primaryOrOptions?: string | GlyphAtlasOptions,
  maybeOptions?: GlyphAtlasOptions,
): (CanvasImageSource | null)[] => {
  const resolved = resolveOptions(primaryOrOptions, maybeOptions);
  const primaryColor = resolved.primaryColor ?? DEFAULT_PRIMARY;
  const cellSize = Math.max(4, resolved.cellSize ?? CELL_SIZE);
  const halfCell = cellSize / 2;
  const font = cellSize === CELL_SIZE ? CANVAS_FONT : `${cellSize * 0.86}px ${FONT_FAMILY}`;
  const enableBlur = resolved.enableBlur ?? true;
  const supportsOffscreen = typeof OffscreenCanvas !== 'undefined';
  const allowOffscreen =
    (resolved.useOffscreenCanvas ?? supportsOffscreen) && supportsOffscreen;

  const glowColor = resolved.glowColor ?? toRgba(primaryColor, 0.35);
  const shadowOuter = resolved.shadowColor ?? toRgba(primaryColor, 0.6);
  const shadowInner = resolved.shadowColor ?? toRgba(primaryColor, 0.3);

  const atlas: (CanvasImageSource | null)[] = new Array(characters.length).fill(null);
  const pixelSize = Math.max(1, Math.ceil(cellSize * scale));

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    if (!character || !character.trim()) {
      atlas[index] = null;
      continue;
    }

    if (allowOffscreen) {
      const offscreen = new OffscreenCanvas(pixelSize, pixelSize);
      const ctx = offscreen.getContext('2d');
      if (!ctx) {
        atlas[index] = null;
        continue;
      }

      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, cellSize, cellSize);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = font;

      ctx.fillStyle = glowColor;
      ctx.shadowColor = enableBlur ? shadowOuter : 'transparent';
      ctx.shadowBlur = enableBlur ? 6 : 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillText(character, halfCell, halfCell);

      ctx.shadowColor = enableBlur ? shadowInner : 'transparent';
      ctx.shadowBlur = enableBlur ? 2 : 0;
      ctx.fillStyle = primaryColor;
      ctx.fillText(character, halfCell, halfCell);

      atlas[index] = offscreen.transferToImageBitmap();
      continue;
    }

    const canvas = document.createElement('canvas');
    canvas.width = pixelSize;
    canvas.height = pixelSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      atlas[index] = null;
      continue;
    }

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, cellSize, cellSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font;

    ctx.fillStyle = glowColor;
    ctx.shadowColor = enableBlur ? shadowOuter : 'transparent';
    ctx.shadowBlur = enableBlur ? 6 : 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText(character, halfCell, halfCell);

    ctx.shadowColor = enableBlur ? shadowInner : 'transparent';
    ctx.shadowBlur = enableBlur ? 2 : 0;
    ctx.fillStyle = primaryColor;
    ctx.fillText(character, halfCell, halfCell);

    atlas[index] = canvas;
  }

  return atlas;
};
