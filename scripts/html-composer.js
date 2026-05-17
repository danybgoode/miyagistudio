import { svgToDataUri } from "./svg-utils.js";

export function composeIconHtml({ icon, theme, outputSize }) {
  const css = composeCss({ icon, theme, outputSize });

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>${css}</style>
</head>
<body>
  <svg class="defs" width="0" height="0" aria-hidden="true" focusable="false">
    <filter id="liquidNoise">
      <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="3" seed="19" result="noise"/>
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .24 0"/>
    </filter>
    <filter id="opticalWarp">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="8" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="7" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </svg>
  <main class="stage" aria-label="${escapeHtml(icon.name)} rendered as a glass application icon">
    <section class="app-icon">
      <div class="ambient"></div>
      <div class="color-field"></div>
      <div class="depth-shadow"></div>
      <div class="glass-core"></div>
      <div class="edge-light"></div>
      <div class="inner-depth"></div>
      <div class="icon-aura glyph-mask"></div>
      <div class="icon-shadow glyph-mask"></div>
      <div class="glyph-wrap">${icon.markup}</div>
      <div class="specular"></div>
      <div class="reflection"></div>
      <div class="grain"></div>
    </section>
  </main>
</body>
</html>`;
}

export function composeIconSvg({ icon, theme, outputSize }) {
  const html = composeIconHtml({ icon, theme, outputSize })
    .replace("<!doctype html>", "")
    .replace(/<html[^>]*>|<\/html>|<head>|<\/head>|<body>|<\/body>/g, "");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${outputSize}" height="${outputSize}" viewBox="0 0 ${outputSize} ${outputSize}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml">${html}</div>
  </foreignObject>
</svg>`;
}

