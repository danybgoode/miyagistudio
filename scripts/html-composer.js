import { svgToDataUri } from "./svg-utils.js";

export function composeIconHtml({ icon, theme, outputSize, assetScale }) {
  const renderer = getThemeRenderer(theme);

  if (renderer === "crystal-liquid") {
    return composeCrystalLiquidHtml({ icon, theme, outputSize, assetScale });
  }

  if (renderer === "discomorphism") {
    return composeDiscomorphismHtml({ icon, theme, outputSize, assetScale });
  }

  if (renderer === "chrome-metallic") {
    return composeChromeMetallicHtml({ icon, theme, outputSize, assetScale });
  }

  const css = composeCss({ icon, theme, outputSize, assetScale });

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

export function composeIconSvg({ icon, theme, outputSize, assetScale }) {
  const html = composeIconHtml({ icon, theme, outputSize, assetScale })
    .replace("<!doctype html>", "")
    .replace(/<html[^>]*>|<\/html>|<head>|<\/head>|<body>|<\/body>/g, "");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${outputSize}" height="${outputSize}" viewBox="0 0 ${outputSize} ${outputSize}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml">${html}</div>
  </foreignObject>
</svg>`;
}

function getThemeRenderer(theme) {
  return theme.renderer ?? (theme.baseColor ? "crystal-liquid" : "glass");
}

function composeCss({ icon, theme, outputSize, assetScale }) {
  const material = theme.material;
  const lighting = theme.lighting;
  const shadow = theme.shadow;
  const palette = theme.palette;
  const light = icon.metrics.light;
  const dominant = icon.metrics.dominantColor;
  const glyphScale = assetScale ?? (icon.metrics.coverage > 0.72 ? 0.57 : 0.64);
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

function composeCrystalLiquidHtml({ icon, theme, outputSize, assetScale }) {
  const css = composeCrystalLiquidCss({ icon, theme, outputSize, assetScale });

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>${css}</style>
</head>
<body>
  <svg class="defs" width="0" height="0" aria-hidden="true" focusable="false">
    <filter id="liquidRefraction">
      <feTurbulence type="fractalNoise" baseFrequency="0.015 0.02" numOctaves="2" seed="12" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="8" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="crystalNoise">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="22" result="noise"/>
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.15 0"/>
    </filter>
  </svg>
  <main class="stage" aria-label="${escapeHtml(icon.name)} rendered as crystal liquid icon">
    <section class="app-icon">
      <!-- 1. Background Environment -->
      <div class="env-background"></div>

      <!-- 2. Base Glass Body -->
      <div class="base-glass"></div>

      <!-- 3. Refraction Layer -->
      <div class="refraction-layer"></div>

      <!-- 4. Internal Glow Layer -->
      <div class="internal-glow"></div>

      <!-- Glyph Container -->
      <div class="glyph-wrap">${icon.markup}</div>

      <!-- 5. Specular Reflection Layer -->
      <div class="specular-reflection"></div>

      <!-- 6. Edge Caustics -->
      <div class="edge-caustics"></div>

      <!-- 7. Spark Highlight Layer -->
      <div class="spark-highlight">
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <path d="M50 0 C50 40, 60 50, 100 50 C60 50, 50 60, 50 100 C50 60, 40 50, 0 50 C40 50, 50 40, 50 0 Z" fill="#ffffff" />
          <circle cx="50" cy="50" r="10" fill="#ffffff" filter="blur(2px)" />
        </svg>
      </div>

      <!-- 8. Final Composite Polish (Noise) -->
      <div class="composite-polish"></div>
    </section>
  </main>
</body>
</html>`;
}

function composeCrystalLiquidCss({ icon, theme, outputSize, assetScale }) {
  const glyphScale = assetScale ?? (icon.metrics.coverage > 0.72 ? 0.57 : 0.64);
  const mask = icon.maskUri ?? svgToDataUri(icon.svg);

  return `
:root {
  --size: ${outputSize}px;
  --radius: ${Math.round(outputSize * 0.218)}px;

  --base: ${theme.baseColor};
  --secondary: ${theme.secondaryColor};
  --highlight: ${theme.highlightColor};
  --env: ${theme.environmentColor};

  --blur: ${theme.blur}px;
  --opacity: ${theme.opacity};
  --refraction: ${theme.refraction};
  --glow: ${theme.glow};
  --sparkle: ${theme.sparkle};
  --caustics: ${theme.caustics};
  --inner-shadow: ${theme.innerShadow};
  --specular: ${theme.specularIntensity};
  --edge: ${theme.edgeRim};
  --noise: ${theme.noiseAmount};

  --glyph-scale: ${glyphScale};
}

* { box-sizing: border-box; }

html, body, .stage {
  width: var(--size);
  height: var(--size);
  margin: 0;
  overflow: hidden;
  background: transparent;
}

.defs { position: absolute; pointer-events: none; }

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

/* 1. Background Environment */
.env-background {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--env) 80%, var(--secondary)), var(--env) 80%);
  z-index: 0;
}

/* 2. Base Glass Body */
.base-glass {
  position: absolute;
  inset: 4%;
  border-radius: calc(var(--radius) * 0.8);
  background: color-mix(in srgb, var(--base) calc(var(--opacity) * 100%), transparent);
  box-shadow:
    inset 0 0 calc(var(--size) * 0.1) rgba(0,0,0,var(--inner-shadow)),
    0 calc(var(--size) * 0.05) calc(var(--size) * 0.1) rgba(0,0,0,0.5);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  z-index: 1;
}

/* 3. Refraction Layer */
.refraction-layer {
  position: absolute;
  inset: 4%;
  border-radius: calc(var(--radius) * 0.8);
  background:
    linear-gradient(135deg, rgba(255,255,255,0.2), rgba(0,0,0,0.2) 60%, rgba(255,255,255,0.1));
  opacity: var(--refraction);
  mix-blend-mode: overlay;
  filter: url("#liquidRefraction");
  z-index: 2;
}

/* 4. Internal Glow Layer */
.internal-glow {
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--secondary) 0%, transparent 70%);
  opacity: var(--glow);
  filter: blur(calc(var(--size) * 0.05));
  mix-blend-mode: screen;
  z-index: 3;
}

/* Glyph Container */
.glyph-wrap {
  position: absolute;
  inset: calc((1 - var(--glyph-scale)) * 50%);
  display: grid;
  place-items: center;
  color: var(--highlight);
  z-index: 4;
  filter: drop-shadow(0 calc(var(--size) * 0.02) calc(var(--size) * 0.02) rgba(0,0,0,0.4));
}
.glyph-wrap svg,
.glyph-wrap img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

/* 5. Specular Reflection Layer */
.specular-reflection {
  position: absolute;
  inset: 4%;
  border-radius: calc(var(--radius) * 0.8);
  background:
    linear-gradient(160deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 30%, transparent 50%);
  mask-image: linear-gradient(to bottom, black, transparent);
  -webkit-mask-image: linear-gradient(to bottom, black, transparent);
  opacity: var(--specular);
  mix-blend-mode: screen;
  z-index: 5;
}

/* 6. Edge Caustics */
.edge-caustics {
  position: absolute;
  inset: 4%;
  border-radius: calc(var(--radius) * 0.8);
  padding: calc(var(--size) * 0.005);
  background: linear-gradient(135deg, var(--highlight), transparent 40%, var(--secondary) 80%, var(--highlight));
  opacity: var(--caustics);
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  z-index: 6;
}

/* 7. Spark Highlight Layer */
.spark-highlight {
  position: absolute;
  top: 8%;
  right: 15%;
  width: calc(var(--size) * 0.25);
  height: calc(var(--size) * 0.25);
  opacity: var(--sparkle);
  mix-blend-mode: screen;
  filter: drop-shadow(0 0 calc(var(--size) * 0.02) var(--highlight));
  z-index: 7;
}

.spark-highlight svg {
  width: 100%;
  height: 100%;
}

/* 8. Final Composite Polish (Noise) */
.composite-polish {
  position: absolute;
  inset: 4%;
  border-radius: calc(var(--radius) * 0.8);
  filter: url("#crystalNoise");
  opacity: var(--noise);
  mix-blend-mode: overlay;
  z-index: 8;
  pointer-events: none;
}
`;
}

function composeDiscomorphismHtml({ icon, theme, outputSize, assetScale }) {
  const css = composeDiscomorphismCss({ icon, theme, outputSize, assetScale });
  const tiles = renderDiscoTiles(icon.metrics.tileMap);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>${css}</style>
</head>
<body>
  <svg class="defs" width="0" height="0" aria-hidden="true" focusable="false">
    <filter id="discoNoise">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="31" result="noise"/>
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .16 0"/>
    </filter>
  </svg>
  <main class="stage" aria-label="${escapeHtml(icon.name)} rendered as discomorphism icon">
    <section class="app-icon">
      <div class="disco-bg"></div>
      <div class="disco-rim"></div>
      <div class="disco-glow cyan"></div>
      <div class="disco-glow magenta"></div>
      <div class="tile-shadow"></div>
      <div class="tile-wrap">
        <div class="tile-grid">${tiles}</div>
        <img class="source-ink" src="${icon.dataUri}" alt="">
      </div>
      <div class="disco-spark s1"></div>
      <div class="disco-spark s2"></div>
      <div class="disco-spark s3"></div>
      <div class="disco-polish"></div>
    </section>
  </main>
</body>
</html>`;
}

function composeDiscomorphismCss({ icon, theme, outputSize, assetScale }) {
  const glyphScale = assetScale ?? theme.defaultAssetScale ?? 0.99;
  const tileMap = icon.metrics.tileMap;
  const background = gradientStops(theme.background, "#08090d");
  const rim = gradientStops(theme.edge, "#7dd8c5");
  const lights = theme.lights ?? ["#35e5ff", "#d65cff", "#f8e8a4"];

  return `
:root {
  --size: ${outputSize}px;
  --radius: ${Math.round(outputSize * 0.218)}px;
  --glyph-scale: ${glyphScale};
  --cols: ${tileMap.columns};
  --rows: ${tileMap.rows};
  --gap: max(1px, calc(var(--size) * ${(theme.gap ?? 0.09) / 100}));
  --tile-radius: max(1px, calc(var(--size) * ${(theme.tileRadius ?? 0.14) / 100}));
}

* { box-sizing: border-box; }
html, body, .stage {
  width: var(--size);
  height: var(--size);
  margin: 0;
  overflow: hidden;
  background: transparent;
}
.defs { position: absolute; pointer-events: none; }
.stage { display: grid; place-items: center; }

.app-icon {
  position: relative;
  width: var(--size);
  height: var(--size);
  border-radius: var(--radius);
  overflow: hidden;
  isolation: isolate;
  background: #08090d;
}

.disco-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 78%, color-mix(in srgb, ${lights[0]} 52%, transparent), transparent 0 34%),
    radial-gradient(circle at 82% 24%, color-mix(in srgb, ${lights[1]} 46%, transparent), transparent 0 31%),
    radial-gradient(circle at 52% 16%, color-mix(in srgb, ${lights[2]} 38%, transparent), transparent 0 28%),
    linear-gradient(145deg, ${background});
  z-index: 0;
}

