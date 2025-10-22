export type CloudBlob = {
  /** Current X center position */
  cx: number;
  /** Current Y center position */
  cy: number;
  /** Base radius along X axis */
  baseRadiusX: number;
  /** Base radius along Y axis  */
  baseRadiusY: number;
  /** Current rotation angle in radians */
  rotation: number;
  /** Angular velocity (radians per frame) */
  rotationSpeed: number;
  /** Brightness/opacity multiplier (0-1) */
  intensity: number;
  /** Horizontal velocity */
  velocityX: number;
  /** Vertical velocity */
  velocityY: number;
  /** Maximum size variation during pulsing */
  wobbleAmplitude: number;
  /** Frequency of pulsing animation */
  wobbleSpeed: number;
  /** Phase offset for wobble (for variation between blobs) */
  wobblePhase: number;
  /** Remaining lifetime in milliseconds */
  life: number;
  /** Total lifespan in milliseconds */
  maxLife: number;
};

export type State = {
  /** Number of grid columns */
  columns: number;
  /** Number of grid rows */
  rows: number;
  /** Horizontal offset of grid origin */
  gridOffsetX: number;
  /** Vertical offset of grid origin */
  gridOffsetY: number;
  /** Total number of cells in the grid */
  cellCount: number;
  /** X coordinates of cell centers */
  cellCentersX: Float32Array;
  /** Y coordinates of cell centers */
  cellCentersY: Float32Array;
  /** Column index for each cell */
  cellColumns: Float32Array;
  /** Row index for each cell */
  cellRows: Float32Array;
  /** Base brightness value for each cell  */
  baseBrightness: Float32Array;
  /** Random jitter for organic variation */
  noiseJitter: Float32Array;
  /** Random bias for character selection variation */
  noisePaletteBias: Float32Array;
  /** Delay values for initial reveal animation */
  revealDelays: Float32Array;
  /** Pre-rendered glyph sprites for each ASCII character */
  glyphs: (CanvasImageSource | null)[];
  /** Array of active blob instances */
  blobs: CloudBlob[];
};

export type BlobTempBuffers = {
  /** Center X positions for all blobs */
  centersX: number[];
  /** Center Y positions for all blobs */
  centersY: number[];
  /** Cosine of rotation angle for each blob */
  cos: number[];
  /** Sine of rotation angle for each blob */
  sin: number[];
  /** Inverse of effective radiusX */
  invRadiusX: number[];
  /** Inverse of effective radiusY */
  invRadiusY: number[];
  /** Final intensity value */
  intensity: number[];
};
