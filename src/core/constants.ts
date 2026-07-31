/** Default cell edge in CSS pixels. */
export const CELL_SIZE = 13;

/**
 * Glyph metrics differ enough between monospace faces to change where the ramp
 * sits, so the stack is deliberately short and ends at the generic keyword
 * rather than at a specific fallback.
 */
export const FONT_FAMILY = `"JetBrains Mono", "SF Mono", "Menlo", "Consolas", monospace`;

/**
 * Gaussian decay rate. Shared by both rasterisers so they cannot drift apart.
 * At 1.0 a blob still contributes a third of its peak a full radius out, and
 * seven of those overlap into one undifferentiated mass; this is tight enough
 * that blobs read as separate bodies.
 */
export const FIELD_FALLOFF = 2.2;

/** Squared normalised distance past which a blob is skipped entirely. */
export const FIELD_CUTOFF = 3.5;
