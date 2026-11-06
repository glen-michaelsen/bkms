"use client"

import { useEffect, useRef, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import { cropAndResize, type ResizedImages } from "@/lib/crop-image"
import { STORY_IMAGE_SIZES } from "@/lib/stories"

const LARGEST = STORY_IMAGE_SIZES[STORY_IMAGE_SIZES.length - 1]
const MIN_CROP_PIXELS = STORY_IMAGE_SIZES[1]

export type PhotoChange = { kind: "keep" } | { kind: "remove" } | { kind: "replace"; images: ResizedImages }

const buttonCls = "px-3 py-1.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:border-violet-300 transition"

export function StoryPhotoField({ currentUrl, onChange }: {
  currentUrl: string | null
  onChange: (change: PhotoChange) => void
}) {
  const [source, setSource] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  // Object URLs hold the whole file in memory until they're released.
  useEffect(() => () => { if (source) URL.revokeObjectURL(source) }, [source])
  useEffect(() => () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview) }, [preview])

  function pick(file: File | undefined) {
    setError(null)
    if (!file) return
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setArea(null)
    setSource(URL.createObjectURL(file))
    if (input.current) input.current.value = ""
  }

  async function apply() {
    if (!source || !area) return
    if (area.width < MIN_CROP_PIXELS) {
      setError(`That crop is only ${Math.round(area.width)}px wide. Zoom out or use a larger photo (at least ${MIN_CROP_PIXELS}px).`)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const images = await cropAndResize(source, area)
      setPreview(URL.createObjectURL(images[LARGEST]))
      setSource(null)
      onChange({ kind: "replace", images })
    } catch {
      setError("Couldn't read this image. Try a JPG, PNG or WebP file.")
    } finally {
      setBusy(false)
    }
  }

  function remove() {
    setPreview(null)
    onChange({ kind: "remove" })
  }

  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 mb-1.5">Photo (square)</p>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label="Choose a photo"
        onChange={e => pick(e.target.files?.[0])}
      />

      {source ? (
        <div className="space-y-3 max-w-sm">
          <div className="relative w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden">
            <Cropper
              image={source}
              crop={crop}
              zoom={zoom}
              aspect={1}
              maxZoom={4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
              onMediaLoaded={() => setError(null)}
            />
          </div>
          <label className="flex items-center gap-3 text-xs font-semibold text-slate-600">
            Zoom
            <input
              type="range" min={1} max={4} step={0.01} value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-violet-600 cursor-pointer"
            />
          </label>
          <p className="text-xs text-slate-500">Drag the photo to choose what stays in the square.</p>
          <div className="flex gap-2">
            <button type="button" onClick={apply} disabled={busy || !area} className="px-4 py-1.5 text-sm font-semibold rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition">
              {busy ? "Processing…" : "Use this crop"}
            </button>
            <button type="button" onClick={() => setSource(null)} className={buttonCls}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {preview ? (
            <img src={preview} alt="Story photo" width={96} height={96} className="w-24 h-24 rounded-2xl object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">No photo</div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => input.current?.click()} className={buttonCls}>
              {preview ? "Replace" : "Upload photo"}
            </button>
            {preview && <button type="button" onClick={remove} className={buttonCls}>Remove</button>}
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
    </div>
  )
}