.disco-rim {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: max(2px, calc(var(--size) * 0.007));
  background: linear-gradient(135deg, ${rim});
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  opacity: ${theme.rimIntensity ?? 0.9};
  z-index: 5;
}

.disco-glow {
  position: absolute;
  width: 42%;
  height: 42%;
  border-radius: 50%;
  filter: blur(calc(var(--size) * 0.055));
  mix-blend-mode: screen;
  opacity: ${theme.glow ?? 0.42};
  z-index: 1;
}
.disco-glow.cyan { left: -10%; bottom: 18%; background: ${lights[0]}; }
.disco-glow.magenta { right: -8%; top: 12%; background: ${lights[1]}; }

.tile-shadow {
  position: absolute;
  inset: calc((1 - var(--glyph-scale)) * 50%);
  border-radius: calc(var(--radius) * 0.32);
  box-shadow: 0 calc(var(--size) * 0.035) calc(var(--size) * 0.08) rgba(0,0,0,.48);
  z-index: 2;
}

.tile-wrap {
  position: absolute;
  inset: calc((1 - var(--glyph-scale)) * 50%);
  display: grid;
  overflow: hidden;
  border-radius: calc(var(--radius) * 0.24);
  filter:
    drop-shadow(0 calc(var(--size) * 0.014) calc(var(--size) * 0.025) rgba(0,0,0,.42))
    drop-shadow(0 0 calc(var(--size) * 0.02) color-mix(in srgb, ${lights[0]} 35%, transparent));
  z-index: 3;
}

