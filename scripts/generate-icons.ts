import sharp from "sharp"
import { readFileSync, mkdirSync } from "fs"
import { join } from "path"

const svgPath = join(process.cwd(), "public", "app-icon.svg")
const svg = readFileSync(svgPath)

const outputDir = join(process.cwd(), "public", "icons")
mkdirSync(outputDir, { recursive: true })

const sizes = [
  { size: 192, name: "icon-192.png" },   // Android manifest
  { size: 512, name: "icon-512.png" },   // Android manifest (high-res)
  { size: 180, name: "apple-touch-icon.png" }, // iOS home screen
]

async function main() {
  for (const { size, name } of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(join(outputDir, name))
    console.log(`Generated ${name} (${size}×${size})`)
  }
}

main().catch(console.error)
