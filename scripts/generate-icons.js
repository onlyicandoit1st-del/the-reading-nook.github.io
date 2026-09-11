import fs from "fs";
import path from "path";
import sharp from "sharp";

async function generate() {
  const svgPath = path.resolve("public/icon.svg");
  const svgBuffer = fs.readFileSync(svgPath);

  // 192x192 PNG
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.resolve("public/pwa-192x192.png"));
  console.log("Created public/pwa-192x192.png");

  // 512x512 PNG
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.resolve("public/pwa-512x512.png"));
  console.log("Created public/pwa-512x512.png");

  // 180x180 Apple Touch Icon
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.resolve("public/apple-touch-icon.png"));
  console.log("Created public/apple-touch-icon.png");

  // 512x512 Maskable Icon with 15% safe-zone padding
  // Maskable icons on Android need inner safe area inside the 80% circle
  const innerSize = Math.round(512 * 0.76); // ~389px
  const innerBuffer = await sharp(svgBuffer).resize(innerSize, innerSize).png().toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 35, g: 30, b: 25, alpha: 1 },
    },
  })
    .composite([
      {
        input: innerBuffer,
        gravity: "center",
      },
    ])
    .png()
    .toFile(path.resolve("public/pwa-maskable-512x512.png"));
  console.log("Created public/pwa-maskable-512x512.png");
}

generate().catch((err) => {
  console.error("Icon generation error:", err);
  process.exit(1);
});