.tile-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  gap: var(--gap);
  background: #020306;
}

.tile {
  position: relative;
  min-width: 0;
  min-height: 0;
  border-radius: var(--tile-radius);
  background:
    radial-gradient(circle at var(--sx) var(--sy), rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.3) 20%, transparent 60%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 40%, rgba(0, 0, 0, 0.55) 100%),
    radial-gradient(circle at calc(100% - var(--sx)) calc(100% - var(--sy)), rgba(255, 255, 255, 0.15) 0%, transparent 80%),
    linear-gradient(135deg, color-mix(in srgb, var(--tile-color) 78%, ${lights[0]} 22%), color-mix(in srgb, var(--tile-color) 70%, ${lights[1]} 30%));
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.65),
    inset 0 -1.5px 2px rgba(0, 0, 0, 0.7),
    0 1px 2px rgba(0, 0, 0, 0.55);
  opacity: var(--alpha);
}

.source-ink {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
  opacity: .22;
  filter: contrast(1.34) saturate(.78);
  pointer-events: none;
}

.disco-spark {
  position: absolute;
  width: calc(var(--size) * .1);
  height: calc(var(--size) * .1);
  background: white;
  clip-path: polygon(50% 0, 58% 42%, 100% 50%, 58% 58%, 50% 100%, 42% 58%, 0 50%, 42% 42%);
  filter: drop-shadow(0 0 calc(var(--size) * .018) white) drop-shadow(0 0 calc(var(--size) * .035) ${lights[1]});
  opacity: ${theme.sparkle ?? 0.75};
  mix-blend-mode: screen;
  z-index: 6;
}
.disco-spark.s1 { right: 15%; top: 10%; transform: rotate(12deg) scale(.72); }
.disco-spark.s2 { left: 16%; top: 44%; transform: rotate(-18deg) scale(.44); opacity: .46; }
.disco-spark.s3 { right: 36%; bottom: 18%; transform: rotate(28deg) scale(.38); opacity: .36; }

