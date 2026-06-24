"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronUp, ChevronDown, Type, AlignLeft, Image, MousePointer } from "lucide-react"
import type { Block } from "@/lib/email-html"

type Props = {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
}

const BLOCK_ICONS = {
  heading:   { icon: Type,         label: "Heading"   },
  paragraph: { icon: AlignLeft,    label: "Paragraph" },
  image:     { icon: Image,        label: "Image"     },
  button:    { icon: MousePointer, label: "Button"    },
}

export function EmailBlockEditor({ blocks, onChange }: Props) {
  function add(type: Block["type"]) {
    const newBlock: Block =
      type === "heading"   ? { type, text: "" } :
      type === "paragraph" ? { type, text: "" } :
      type === "image"     ? { type, url: "", alt: "" } :
                             { type, label: "", url: "" }
    onChange([...blocks, newBlock])
  }

  function update(i: number, patch: Partial<Block>) {
    onChange(blocks.map((b, idx) => idx === i ? { ...b, ...patch } as Block : b))
  }

  function remove(i: number) {
    onChange(blocks.filter((_, idx) => idx !== i))
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...blocks]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <div key={i} className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {BLOCK_ICONS[block.type].label}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0}
                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                <ChevronUp className="w-4 h-4" />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1}
                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                <ChevronDown className="w-4 h-4" />
              </button>
              <button onClick={() => remove(i)}
                className="p-1 text-slate-400 hover:text-red-500 ml-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {block.type === "heading" && (
            <input
              value={block.text}
              onChange={e => update(i, { text: e.target.value })}
              placeholder="Heading text…"
              className="w-full text-lg font-bold text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400"
            />
          )}

          {block.type === "paragraph" && (
            <textarea
              value={block.text}
              onChange={e => update(i, { text: e.target.value })}
              placeholder="Paragraph text… (use **bold** for bold)"
              rows={3}
              className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400 resize-y"
            />
          )}

          {block.type === "image" && (
            <div className="space-y-2">
              <input
                value={block.url}
                onChange={e => update(i, { url: e.target.value })}
                placeholder="Image URL (https://…)"
                className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400"
              />
              <input
                value={block.alt ?? ""}
                onChange={e => update(i, { alt: e.target.value })}
                placeholder="Alt text (optional)"
                className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400"
              />
              {block.url && (
                <img src={block.url} alt={block.alt} className="rounded-xl max-h-32 object-cover" />
              )}
            </div>
          )}

          {block.type === "button" && (
            <div className="space-y-2">
              <input
                value={block.label}
                onChange={e => update(i, { label: e.target.value })}
                placeholder="Button label"
                className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400"
              />
              <input
                value={block.url}
                onChange={e => update(i, { url: e.target.value })}
                placeholder="Button URL (https://…)"
                className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400"
              />
              {block.label && (
                <div className="mt-1">
                  <span className="inline-block bg-violet-600 text-white text-sm font-bold px-5 py-2 rounded-xl">
                    {block.label}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add block buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        {(Object.entries(BLOCK_ICONS) as [Block["type"], typeof BLOCK_ICONS[Block["type"]]][]).map(([type, { icon: Icon, label }]) => (
          <button
            key={type}
            onClick={() => add(type)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-xs font-semibold hover:border-violet-400 hover:text-violet-600 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
