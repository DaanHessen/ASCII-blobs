import { buildGlyphAtlas } from '../glyphAtlas';
import type { GlyphAtlas } from '../glyphAtlas';
import { parseColor } from './color';
import {
  composeShaderSource,
  heightShaderSource,
  lightShaderSource,
  vertexShaderSource,
} from './shaders';

export type GlRendererOptions = {
  canvas: HTMLCanvasElement;
  characters: string;
  fontFamily: string;
  /** Cell edge in CSS pixels. */
  cellSize: number;
  rampSteps: number;
  ink: string;
  inkShadow: string;
  /** Direction toward the light, y-down. */
  light: [number, number, number];
  relief: number;
  ambient: number;
  dither: number;
  baseDensity: number;
  opacity: number;
  horizon: number;
  /** Spatial frequency of the field, in inverse cells. */
  fieldScale: number;
  /** Strength of the domain warp. */
  warp: number;
  octaves: number;
  contrast: number;
  revealSpread: number;
  revealFade: number;
};

const compile = (gl: WebGL2RenderingContext, type: number, source: string): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('ascii-blobs: could not create shader');
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`ascii-blobs: shader compile failed\n${log ?? ''}`);
  }
  return shader;
};

const link = (gl: WebGL2RenderingContext, fragmentSource: string): WebGLProgram => {
  const program = gl.createProgram();
  if (!program) {
    throw new Error('ascii-blobs: could not create program');
  }
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`ascii-blobs: program link failed\n${log ?? ''}`);
  }
  return program;
};

const uniformMap = (
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: readonly string[],
): Record<string, WebGLUniformLocation | null> => {
  const locations: Record<string, WebGLUniformLocation | null> = {};
  for (const name of names) {
    locations[name] = gl.getUniformLocation(program, name);
  }
  return locations;
};

const HEIGHT_UNIFORMS = ['uGridSize', 'uTime', 'uScale', 'uWarp', 'uOctaves', 'uContrast'] as const;

const LIGHT_UNIFORMS = [
  'uHeight',
  'uGridSize',
  'uLight',
  'uRelief',
  'uAmbient',
  'uBaseDensity',
  'uHorizon',
  'uRevealElapsed',
  'uRevealSpread',
  'uRevealFade',
] as const;

const COMPOSE_UNIFORMS = [
  'uField',
  'uAtlas',
  'uResolution',
  'uGridSize',
  'uCellPx',
  'uSteps',
  'uDither',
  'uOpacity',
  'uInk',
  'uInkShadow',
] as const;

const FALLBACK_INK: [number, number, number] = [0.72, 0.76, 0.82];

type Target = {
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
};

