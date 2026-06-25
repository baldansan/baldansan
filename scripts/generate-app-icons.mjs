import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import toIco from "to-ico";

const root = process.cwd();
const source = path.join(root, "public", "logo.png");
const iconsDir = path.join(root, "public", "icons");
const appDir = path.join(root, "app");

async function writeSquarePng(size, outputPath, { padding = 0 } = {}) {
  const inner = padding > 0 ? Math.round(size * (1 - padding * 2)) : size;
  const resized = await sharp(source)
    .resize(inner, inner, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();

  if (padding > 0) {
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      },
    })
      .composite([{ input: resized, gravity: "center" }])
      .png()
      .toFile(outputPath);
    return;
  }

  await sharp(resized).toFile(outputPath);
}

async function writeFavicon(outputPath) {
  const sizes = [16, 32, 48];
  const buffers = await Promise.all(
    sizes.map((size) =>
      sharp(source)
        .resize(size, size, { fit: "cover", position: "centre" })
        .png()
        .toBuffer()
    )
  );
  const ico = await toIco(buffers);
  await fs.writeFile(outputPath, ico);
}

await fs.mkdir(iconsDir, { recursive: true });

await writeSquarePng(192, path.join(iconsDir, "icon-192.png"));
await writeSquarePng(512, path.join(iconsDir, "icon-512.png"));
await writeSquarePng(180, path.join(iconsDir, "apple-touch-icon.png"));
await writeSquarePng(512, path.join(iconsDir, "maskable-icon-512.png"), {
  padding: 0.1,
});

await writeSquarePng(512, path.join(appDir, "icon.png"));
await writeSquarePng(180, path.join(appDir, "apple-icon.png"));
await writeFavicon(path.join(appDir, "favicon.ico"));

console.log("Generated app icons from public/logo.png");
