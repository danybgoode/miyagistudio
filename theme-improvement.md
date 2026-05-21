# Implementation Plan - Refine Discomorphism and Chrome Metallic Themes

This plan details the refinements to be made to Miyagi Studio to elevate the **discomorphism** and **chrome-metallic** styles. The goal is to produce high-end, premium outputs that match the reference styles of [panflo.png](file:///Users/cosmo/dobby/miyagistudio/panflo.png) and [braveicon.png](file:///Users/cosmo/dobby/miyagistudio/braveicon.png) respectively.

---

## Proposed Refinements

### 1. Discomorphism Theme Refinements (Target: `panflo.png`)

In [panflo.png](file:///Users/cosmo/dobby/miyagistudio/panflo.png), the mosaic tiles are not flat, simple squares; they are highly volumetric, rounded, and reflect a cohesive environment. 

#### A. Cohesive Environment Reflection Map
* **Current state**: Highlight center coordinates `var(--sx)` and `var(--sy)` on each tile are computed using high-frequency pseudo-random modulo hashes. This creates noisy, uncoordinated sparkles.
* **Proposed change**: Calculate the shine coordinates based on the tile's normalized position in the grid `(u, v) = (x/cols, y/rows)`. We will map a master spherical or wave environment reflection across the grid so highlights and colors shift smoothly from tile to tile, mimicking a real curved 3D surface. We will preserve a subtle high-frequency variance to keep individual tiles lively, but the main reflection will be cohesive.

#### B. Volumetric 3D Tile Profile (Pillowing)
* **Current state**: Flat tiles with linear-gradient shading and inset shadows.
* **Proposed change**: Add a multi-layered shading to each tile to create a realistic 3D "pillow" profile:
  1. A crisp outer light-catching border.
  2. A darker grout gap between tiles to create depth.
  3. A radial sheen simulating a convex mirror element.
  4. Subtle drop shadows between neighboring tiles.

#### C. Enhanced Iridescent Color Palette
* Update `themes/discomorphism.json` with highly curated, premium HSL-derived colors for lights and edges, matching the lavender, violet, rose, and cyan hues of the reference.

---

### 2. Chrome Metallic Theme Refinements (Target: `braveicon.png`)

In [braveicon.png](file:///Users/cosmo/dobby/miyagistudio/braveicon.png), the chrome element has a smooth volumetric 3D bevel and high-contrast reflection bands that follow the contours of the shape, surrounded by a vibrant cyan/magenta iridescent rim.

#### A. Contour-Warping Chrome Displacement
* **Current state**: Simple linear gradient overlays with a minor turbulence warp.
* **Proposed change**: Implement an advanced SVG filter that uses a blurred alpha map of the glyph as a displacement driver. This forces the metallic reflection bands to wrap and curve perfectly around the shape's contours, yielding a liquid-metal look.
* We will combine this with a multi-stop, high-contrast metallic gradient (alternating bright white, silver-gray, chrome, and deep charcoal) to create realistic chrome reflections.

#### B. Volumetric Bevel and Shading
* **Puppeteer Renderer**: In `scripts/html-composer.js`, we will add an SVG specular and diffuse lighting filter (using `feSpecularLighting` and `feDiffuseLighting` on the blurred heightmap) to generate realistic 3D highlights and crevice shadows.
* **Canvas Renderer**: In `src/ui.js` (`drawChromeIcon`), we will implement a multi-pass canvas embossing/chiseled technique. By drawing the glyph mask offset in light and dark colors and clipping it, we can render a gorgeous, volumetric 3D bevel inside the canvas output.
* **Iridescent Rim**: Layer a secondary gradient sweep (transitioning from vibrant cyan-blue to magenta-pink) along the edges of the metal shape.

#### C. Deep Space Backdrop & Star Sparkles
* Tweak the background and sparkles to feel organic, resembling the cosmic stars and subtle glints of the reference icon.

---

## Proposed Changes

### Configuration
#### [MODIFY] [discomorphism.json](file:///Users/cosmo/dobby/miyagistudio/themes/discomorphism.json)
* Refine base colors, default gap size (`0.12`), tile radius (`0.18`), and ambient lights.

#### [MODIFY] [chrome-metallic.json](file:///Users/cosmo/dobby/miyagistudio/themes/chrome-metallic.json)
* Refine metal gradient stops and accent glows.

---

### Rendering Pipeline
#### [MODIFY] [html-composer.js](file:///Users/cosmo/dobby/miyagistudio/scripts/html-composer.js)
* **`composeDiscomorphismCss`**: Update the `.tile` styling to incorporate the volumetric bevels, dark grout, and coordinate-aligned environment reflection maps.
* **`renderDiscoTiles`**: Compute position-based coordinates `(sx, sy)` and environment parameters based on normalized `x / columns` and `y / rows`.
* **`composeChromeMetallicHtml` / `composeChromeMetallicCss`**:
  * Build the `#chromeMetalFilter` using `feGaussianBlur`, `feDisplacementMap`, `feSpecularLighting`, and `feDiffuseLighting` to create realistic contour-hugging reflections and volumetric shading.
  * Adjust HTML layer ordering to include the new volumetric and iridescent bevel overlays.

---

### Web App & Live Previews
#### [MODIFY] [ui.js](file:///Users/cosmo/dobby/miyagistudio/src/ui.js)
* **`drawDiscoIcon`**: Update the canvas-based tile drawer to use the same position-based reflection coordinates and volumetric shadows as the CSS version.
* **`drawChromeIcon`**: Implement the multi-pass canvas emboss/beveling technique. Set up high-contrast metallic bands and iridescent border outlines.
* **`renderDiscoSvg` / `renderChromeSvg`**: Ensure that when exporting as self-contained SVGs, the custom filters and styling are fully packaged.
* **`applyThemeObject`**: Update the DOM preview properties.

#### [MODIFY] [styles.css](file:///Users/cosmo/dobby/miyagistudio/src/styles.css)
* Update DOM-based preview classes for discomorphism and chrome-metallic to match the upgraded styling.

---

## Verification Plan

### Automated Verification
* Run the smoke UI test:
  ```bash
  npm run smoke:ui
  ```
* Run the rendering batch command for both themes:
  ```bash
  npm run render -- --theme discomorphism
  npm run render -- --theme chrome-metallic
  ```
* Verify that the builds compile without warnings.

### Manual Verification
* Run Vite locally:
  ```bash
  npm run dev
  ```
* Open the browser and test both themes in the interactive web UI, checking the visual quality of the preview, the canvas render outputs, and the downloaded ZIP files.
