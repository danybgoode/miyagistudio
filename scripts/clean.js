import fs from "fs-extra";

await fs.emptyDir("renders");
await fs.emptyDir("temp");
await fs.ensureFile("renders/.gitkeep");
await fs.ensureFile("temp/.gitkeep");
console.log("Cleaned renders/ and temp/.");
