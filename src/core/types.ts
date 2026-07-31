export type CloudBlob = {
  /** Centre X in grid cells. */
  cx: number;
  /** Centre Y in grid cells. */
  cy: number;
  /** Unbreathed radius along the blob's local X axis, in cells. */
  baseRadiusX: number;
  /** Unbreathed radius along the blob's local Y axis, in cells. */
  baseRadiusY: number;
  /** Rotation of the local axes, in radians. */
  rotation: number;
  /** Angular velocity, radians per millisecond. */
  rotationSpeed: number;
  /** Contribution to the scalar field at its centre. */
  intensity: number;
  /** Velocity in cells per millisecond. */
  velocityX: number;
  velocityY: number;
  /** Fractional radius swing during breathing. */
  wobbleAmplitude: number;
  /** Breathing frequency, radians per millisecond. */
  wobbleSpeed: number;
  wobblePhase: number;
  /** Remaining lifetime in milliseconds. */
  life: number;
  /** Total lifespan in milliseconds. */
  maxLife: number;
};
