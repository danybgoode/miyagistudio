# Miyagi Studio

Miyagi Studio is a Node.js rendering pipeline that transforms flat SVG icons into restrained, premium glassmorphism application icons. It uses Puppeteer for headless Chromium composition, Sharp for image encoding, SVGO for source normalization, and layered HTML/CSS/SVG for the optical material stack.

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
node render.js --theme dark-glass --size 1024 --scale 2
node render.js --all-themes --svg --debug-html
node render.js --list-themes
```

Options:

| Option | Default | Description |
| --- | --- | --- |
| `--theme <name>` | `liquid-glass` | Theme from `/themes` |
| `--all-themes` | `false` | Render every theme |
| `--input <dir>` | `icons/source` | Source SVG folder |
| `--output <dir>` | `renders` | Output folder |
| `--size <px>` | `1024` | Base output size, minimum 1024 |
| `--scale <factor>` | `1` | Retina multiplier, for example `2` makes 2048px assets |
| `--formats <list>` | `png,webp` | Export formats |
| `--svg` | `false` | Also write a self-contained SVG wrapper |
| `--debug-html` | `false` | Keep the composed HTML file for inspection |

## Project Structure

```text
icons/source/        Source SVG icons
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

The web UI is intentionally small: it previews the theme language and gives operators the exact CLI command. The production render path is the Node.js pipeline, which provides deterministic, high-resolution exports for complete icon packs.
