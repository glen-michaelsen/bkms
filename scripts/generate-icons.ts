import sharp from "sharp"
import { readFileSync, mkdirSync, copyFileSync } from "fs"
import { join } from "path"

const svgPath = join(process.cwd(), "public", "app-icon.svg")
const svg = readFileSync(svgPath)

const iconsDir = join(process.cwd(), "public", "icons")
const publicDir = join(process.cwd(), "public")
mkdirSync(iconsDir, { recursive: true })

const sizes = [
  { size: 192,  name: "icon-192.png" },  // Android manifest (any)
  { size: 512,  name: "icon-512.png" },  // Android manifest (maskable)
  { size: 180,  name: "apple-touch-icon.png" }, // iOS (via meta tag)
]

async function main() {
  for (const { size, name } of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, name))
    console.log(`Generated public/icons/${name} (${size}×${size})`)
  }

  // iOS auto-discovers apple-touch-icon.png at the root even without a meta tag
  copyFileSync(
    join(iconsDir, "apple-touch-icon.png"),
    join(publicDir, "apple-touch-icon.png")
  )
  console.log("Copied apple-touch-icon.png → public/apple-touch-icon.png (root)")
}

main().catch(console.error)
