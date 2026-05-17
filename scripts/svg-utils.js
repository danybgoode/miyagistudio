import path from "node:path";
import fs from "fs-extra";
import sharp from "sharp";
import { optimize } from "svgo";

const MIME_BY_EXTENSION = new Map([
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"]
]);

export const SUPPORTED_SOURCE_EXTENSIONS = ["svg", "png", "jpg", "jpeg"];

export async function loadIconAsset(file, analysisSize = 512) {
  const extension = path.extname(file).toLowerCase();

  if (extension === ".svg") {
    return loadSvgIcon(file, analysisSize);
  }

  if (MIME_BY_EXTENSION.has(extension)) {
    return loadRasterIcon(file, analysisSize, MIME_BY_EXTENSION.get(extension));
  }

  throw new Error(`Unsupported source asset "${file}". Supported inputs: SVG, PNG, JPG, JPEG.`);
}

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
  const dataUri = svgToDataUri(svg);
  const metrics = await analyzeImage(Buffer.from(svg), analysisSize);

  return {
    file,
    type: "svg",
    name: path.basename(file, path.extname(file)),
    sourceExtension: "svg",
    svg,
    dataUri,
    maskUri: dataUri,
    markup: sanitizeInlineSvg(svg),
    metrics
  };
}

async function loadRasterIcon(file, analysisSize, mimeType) {
  const buffer = await fs.readFile(file);
  const metadata = await sharp(buffer).metadata();
  const dataUri = bufferToDataUri(buffer, mimeType);
  const metrics = await analyzeImage(buffer, analysisSize);

  return {
    file,
    type: "raster",
    name: path.basename(file, path.extname(file)),
    sourceExtension: path.extname(file).slice(1).toLowerCase(),
    mimeType,
    width: metadata.width,
    height: metadata.height,
    dataUri,
    maskUri: dataUri,
    markup: `<img src="${dataUri}" alt="" width="${metadata.width ?? analysisSize}" height="${metadata.height ?? analysisSize}" decoding="sync">`,
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

function bufferToDataUri(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function analyzeImage(input, size) {
  const { data, info } = await sharp(input, { limitInputPixels: false })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
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

function sanitizeInlineSvg(svg) {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+=["'][^"']*["']/gi, "")
    .replace("<svg", '<svg role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet"');
}

function rgbToHex(red, green, blue) {
  return `#${[red, green, blue]
    .map((value) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
