/**
 * Three passes. Two of them run at one texel per grid cell, which is where the
 * field actually varies; only the last runs per pixel.
 *
 *   height   domain-warped fBm -> a scalar height, one texel per cell
 *   light    reads that height and its neighbours -> normal, shading, ramp
 *   compose  one glyph lookup per pixel
 *
 * Splitting height from light is what makes the noise affordable. Lighting
 * needs the field's gradient, and sampling the whole warped fBm four extra
 * times per cell would quintuple the cost; reading four neighbouring texels
 * costs nothing and gives the same slope.
 */

export const vertexShaderSource = `#version 300 es
// Fullscreen triangle: no attributes, no buffers, no vertex fetch.
void main() {
  vec2 position = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}
`;

/**
 * Shared noise. Gradient noise rather than value noise — value noise has
 * visible axis-aligned blockiness at low octave counts, which reads as a grid
 * inside something that is already on a grid.
 */
const NOISE = `
vec3 hash33(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 74.7)),
    dot(p, vec3(269.5, 183.3, 246.1)),
    dot(p, vec3(113.5, 271.9, 124.6))
  );
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float gradientNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      mix(dot(hash33(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
          dot(hash33(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
      mix(dot(hash33(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
          dot(hash33(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x),
      u.y),
    mix(
      mix(dot(hash33(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
          dot(hash33(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x),
      mix(dot(hash33(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
          dot(hash33(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x),
      u.y),
    u.z);
}

// Rotating between octaves stops the lobes of successive octaves lining up,
// which otherwise leaves faint diagonal seams across the whole field.
const mat2 OCTAVE_ROTATION = mat2(0.80, 0.60, -0.60, 0.80);

float fbm(vec2 p, float t, int octaves) {
  float sum = 0.0;
  float amplitude = 0.5;
  float normalisation = 0.0;

  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    sum += amplitude * gradientNoise(vec3(p, t));
    normalisation += amplitude;
    p = OCTAVE_ROTATION * p * 2.02;
    t *= 1.17;
    amplitude *= 0.5;
  }

  return sum / max(normalisation, 1e-4);
}
`;

/** Pass 1 — the height field, at one texel per grid cell. */
export const heightShaderSource = `#version 300 es
precision highp float;

uniform vec2 uGridSize;
uniform float uTime;
uniform float uScale;
uniform float uWarp;
uniform int uOctaves;
uniform float uContrast;

out vec4 fragColor;

${NOISE}

void main() {
  vec2 cell = vec2(floor(gl_FragCoord.x), uGridSize.y - 1.0 - floor(gl_FragCoord.y));
  vec2 p = cell * uScale;

  // Two levels of domain warping. One level gives soft billows; the second is
  // what produces the filaments and folds that reward staring at it, because
  // the field stops being locally self-similar — every region has its own
  // character instead of the whole screen looking like one texture.
  vec2 q = vec2(
    fbm(p, uTime, uOctaves),
    fbm(p + vec2(5.2, 1.3), uTime, uOctaves)
  );

  vec2 r = vec2(
    fbm(p + uWarp * q + vec2(1.7, 9.2), uTime * 0.83, uOctaves),
    fbm(p + uWarp * q + vec2(8.3, 2.8), uTime * 0.83, uOctaves)
  );

  float height = fbm(p + uWarp * r, uTime * 0.71, uOctaves);

  // Into 0-1, then a contrast curve around the midpoint. The raw fBm spends
  // most of its range near zero, which quantises to two or three ramp steps.
  height = height * 0.5 + 0.5;
  height = clamp((height - 0.5) * uContrast + 0.5, 0.0, 1.0);

  // The second warp vector is kept: it varies smoothly and independently of
  // height, which makes it a free way to vary tone without a second noise
  // field.
  float tint = r.x * 0.5 + 0.5;

  fragColor = vec4(height, tint, 0.0, 1.0);
}
`;

