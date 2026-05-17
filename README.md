# Miyagi Studio

Miyagi Studio is a Node.js rendering pipeline that transforms flat SVG, PNG, and JPG icons into restrained, premium glassmorphism application icons. It uses Puppeteer for headless Chromium composition, Sharp for image encoding and source analysis, SVGO for SVG normalization, and layered HTML/CSS/SVG for the optical material stack.

The renderer is tuned toward modern translucent systems such as visionOS, macOS Big Sur, Arc Browser, and Apple Liquid Glass: layered depth, subtle refraction cues, broad highlights, restrained glow, inner shadowing, micro-noise, and geometry-aware lighting.

## Quick Start

```bash
npm install
npm run render -- --theme liquid-glass
npm run dev
```

Open the local URL printed by Vite to use the minimal preview UI.

## CLI

```bash
node render.js --theme liquid-glass
node render.js --theme dark-glass --sizes 64,128,256,512,1024
node render.js --theme liquid-glass --size 1024 --scale 2 --asset-scale 0.62
node render.js --all-themes --debug-html
node render.js --list-themes
```

Options:

| Option | Default | Description |
| --- | --- | --- |
| `--theme <name>` | `liquid-glass` | Theme from `/themes` |
| `--all-themes` | `false` | Render every theme |
| `--input <dir>` | `icons/source` | Source SVG, PNG, JPG, or JPEG folder |
| `--output <dir>` | `renders` | Output folder |
| `--sizes <list>` | `64,128,256,512,1024` | Standard output sizes |
| `--size <px>` | none | Legacy single-size output override |
| `--scale <factor>` | `1` | Retina multiplier; `--size 1024 --scale 2` writes a 2048px image in the `1024x1024` folder |
| `--asset-scale <ratio>` | adaptive | Input asset scale inside the glass canvas, from `0.35` to `0.85` |
| `--formats <list>` | `png,webp,svg` | Export formats |
| `--no-svg` | `false` | Disable the default self-contained SVG wrapper output |
| `--debug-html` | `false` | Keep the composed HTML file for inspection |

By default, PNGs, WebPs, and SVG wrappers are output at standard icon sizes: 64, 128, 256, 512, and 1024px. Output is grouped by theme and size:

```text
renders/liquid-glass/64x64/icon.png
renders/liquid-glass/64x64/icon.webp
renders/liquid-glass/64x64/icon.svg
renders/liquid-glass/1024x1024/icon.png
```

## Project Structure

```text
icons/source/        Source SVG, PNG, JPG, and JPEG icons
themes/              Theme configuration files
renders/             Generated PNG/WebP/SVG outputs
temp/                Scratch space for future render stages
scripts/             Rendering engine modules
```

## Rendering Engine

Each icon is rendered as a stack of purposeful layers:

- Dynamic background field: gives the glass material a believable environment to refract.
- Ambient bloom: broad, low-opacity light that avoids neon overstatement.
- Depth shadow: anchors the rounded app icon as a physical object.
- Frosted glass core: translucent surface with blur, saturation, and inner shading.
- Edge lighting: soft bevel treatment without a harsh outline.
- Inner depth: low-contrast radial shadows to avoid flat plastic.
- Icon aura: source-geometry mask that refracts icon color into the material.
- Icon shadow: alpha-centroid-aware soft shadow based on source geometry.
- Glyph layer: the optimized original SVG, preserving proportions and transparency.
- Specular and reflection layers: restrained highlights for liquid optical response.
- Micro-noise: subtle texture that reduces banding at high resolution.

## Themes

Built-in themes:

- `liquid-glass`
- `dark-glass`
- `frosted-light`
- `holographic-subtle`

Themes control blur radius, glass opacity, gradients, lighting intensity, background palette, shadow softness, reflection strength, and material noise.

## Local Development

```bash
npm install
npm run dev
```

Run the production renderer:

```bash
npm run render -- --theme liquid-glass
```

Build the Vercel frontend:

```bash
npm run build
```

## Notes

The web UI supports upload, theme selection, input asset scale, standard size selection, explicit generation, individual downloads, and ZIP download. The production batch path remains the Node.js pipeline, which provides deterministic, high-resolution exports for complete icon packs.