export class GlRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly heightProgram: WebGLProgram;
  private readonly lightProgram: WebGLProgram;
  private readonly composeProgram: WebGLProgram;
  private readonly heightUniforms: Record<string, WebGLUniformLocation | null>;
  private readonly lightUniforms: Record<string, WebGLUniformLocation | null>;
  private readonly composeUniforms: Record<string, WebGLUniformLocation | null>;
  private readonly vao: WebGLVertexArrayObject | null;
  private readonly atlasTexture: WebGLTexture | null;

  private heightTarget: Target = { texture: null, framebuffer: null };
  private fieldTarget: Target = { texture: null, framebuffer: null };
  private atlas: GlyphAtlas | null = null;
  private options: GlRendererOptions;
  private devicePixelRatio = 1;
  private widthPx = 0;
  private heightPx = 0;
  private gridColumns = 0;
  private gridRows = 0;

  /** Grid extent in cells. */
  columns = 0;
  rows = 0;

  private constructor(gl: WebGL2RenderingContext, options: GlRendererOptions) {
    this.gl = gl;
    this.options = options;
    this.heightProgram = link(gl, heightShaderSource);
    this.lightProgram = link(gl, lightShaderSource);
    this.composeProgram = link(gl, composeShaderSource);
    this.heightUniforms = uniformMap(gl, this.heightProgram, HEIGHT_UNIFORMS);
    this.lightUniforms = uniformMap(gl, this.lightProgram, LIGHT_UNIFORMS);
    this.composeUniforms = uniformMap(gl, this.composeProgram, COMPOSE_UNIFORMS);

    this.vao = gl.createVertexArray();
    this.atlasTexture = gl.createTexture();

    gl.clearColor(0, 0, 0, 0);
  }

  /**
   * Probes WebGL2 on a throwaway canvas. A canvas can only ever hand out one
   * context type, so asking the real canvas for 'webgl2' and then falling back
   * to '2d' on failure is not possible — the second call returns null. The
   * decision has to be made before the real canvas is touched.
   */
  static isSupported(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }
    try {
      const probe = document.createElement('canvas');
      probe.width = 1;
      probe.height = 1;
      return probe.getContext('webgl2') !== null;
    } catch {
      return false;
    }
  }

  static create(options: GlRendererOptions): GlRenderer | null {
    const gl = options.canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: 'low-power',
    });
    if (!gl || gl.isContextLost()) {
      return null;
    }
    try {
      return new GlRenderer(gl, options);
    } catch (error) {
      if (typeof console !== 'undefined') {
        console.warn(error);
      }
      return null;
    }
  }

  setOptions(options: GlRendererOptions): void {
    const rebuildAtlas =
      options.characters !== this.options.characters ||
      options.fontFamily !== this.options.fontFamily ||
      options.rampSteps !== this.options.rampSteps ||
      options.cellSize !== this.options.cellSize;
    this.options = options;
    if (rebuildAtlas) {
      this.uploadAtlas();
    }
  }

  private uploadAtlas(): void {
    const { gl, atlasTexture } = this;
    if (!atlasTexture) {
      return;
    }

    this.atlas = buildGlyphAtlas({
      characters: this.options.characters,
      fontFamily: this.options.fontFamily,
      slotPx: Math.max(16, Math.round(this.options.cellSize * this.devicePixelRatio * 1.5)),
      steps: this.options.rampSteps,
    });
    if (!this.atlas) {
      return;
    }

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this.atlas.source as TexImageSource,
    );

    // An incomplete texture samples as opaque black, which would fill every
    // cell with the densest glyph rather than failing visibly. Surface it.
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      this.atlas = null;
      if (typeof console !== 'undefined') {
        console.warn(`ascii-blobs: glyph atlas upload failed (gl error ${error})`);
      }
      return;
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  private allocateTarget(target: Target): Target {
    const { gl } = this;
    if (target.texture) gl.deleteTexture(target.texture);
    if (target.framebuffer) gl.deleteFramebuffer(target.framebuffer);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      this.gridColumns,
      this.gridRows,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return { texture, framebuffer };
  }

  resize(cssWidth: number, cssHeight: number, devicePixelRatio: number): void {
    const { gl, options } = this;
    // Above 2× the extra pixels are invisible at this glyph size and cost real
    // fill rate on phones, so the buffer is capped rather than matching DPR.
    const dpr = Math.min(devicePixelRatio, 2);
    const rebuildAtlas = dpr !== this.devicePixelRatio || !this.atlas;
    this.devicePixelRatio = dpr;

    this.widthPx = Math.max(1, Math.floor(cssWidth * dpr));
    this.heightPx = Math.max(1, Math.floor(cssHeight * dpr));

    options.canvas.width = this.widthPx;
    options.canvas.height = this.heightPx;
    options.canvas.style.width = `${cssWidth}px`;
    options.canvas.style.height = `${cssHeight}px`;

    this.columns = cssWidth / options.cellSize;
    this.rows = cssHeight / options.cellSize;
    this.gridColumns = Math.max(1, Math.ceil(this.columns));
    this.gridRows = Math.max(1, Math.ceil(this.rows));

    this.heightTarget = this.allocateTarget(this.heightTarget);
    this.fieldTarget = this.allocateTarget(this.fieldTarget);

    gl.bindTexture(gl.TEXTURE_2D, null);

    if (rebuildAtlas) {
      this.uploadAtlas();
    }
  }

  render(elapsedMs: number, revealElapsed: number): void {
    const { gl, options } = this;
    if (!this.atlas || !this.heightTarget.texture || !this.fieldTarget.texture) {
      return;
    }

    gl.bindVertexArray(this.vao);
    gl.disable(gl.BLEND);

    // Textures written this frame must not stay bound as samplers while they
    // are being rendered into — that is a feedback loop, and drivers respond
    // by dropping the draw entirely.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // Pass 1: height.
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.heightTarget.framebuffer);
    gl.viewport(0, 0, this.gridColumns, this.gridRows);
    gl.useProgram(this.heightProgram);

    const height = this.heightUniforms;
    gl.uniform2f(height.uGridSize ?? null, this.gridColumns, this.gridRows);
    gl.uniform1f(height.uTime ?? null, elapsedMs * 0.001);
    gl.uniform1f(height.uScale ?? null, options.fieldScale);
    gl.uniform1f(height.uWarp ?? null, options.warp);
    gl.uniform1i(height.uOctaves ?? null, options.octaves);
    gl.uniform1f(height.uContrast ?? null, options.contrast);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Pass 2: normals and shading.
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fieldTarget.framebuffer);
    gl.viewport(0, 0, this.gridColumns, this.gridRows);
    gl.useProgram(this.lightProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.heightTarget.texture);

    const lighting = this.lightUniforms;
    gl.uniform1i(lighting.uHeight ?? null, 0);
    gl.uniform2f(lighting.uGridSize ?? null, this.gridColumns, this.gridRows);

    const [lx, ly, lz] = options.light;
    const length = Math.hypot(lx, ly, lz) || 1;
    gl.uniform3f(lighting.uLight ?? null, lx / length, ly / length, lz / length);
    gl.uniform1f(lighting.uRelief ?? null, options.relief);
    gl.uniform1f(lighting.uAmbient ?? null, options.ambient);
    gl.uniform1f(lighting.uBaseDensity ?? null, options.baseDensity);
    gl.uniform1f(lighting.uHorizon ?? null, options.horizon);
    gl.uniform1f(lighting.uRevealElapsed ?? null, revealElapsed);
    gl.uniform1f(lighting.uRevealSpread ?? null, options.revealSpread);
    gl.uniform1f(lighting.uRevealFade ?? null, options.revealFade);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Pass 3: glyph lookup.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.widthPx, this.heightPx);
    gl.useProgram(this.composeProgram);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const compose = this.composeUniforms;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.fieldTarget.texture);
    gl.uniform1i(compose.uField ?? null, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
    gl.uniform1i(compose.uAtlas ?? null, 2);

    gl.uniform2f(compose.uResolution ?? null, this.widthPx, this.heightPx);
    gl.uniform2f(compose.uGridSize ?? null, this.gridColumns, this.gridRows);
    gl.uniform1f(compose.uCellPx ?? null, options.cellSize * this.devicePixelRatio);
    gl.uniform1f(compose.uSteps ?? null, this.atlas.steps);
    gl.uniform1f(compose.uDither ?? null, options.dither);
    gl.uniform1f(compose.uOpacity ?? null, options.opacity);

    const ink = parseColor(options.ink) ?? FALLBACK_INK;
    const inkShadow = parseColor(options.inkShadow) ?? [ink[0] * 0.4, ink[1] * 0.4, ink[2] * 0.45];
    gl.uniform3f(compose.uInk ?? null, ink[0], ink[1], ink[2]);
    gl.uniform3f(compose.uInkShadow ?? null, inkShadow[0], inkShadow[1], inkShadow[2]);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /**
   * Releases GL objects but deliberately does not call `loseContext()`. React
   * StrictMode mounts, unmounts and remounts against the same canvas element;
   * losing the context there would leave the remounted renderer holding a dead
   * context that silently discards every call.
   */
  dispose(): void {
    const { gl } = this;
    if (gl.isContextLost()) {
      return;
    }
    gl.deleteProgram(this.heightProgram);
    gl.deleteProgram(this.lightProgram);
    gl.deleteProgram(this.composeProgram);
    if (this.atlasTexture) gl.deleteTexture(this.atlasTexture);
    for (const target of [this.heightTarget, this.fieldTarget]) {
      if (target.texture) gl.deleteTexture(target.texture);
      if (target.framebuffer) gl.deleteFramebuffer(target.framebuffer);
    }
    if (this.vao) gl.deleteVertexArray(this.vao);
  }
}
