import { STORY_IMAGE_SIZES, type StoryImageSize } from "@/lib/stories"

export type CropArea = { x: number; y: number; width: number; height: number }
export type ResizedImages = Record<StoryImageSize, Blob>

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Couldn't read this image"))
    image.src = src
  })
}

function encode(canvas: HTMLCanvasElement): Promise<Blob> {
  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality))
  return toBlob("image/webp", 0.82).then(async webp => {
    // Safari can't encode WebP and silently returns PNG instead.
    if (webp?.type === "image/webp") return webp
    const jpeg = await toBlob("image/jpeg", 0.85)
    if (!jpeg) throw new Error("Couldn't process this image")
    return jpeg
  })
}

/** Crops the photo in the browser and returns it in every size, so originals never reach the server. */
export async function cropAndResize(src: string, area: CropArea): Promise<ResizedImages> {
  const image = await loadImage(src)
  const result = {} as ResizedImages

  // Largest first, each drawn from the one before: halving in steps stays sharper than one big jump.
  let source: CanvasImageSource = image
  let sourceArea = area
  for (const size of [...STORY_IMAGE_SIZES].sort((a, b) => b - a)) {
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Couldn't process this image")
    context.imageSmoothingQuality = "high"
    context.drawImage(source, sourceArea.x, sourceArea.y, sourceArea.width, sourceArea.height, 0, 0, size, size)
    result[size] = await encode(canvas)
    source = canvas
    sourceArea = { x: 0, y: 0, width: size, height: size }
  }
  return result
}