.disco-polish {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(160deg, rgba(255,255,255,.18), transparent 34%),
    radial-gradient(circle at 50% -10%, rgba(255,255,255,.32), transparent 0 36%);
  filter: url("#discoNoise");
  mix-blend-mode: overlay;
  opacity: .42;
  pointer-events: none;
  z-index: 7;
}`;
}

function composeChromeMetallicHtml({ icon, theme, outputSize, assetScale }) {
  const css = composeChromeMetallicCss({ icon, theme, outputSize, assetScale });

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>${css}</style>
</head>
<body>
  <svg class="defs" width="0" height="0" aria-hidden="true" focusable="false">
    <filter id="chromeMetalFilter" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1"/>
      <feDisplacementMap in="SourceGraphic" in2="blur1" scale="28" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
      <feSpecularLighting in="blur1" surfaceScale="5" specularConstant="1.6" specularExponent="35" lighting-color="#ffffff" result="specular">
        <feDistantLight azimuth="135" elevation="50"/>
      </feSpecularLighting>
      <feComposite in="specular" in2="SourceGraphic" operator="in" result="specularClipped"/>
      <feBlend in="displaced" in2="specularClipped" mode="screen" result="litMetal"/>
      <feDiffuseLighting in="blur1" surfaceScale="5" diffuseConstant="0.95" lighting-color="#ffffff" result="diffuse">
        <feDistantLight azimuth="135" elevation="50"/>
      </feDiffuseLighting>
      <feBlend in="litMetal" in2="diffuse" mode="multiply" result="shadedMetal"/>
      <feComposite in="shadedMetal" in2="SourceGraphic" operator="in"/>
    </filter>
    <filter id="chromeEdgeFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="out" result="edge"/>
      <feComponentTransfer in="edge" result="sharpEdge">
        <feFuncA type="linear" slope="3.5"/>
      </feComponentTransfer>
      <feComposite in="SourceGraphic" in2="sharpEdge" operator="in"/>
    </filter>
    <filter id="chromeNoise">
      <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="45" result="noise"/>
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .12 0"/>
    </filter>
  </svg>
  <main class="stage" aria-label="${escapeHtml(icon.name)} rendered as chrome metallic icon">
    <section class="app-icon">
      <div class="chrome-bg"></div>
      <div class="chrome-card"></div>
      <div class="chrome-glow"></div>
      <div class="metal-shadow glyph-mask"></div>
      <div class="metal-fill glyph-mask"></div>
      <div class="metal-bands glyph-mask"></div>
      <div class="metal-edge glyph-mask"></div>
      <div class="metal-glints glyph-mask"></div>
      <div class="source-lines">${icon.markup}</div>
      <div class="chrome-star s1"></div>
      <div class="chrome-star s2"></div>
      <div class="chrome-polish"></div>
    </section>
  </main>
</body>
</html>`;
}

