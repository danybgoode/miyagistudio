import path from "node:path";
import fs from "fs-extra";
import sharp from "sharp";
import { optimize } from "svgo";

export async function loadSvgIcon(file, analysisSize = 512) {
  const rawSvg = await fs.readFile(file, "utf8");
  const optimized = optimize(rawSvg, {
    path: file,
    multipass: true,
    plugins: [
      "preset-default",
      "removeDimensions",
      {
        name: "removeAttrs",
        params: {
          attrs: ["data-name"]
        }
      }
    ]
  });

  if (optimized.error) {
    throw new Error(`SVGO failed for ${file}: ${optimized.error}`);
  }

  const svg = ensureViewBox(optimized.data);
  const metrics = await analyzeSvg(svg, analysisSize);

  return {
    file,
    name: path.basename(file, path.extname(file)),
    svg,
    dataUri: svgToDataUri(svg),
    metrics
  };
}

function ensureViewBox(svg) {
  if (/\sviewBox=/.test(svg)) {
    return svg;
  }

  const width = Number.parseFloat(svg.match(/\swidth=["']([^"']+)["']/)?.[1]);
  const height = Number.parseFloat(svg.match(/\sheight=["']([^"']+)["']/)?.[1]);

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return svg.replace("<svg", `<svg viewBox="0 0 ${width} ${height}"`);
  }

  return svg.replace("<svg", '<svg viewBox="0 0 1024 1024"');
}

export function svgToDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22")}`;
}

async function analyzeSvg(svg, size) {
  const { data, info } = await sharp(Buffer.from(svg))
    .resize(size, size, { fit: "contain" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;
  let alphaTotal = 0;
  let weightedX = 0;
  let weightedY = 0;
  let redTotal = 0;
  let greenTotal = 0;
  let blueTotal = 0;
  let colorSamples = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      const alpha = data[offset + 3] ?? 255;

      if (alpha > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        alphaTotal += alpha;
        weightedX += x * alpha;
        weightedY += y * alpha;
      }

      if (alpha > 40) {
        redTotal += data[offset];
        greenTotal += data[offset + 1];
        blueTotal += data[offset + 2];
        colorSamples += 1;
      }
    }
  }

  const empty = alphaTotal === 0;
  const bounds = empty
    ? { x: 0, y: 0, width: info.width, height: info.height }
    : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };

  const centroid = empty
    ? { x: 0.5, y: 0.5 }
    : { x: weightedX / alphaTotal / info.width, y: weightedY / alphaTotal / info.height };

  const coverage = empty ? 1 : (bounds.width * bounds.height) / (info.width * info.height);
  const dominant = colorSamples
    ? rgbToHex(redTotal / colorSamples, greenTotal / colorSamples, blueTotal / colorSamples)
    : "#7aa7ff";

  return {
    bounds: {
      x: bounds.x / info.width,
      y: bounds.y / info.height,
      width: bounds.width / info.width,
      height: bounds.height / info.height
    },
    centroid,
    coverage,
    dominantColor: dominant,
    light: {
      x: clamp(0.34 + (0.5 - centroid.x) * 0.22, 0.24, 0.44),
      y: clamp(0.22 + (0.5 - centroid.y) * 0.16, 0.16, 0.34),
      shadowX: clamp((centroid.x - 0.5) * 28, -12, 12),
      shadowY: clamp(24 + (centroid.y - 0.5) * 18, 16, 34)
    }
  };
}

function rgbToHex(red, green, blue) {
  return `#${[red, green, blue]
    .map((value) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
