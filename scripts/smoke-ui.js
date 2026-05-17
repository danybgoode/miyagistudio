import fs from "fs-extra";
import puppeteer from "puppeteer";

const url = process.argv[2] ?? "http://localhost:5173/";
const screenshotPath = "temp/ui-smoke.png";

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 980, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle0" });

  const state = await page.evaluate(() => ({
    title: document.querySelector("h1")?.textContent,
    command: document.querySelector("#commandText")?.textContent,
    hasGlyph: Boolean(document.querySelector(".preview-glyph svg, .preview-glyph img")),
    previewBox: document.querySelector(".icon-preview")?.getBoundingClientRect().toJSON()
  }));

  if (state.title !== "Miyagi Studio") {
    throw new Error(`Unexpected title: ${state.title}`);
  }

  if (!state.command?.includes("node render.js --theme liquid-glass --sizes 64,128,256,512,1024 --asset-scale 0.56")) {
    throw new Error(`Unexpected command text: ${state.command}`);
  }

  await page.$eval("#assetScale", (input) => {
    input.value = "62";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const scaled = await page.evaluate(() => ({
    command: document.querySelector("#commandText")?.textContent,
    value: document.querySelector("#assetScaleValue")?.value
  }));

  if (!scaled.command?.includes("--asset-scale 0.62") || scaled.value !== "62%") {
    throw new Error(`Asset scale control did not update correctly: ${JSON.stringify(scaled)}`);
  }

  if (!state.hasGlyph) {
    throw new Error("Preview glyph did not load.");
  }

  if (!state.previewBox || state.previewBox.width < 320 || state.previewBox.height < 320) {
    throw new Error("Preview icon is not laid out at the expected size.");
  }

  await page.click("#generateButton");
  await page.waitForFunction(() => document.querySelectorAll(".asset-row").length >= 10, { timeout: 10000 });

  await fs.ensureDir("temp");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`UI smoke test passed. Screenshot: ${screenshotPath}`);
} finally {
  await browser.close();
}