function composeCss({ icon, theme, outputSize }) {
  const material = theme.material;
  const lighting = theme.lighting;
  const shadow = theme.shadow;
  const palette = theme.palette;
  const light = icon.metrics.light;
  const dominant = icon.metrics.dominantColor;
  const glyphScale = icon.metrics.coverage > 0.72 ? 0.57 : 0.64;
  const mask = icon.maskUri ?? svgToDataUri(icon.svg);
  const gradient = gradientStops(palette.background, dominant);
  const glassStops = gradientStops(palette.glass, "rgba(255,255,255,0.18)");
  const edgeStops = gradientStops(palette.edge, "rgba(255,255,255,0.22)");

  return `
:root {
  --size: ${outputSize}px;
  --radius: ${Math.round(outputSize * 0.218)}px;
  --blur: ${material.blurRadius}px;
  --glass-opacity: ${material.glassOpacity};
  --surface-opacity: ${material.surfaceOpacity};
  --edge-opacity: ${material.edgeOpacity};
  --noise-opacity: ${material.noiseOpacity};
  --lighting: ${lighting.intensity};
  --specular: ${lighting.specularOpacity};
  --reflection: ${lighting.reflectionStrength};
  --glow: ${lighting.ambientGlow};
  --shadow-softness: ${shadow.softness}px;
  --shadow-opacity: ${shadow.opacity};
  --shadow-y: ${shadow.y}px;
  --dominant: ${dominant};
  --light-x: ${Math.round(light.x * 100)}%;
  --light-y: ${Math.round(light.y * 100)}%;
  --glyph-scale: ${glyphScale};
  --glyph-shadow-x: ${light.shadowX}px;
  --glyph-shadow-y: ${light.shadowY}px;
}

* { box-sizing: border-box; }

html,
body,
.stage {
  width: var(--size);
  height: var(--size);
  margin: 0;
  overflow: hidden;
  background: transparent;
}

body {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.defs {
  position: absolute;
  pointer-events: none;
}

.stage {
  display: grid;
  place-items: center;
}

.app-icon {
  position: relative;
  width: var(--size);
  height: var(--size);
  border-radius: var(--radius);
  isolation: isolate;
  overflow: hidden;
  transform: translateZ(0);
}

/* Layer 1: a quiet multicolor environment gives the glass something believable to refract. */
.color-field {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at var(--light-x) var(--light-y), rgba(255,255,255,0.96), transparent 0 21%, transparent 39%),
    radial-gradient(circle at 78% 72%, color-mix(in srgb, var(--dominant) 42%, transparent), transparent 0 31%),
    linear-gradient(135deg, ${gradient});
  filter: saturate(${material.saturation}) contrast(1.02);
  z-index: 0;
}

/* Layer 2: ambient bloom is broad and low opacity so the material feels lit, not neon. */
.ambient {
  position: absolute;
  inset: 9%;
  border-radius: calc(var(--radius) * 0.82);
  background:
    radial-gradient(circle at 48% 42%, rgba(255,255,255,0.42), transparent 0 34%),
    radial-gradient(circle at 52% 62%, color-mix(in srgb, var(--dominant) 32%, transparent), transparent 0 54%);
  filter: blur(calc(var(--shadow-softness) * 1.15));
  opacity: var(--glow);
  z-index: 1;
}

/* Layer 3: the under-shadow anchors the icon as a physical translucent object. */
.depth-shadow {
  position: absolute;
  inset: 8.4% 7.2% 6.2%;
  border-radius: calc(var(--radius) * 0.72);
  background: rgba(15, 22, 35, var(--shadow-opacity));
  filter: blur(var(--shadow-softness));
  transform: translateY(var(--shadow-y));
  z-index: 2;
}

/* Layer 4: the core pane uses translucency, saturation, and blur for frosted optical depth. */
.glass-core {
  position: absolute;
  inset: 5.8%;
  border-radius: calc(var(--radius) * 0.72);
  background:
    linear-gradient(145deg, ${glassStops}),
    radial-gradient(circle at 44% 32%, rgba(255,255,255,0.46), transparent 0 26%),
    color-mix(in srgb, var(--dominant) 18%, rgba(255,255,255,var(--glass-opacity)));
  box-shadow:
    inset 0 1.5px 3px rgba(255,255,255,0.72),
    inset 0 -24px 42px rgba(35, 52, 74, 0.14),
    inset 18px 0 38px rgba(255,255,255,0.08);
  backdrop-filter: blur(var(--blur)) saturate(1.38);
  -webkit-backdrop-filter: blur(var(--blur)) saturate(1.38);
  opacity: var(--surface-opacity);
  z-index: 3;
}

/* Layer 5: edge lighting creates the polished bevel without drawing a hard border. */
.edge-light {
  position: absolute;
  inset: 5.8%;
  border-radius: calc(var(--radius) * 0.72);
  padding: max(1px, calc(var(--size) * 0.004));
  background:
    linear-gradient(138deg, ${edgeStops}),
    radial-gradient(circle at var(--light-x) var(--light-y), rgba(255,255,255,0.96), transparent 0 23%),
    linear-gradient(315deg, rgba(255,255,255,0.04), rgba(255,255,255,0.52), rgba(255,255,255,0.06));
  opacity: var(--edge-opacity);
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  z-index: 5;
}

/* Layer 6: inner shadowing prevents the glass plate from reading as flat plastic. */
.inner-depth {
  position: absolute;
  inset: 5.8%;
  border-radius: calc(var(--radius) * 0.72);
  background:
    radial-gradient(ellipse at 50% 108%, rgba(13,22,35,0.24), transparent 0 38%),
    radial-gradient(ellipse at 0% 20%, rgba(255,255,255,0.22), transparent 0 34%),
    radial-gradient(ellipse at 100% 64%, rgba(9,14,24,0.13), transparent 0 30%);
  mix-blend-mode: soft-light;
  z-index: 6;
}

.glyph-mask {
  position: absolute;
  inset: calc((1 - var(--glyph-scale)) * 50%);
  mask-image: url("${mask}");
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-image: url("${mask}");
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
}

/* Layer 7: a colored silhouette refracts the source icon into the glass below it. */
.icon-aura {
  background:
    radial-gradient(circle at 44% 34%, rgba(255,255,255,0.68), transparent 0 28%),
    linear-gradient(135deg, color-mix(in srgb, var(--dominant) 74%, white), var(--dominant));
  filter: blur(calc(var(--size) * 0.034)) saturate(1.2);
  opacity: calc(0.32 * var(--lighting));
  transform: scale(1.05);
  z-index: 7;
}

/* Layer 8: the soft icon shadow is geometry-aware and moves with the source alpha centroid. */
.icon-shadow {
  background: rgba(12, 18, 29, 0.42);
  filter: blur(calc(var(--size) * 0.026));
  transform: translate(var(--glyph-shadow-x), var(--glyph-shadow-y)) scale(0.99);
  opacity: 0.36;
  z-index: 8;
}

.glyph-wrap {
  position: absolute;
  inset: calc((1 - var(--glyph-scale)) * 50%);
  display: grid;
  place-items: center;
  color: white;
  filter:
    drop-shadow(0 calc(var(--size) * 0.018) calc(var(--size) * 0.018) rgba(7, 14, 24, 0.24))
    drop-shadow(0 calc(var(--size) * -0.004) calc(var(--size) * 0.004) rgba(255, 255, 255, 0.34));
  z-index: 9;
}

.glyph-wrap svg,
.glyph-wrap img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  overflow: visible;
}

/* Layer 9: a clipped highlight gives the top surface a liquid specular response. */
.specular {
  position: absolute;
  inset: 5.8%;
  border-radius: calc(var(--radius) * 0.72);
  background:
    radial-gradient(ellipse at var(--light-x) var(--light-y), rgba(255,255,255,0.94), rgba(255,255,255,0.2) 18%, transparent 42%),
    linear-gradient(164deg, rgba(255,255,255,0.44) 0 13%, transparent 27% 100%);
  filter: url("#opticalWarp");
  mix-blend-mode: screen;
  opacity: var(--specular);
  z-index: 10;
}

/* Layer 10: one restrained reflection sweep signals premium glass without overpowering the glyph. */
.reflection {
  position: absolute;
  inset: 7.4% 10% 50% 8%;
  border-radius: 46% 54% 58% 42% / 58% 54% 46% 42%;
  background:
    linear-gradient(112deg, rgba(255,255,255,0.72), rgba(255,255,255,0.22) 48%, transparent 78%);
  filter: blur(calc(var(--size) * 0.012)) url("#opticalWarp");
  transform: rotate(-8deg);
  opacity: var(--reflection);
  z-index: 11;
}

/* Layer 11: micro-noise breaks up banding and keeps the frosted pane tactile at 1024px+. */
.grain {
  position: absolute;
  inset: 0;
  filter: url("#liquidNoise");
  opacity: var(--noise-opacity);
  mix-blend-mode: overlay;
  z-index: 12;
  pointer-events: none;
}`;
}

function gradientStops(colors, fallback) {
  const stops = colors.length ? colors : [fallback, fallback];
  const last = stops.length - 1;
  return stops.map((color, index) => `${color} ${Math.round((index / last) * 100)}%`).join(", ");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