/** Pass 2 — normals and shading, still one texel per grid cell. */
export const lightShaderSource = `#version 300 es
precision highp float;

uniform sampler2D uHeight;
uniform vec2 uGridSize;
uniform vec3 uLight;
uniform float uRelief;
uniform float uAmbient;
uniform float uBaseDensity;
uniform float uHorizon;

uniform float uRevealElapsed;
uniform float uRevealSpread;
uniform float uRevealFade;

// r = shade, g = tone, b = reveal
out vec4 fragColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float heightAt(ivec2 texel) {
  ivec2 clamped = clamp(texel, ivec2(0), ivec2(uGridSize) - 1);
  return texelFetch(uHeight, clamped, 0).r;
}

void main() {
  ivec2 texel = ivec2(gl_FragCoord.xy);
  vec2 cell = vec2(float(texel.x), uGridSize.y - 1.0 - float(texel.y));

  vec4 here = texelFetch(uHeight, texel, 0);
  float height = here.r;
  float tint = here.g;

  // Central differences on the neighbouring cells. The height texture is
  // already the field sampled per cell, so this is the field's true slope at
  // grid resolution rather than an approximation of it.
  float left = heightAt(texel + ivec2(-1, 0));
  float right = heightAt(texel + ivec2(1, 0));
  float below = heightAt(texel + ivec2(0, -1));
  float above = heightAt(texel + ivec2(0, 1));

  // y is flipped relative to the texture, so the vertical difference is too.
  vec2 slope = vec2(right - left, below - above) * 0.5;

  vec3 normal = normalize(vec3(-slope * uRelief, 1.0));
  float ndl = max(dot(normal, uLight), 0.0);
  // Grazing light along the ridges. This is what makes the field read as a
  // lit surface with a direction rather than a cloud.
  float rim = pow(1.0 - normal.z, 2.5);

  float lit = uAmbient + 0.92 * ndl + 0.34 * rim * ndl;

  // Density follows height: the field thins toward its troughs and closes up
  // over its crests, so the ramp describes elevation and the lighting
  // describes the surface.
  float form = smoothstep(0.25, 0.80, height);

  // A gentle vertical falloff keeps the top of the frame quieter than the
  // bottom, which stops the field competing with anything laid over it.
  float horizon = 1.0 - (cell.y / uGridSize.y) * uHorizon;

  float shade = clamp(uBaseDensity + form * lit * horizon, 0.0, 1.0);

  float reveal = clamp(
    (uRevealElapsed - hash21(cell) * uRevealSpread) / uRevealFade,
    0.0,
    1.0
  );
  reveal = reveal * reveal * (3.0 - 2.0 * reveal);

  // Tone is the lighting alone, not the lighting times coverage. Where a glyph
  // is drawn at all it should be lit properly; multiplying by coverage means
  // sparse regions are also dark regions, and the whole field greys out.
  // Coverage decides *whether* a glyph appears, lighting decides how it looks.
  fragColor = vec4(shade * reveal, mix(lit, tint, 0.18), reveal, 1.0);
}
`;

/** Pass 3 — one glyph lookup per pixel, no field maths. */
export const composeShaderSource = `#version 300 es
precision highp float;

uniform sampler2D uField;
uniform sampler2D uAtlas;
uniform vec2 uResolution;
uniform vec2 uGridSize;
uniform float uCellPx;
uniform float uSteps;
uniform float uDither;
uniform float uOpacity;
uniform vec3 uInk;
uniform vec3 uInkShadow;

out vec4 fragColor;

// Recursive Bayer construction. Ordered dithering rather than per-cell random
// noise: the pattern is fixed in screen space, so the ramp gains roughly three
// effective levels without the glyphs shimmering between frames.
float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 cellCoord = frag / uCellPx;
  ivec2 cell = ivec2(floor(cellCoord));
  if (cell.x < 0 || cell.y < 0 || cell.x >= int(uGridSize.x) || cell.y >= int(uGridSize.y)) {
    discard;
  }

  // The earlier passes work in y-down screen space so the lighting reads
  // correctly, but a framebuffer's first texel row is its bottom.
  ivec2 texel = ivec2(cell.x, int(uGridSize.y) - 1 - cell.y);
  vec4 data = texelFetch(uField, texel, 0);
  float shade = data.r;
  float tone = data.g;
  float reveal = data.b;

  float dither = (bayer8(vec2(cell)) - 0.5) * uDither;
  float slot = clamp(floor(shade * (uSteps - 1.0) + dither + 0.5), 0.0, uSteps - 1.0);

  vec2 inCell = fract(cellCoord);
  float ink = texture(uAtlas, vec2((slot + inCell.x) / uSteps, inCell.y)).a;
  if (ink <= 0.004) discard;

  // Two-stop colour only. Lit faces move toward the ink colour, shadowed ones
  // sit near the background hue — enough separation to read depth, not enough
  // to stop reading as monochrome text.
  vec3 color = mix(uInkShadow, uInk, smoothstep(0.14, 0.68, tone));

  // Density carries the shading, opacity does not. Fading glyphs out in step
  // with the ramp would apply the same falloff twice and turn the midtones to
  // mush; a glyph that is chosen at all is drawn at close to full strength,
  // which is how hand-set ASCII art reads.
  float presence = smoothstep(0.0, 0.1, shade);
  fragColor = vec4(color, ink * uOpacity * reveal * presence);
}
`;