function composeChromeMetallicCss({ icon, theme, outputSize, assetScale }) {
  const glyphScale = assetScale ?? theme.defaultAssetScale ?? 0.62;
  const mask = icon.maskUri ?? svgToDataUri(icon.svg);
  const background = gradientStops(theme.background, "#090a11");
  const metal = gradientStops(theme.metal, "#f8fbff");
  const accent = theme.accent ?? ["#546fff", "#d856ff", "#ffffff"];

  return `
:root {
  --size: ${outputSize}px;
  --radius: ${Math.round(outputSize * 0.218)}px;
  --glyph-scale: ${glyphScale};
  --mask: url("${mask}");
}

* { box-sizing: border-box; }
html, body, .stage {
  width: var(--size);
  height: var(--size);
  margin: 0;
  overflow: hidden;
  background: transparent;
}
.defs { position: absolute; pointer-events: none; }
.stage { display: grid; place-items: center; }
.app-icon {
  position: relative;
  width: var(--size);
  height: var(--size);
  border-radius: var(--radius);
  overflow: hidden;
  isolation: isolate;
}

.chrome-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 74%, color-mix(in srgb, ${accent[1]} 48%, transparent), transparent 0 36%),
    radial-gradient(circle at 20% 12%, color-mix(in srgb, ${accent[0]} 36%, transparent), transparent 0 31%),
    linear-gradient(145deg, ${background});
  z-index: 0;
}

.chrome-card {
  position: absolute;
  inset: 5%;
  border-radius: calc(var(--radius) * .78);
  background:
    radial-gradient(circle at 50% 74%, rgba(214,86,255,.26), transparent 0 38%),
    linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.015) 36%, rgba(0,0,0,.3));
  box-shadow:
    inset 0 1px 2px rgba(255,255,255,.28),
    inset 0 calc(var(--size) * -.025) calc(var(--size) * .05) rgba(0,0,0,.56),
    0 calc(var(--size) * .03) calc(var(--size) * .07) rgba(0,0,0,${theme.shadow ?? 0.44});
  z-index: 1;
}

.chrome-glow {
  position: absolute;
  inset: 25% 18% 10%;
  border-radius: 50%;
  background: radial-gradient(circle, ${accent[1]}, transparent 70%);
  filter: blur(calc(var(--size) * .055));
  opacity: ${theme.glow ?? 0.46};
  mix-blend-mode: screen;
  z-index: 2;
}

.glyph-mask,
.source-lines {
  position: absolute;
  inset: calc((1 - var(--glyph-scale)) * 50%);
  mask-image: var(--mask);
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-image: var(--mask);
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
}

.metal-shadow {
  background: rgba(0,0,0,.68);
  filter: blur(calc(var(--size) * .016));
  transform: translateY(calc(var(--size) * .022));
  opacity: .68;
  z-index: 3;
}

.metal-fill {
  background:
    linear-gradient(118deg, ${metal}),
    radial-gradient(circle at 35% 18%, #ffffff, transparent 0 28%),
    radial-gradient(circle at 78% 74%, ${accent[1]}, transparent 0 36%);
  filter: saturate(1.14) contrast(1.13) url("#chromeMetalFilter");
  z-index: 4;
}

.metal-bands {
  background:
    linear-gradient(102deg, transparent 0 14%, rgba(255,255,255,.9) 18%, transparent 24%, rgba(70,88,255,.54) 39%, transparent 47%, rgba(255,86,226,.62) 61%, transparent 72%, rgba(255,255,255,.82) 84%, transparent 100%),
    linear-gradient(12deg, rgba(255,255,255,.2), rgba(0,0,0,.36), rgba(255,255,255,.24));
  filter: url("#chromeMetalFilter");
  mix-blend-mode: screen;
  opacity: .86;
  z-index: 5;
}

.metal-edge {
  background:
    linear-gradient(135deg, #00f3ff, #ff00ea);
  filter: url("#chromeEdgeFilter");
  opacity: ${theme.bevel ?? 0.85};
  z-index: 6;
}

.metal-glints {
  background:
    radial-gradient(circle at 72% 18%, rgba(255,255,255,.95) 0 2.5%, color-mix(in srgb, ${accent[0]} 72%, transparent) 3.5%, transparent 8%),
    linear-gradient(118deg, transparent 0 54%, rgba(255,255,255,.72) 56%, transparent 59%),
    radial-gradient(circle at 31% 68%, color-mix(in srgb, ${accent[1]} 62%, white) 0 1.8%, transparent 6%),
    linear-gradient(34deg, transparent 0 28%, rgba(255,255,255,.38) 30%, transparent 34%);
  filter:
    drop-shadow(0 0 calc(var(--size) * .006) rgba(255,255,255,.85))
    drop-shadow(0 0 calc(var(--size) * .018) ${accent[0]});
  mix-blend-mode: screen;
  opacity: .66;
  z-index: 7;
}

.source-lines {
  display: grid;
  place-items: center;
  mask-image: none;
  -webkit-mask-image: none;
  opacity: .24;
  mix-blend-mode: multiply;
  filter: contrast(1.6) grayscale(1);
  z-index: 8;
}
.source-lines svg,
.source-lines img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.chrome-star {
  position: absolute;
  width: calc(var(--size) * .09);
  height: calc(var(--size) * .09);
  background: white;
  clip-path: polygon(50% 0, 58% 42%, 100% 50%, 58% 58%, 50% 100%, 42% 58%, 0 50%, 42% 42%);
  filter: drop-shadow(0 0 calc(var(--size) * .012) white) drop-shadow(0 0 calc(var(--size) * .03) ${accent[1]});
  opacity: ${theme.sparkle ?? 0.82};
  mix-blend-mode: screen;
  z-index: 9;
}
.chrome-star.s1 { right: 26%; top: 16%; transform: rotate(18deg) scale(.82); opacity: .62; }
.chrome-star.s2 { right: 31%; bottom: 29%; transform: rotate(-8deg) scale(.52); opacity: .48; }

.chrome-polish {
  position: absolute;
  inset: 5%;
  border-radius: calc(var(--radius) * .78);
  background:
    linear-gradient(165deg, rgba(255,255,255,.24), transparent 28%),
    radial-gradient(circle at 50% 110%, rgba(255,86,226,.22), transparent 0 42%);
  filter: url("#chromeNoise");
  mix-blend-mode: screen;
  opacity: .44;
  pointer-events: none;
  z-index: 10;
}`;
}

function renderDiscoTiles(tileMap) {
  const cols = tileMap.columns;
  const rows = tileMap.rows;
  return tileMap.tiles.map((tile) => {
    const u = cols > 1 ? tile.x / (cols - 1) : 0.5;
    const v = rows > 1 ? tile.y / (rows - 1) : 0.5;

    let shineX = 15 + u * 70;
    let shineY = 15 + v * 70;

    const tileHash = (tile.x * 127 + tile.y * 313) % 100;
    if (tileHash < 10) {
      shineX = (shineX + (tileHash % 5) * 8 - 16 + 100) % 100;
      shineY = (shineY + (tileHash % 3) * 12 - 18 + 100) % 100;
    }

    shineX = Math.round(shineX);
    shineY = Math.round(shineY);
    return `<span class="tile" style="--tile-color: rgb(${tile.r} ${tile.g} ${tile.b}); --alpha: ${tile.a}; --sx: ${shineX}%; --sy: ${shineY}%"></span>`;
  }).join("");
}
