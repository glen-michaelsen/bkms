"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { deleteStoryAction, saveStoryAction } from "@/app/stories/actions"
import { countWords, LEARNER_WORDS_PER_MINUTE, MAX_STORY_WORDS, storyImageUrl } from "@/lib/stories"
import { StoryPhotoField, type PhotoChange } from "@/components/StoryPhotoField"

type Option = { id: number; name: string }
type Line = { serbian: string; croatian: string; english: string }
export type AdminStory = {
  id: number; slug: string
  titleSr: string; titleHr: string; titleEn: string
  levelId: number; categoryId: number; published: boolean
  imageVersion: string | null
  lines: Line[]
}
type Draft = Omit<AdminStory, "id" | "slug" | "levelId" | "categoryId" | "imageVersion"> & {
  imageVersion?: string | null
  id?: number; levelId: number | ""; categoryId: number | ""
}

const blankLine = (): Line => ({ serbian: "", croatian: "", english: "" })
const blankDraft = (): Draft => ({
  titleSr: "", titleHr: "", titleEn: "", levelId: "", categoryId: "", published: false, lines: [blankLine()],
})

const fieldCls = "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"

async function savePhoto(storyId: number, photo: PhotoChange): Promise<boolean> {
  if (photo.kind === "keep") return true
  const url = `/api/admin/stories/${storyId}/image`
  if (photo.kind === "remove") return (await fetch(url, { method: "DELETE" })).ok
  const form = new FormData()
  for (const [size, image] of Object.entries(photo.images)) form.append(size, image)
  return (await fetch(url, { method: "POST", body: form })).ok
}

function StoryForm({ initial, levels, categories, onDone }: {
  initial: Draft; levels: Option[]; categories: Option[]; onDone: () => void
}) {
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [photo, setPhoto] = useState<PhotoChange>({ kind: "keep" })
  const router = useRouter()

  const setLine = (index: number, key: keyof Line, value: string) =>
    setDraft(d => ({ ...d, lines: d.lines.map((l, i) => (i === index ? { ...l, [key]: value } : l)) }))

  const moveLine = (index: number, by: number) => setDraft(d => {
    const lines = [...d.lines]
    const [line] = lines.splice(index, 1)
    lines.splice(index + by, 0, line)
    return { ...d, lines }
  })

  const words = countWords(draft.lines.map(l => l.serbian))
  const tooLong = words > MAX_STORY_WORDS

  function save() {
    setError(null)
    if (draft.levelId === "") return setError("Choose a difficulty")
    if (draft.categoryId === "") return setError("Choose a category")
    const { levelId, categoryId } = draft
    startTransition(async () => {
      const result = await saveStoryAction({ ...draft, levelId, categoryId })
      if (result.error || !result.id) return setError(result.error ?? "Couldn't save the story")

      const saved = await savePhoto(result.id, photo)
      if (!saved) {
        // The text is saved by now, so a retry must update this story rather than create another.
        setDraft(d => ({ ...d, id: result.id }))
        return setError("The story was saved, but the photo wasn't. Try saving again.")
      }
      router.refresh()
      onDone()
    })
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
      <h3 className="font-extrabold text-slate-900 text-lg">{draft.id ? "Edit story" : "New story"}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {([["titleSr", "Title (Serbian)"], ["titleHr", "Title (Croatian)"], ["titleEn", "Title (English)"]] as const).map(([key, label]) => (
          <label key={key} className="block text-xs font-semibold text-slate-600">
            {label}
            <input value={draft[key]} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))} className={`${fieldCls} mt-1`} />
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-xs font-semibold text-slate-600">
          Difficulty
          <select
            value={draft.levelId}
            onChange={e => setDraft(d => ({ ...d, levelId: e.target.value ? parseInt(e.target.value) : "" }))}
            className={`${fieldCls} mt-1`}
          >
            <option value="">Choose…</option>
            {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Category
          <select
            value={draft.categoryId}
            onChange={e => setDraft(d => ({ ...d, categoryId: e.target.value ? parseInt(e.target.value) : "" }))}
            className={`${fieldCls} mt-1`}
          >
            <option value="">Choose…</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      <StoryPhotoField
        currentUrl={draft.id && draft.imageVersion ? storyImageUrl(draft.id, draft.imageVersion, 240) : null}
        onChange={setPhoto}
      />

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold text-slate-600">Lines</p>
          <p className={`text-xs font-semibold ${tooLong ? "text-rose-600" : "text-slate-400"}`}>
            {words} words · about {Math.max(1, Math.round(words / LEARNER_WORDS_PER_MINUTE))} min
            {tooLong && ` · over the ${MAX_STORY_WORDS}-word goal for 3 minutes`}
          </p>
        </div>
        {draft.lines.map((line, index) => (
          <div key={index} className="flex gap-2 items-start border border-slate-100 rounded-2xl p-3">
            <span className="text-xs font-bold text-slate-400 w-5 pt-2.5 text-right flex-shrink-0">{index + 1}</span>
            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {([["serbian", "Serbian"], ["croatian", "Croatian"], ["english", "English"]] as const).map(([key, label]) => (
                <textarea
                  key={key}
                  rows={2}
                  aria-label={`Line ${index + 1} in ${label}`}
                  placeholder={label}
                  value={line[key]}
                  onChange={e => setLine(index, key, e.target.value)}
                  className={`${fieldCls} resize-y`}
                />
              ))}
            </div>
            <div className="flex flex-col flex-shrink-0">
              <button type="button" aria-label={`Move line ${index + 1} up`} disabled={index === 0} onClick={() => moveLine(index, -1)} className="p-1 text-slate-400 hover:text-violet-600 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
              <button type="button" aria-label={`Move line ${index + 1} down`} disabled={index === draft.lines.length - 1} onClick={() => moveLine(index, 1)} className="p-1 text-slate-400 hover:text-violet-600 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
              <button type="button" aria-label={`Remove line ${index + 1}`} disabled={draft.lines.length === 1} onClick={() => setDraft(d => ({ ...d, lines: d.lines.filter((_, i) => i !== index) }))} className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setDraft(d => ({ ...d, lines: [...d.lines, blankLine()] }))}
          className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-800"
        >
          <Plus className="w-4 h-4" />Add line
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.published}
          onChange={e => setDraft(d => ({ ...d, published: e.target.checked }))}
          className="accent-violet-600"
        />
        Published (visible to all users)
      </label>

      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onDone} className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:border-slate-300 transition">Cancel</button>
        <button type="button" onClick={save} disabled={pending} className="px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition">
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  )
}

export function StoryAdmin({ stories, levels, categories }: {
  stories: AdminStory[]; levels: Option[]; categories: Option[]
}) {
  const [editing, setEditing] = useState<Draft | null>(null)
  const [pending, startTransition] = useTransition()
  const levelName = new Map(levels.map(l => [l.id, l.name]))
  const categoryName = new Map(categories.map(c => [c.id, c.name]))

  if (editing) {
    return <StoryForm key={editing.id ?? "new"} initial={editing} levels={levels} categories={categories} onDone={() => setEditing(null)} />
  }

  function remove(story: AdminStory) {
    if (!confirm(`Delete "${story.titleEn}"? This also removes readers' answers for it.`)) return
    startTransition(async () => { await deleteStoryAction(story.id) })
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setEditing(blankDraft())}
        className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-2xl hover:bg-violet-700 transition"
      >
        <Plus className="w-4 h-4" />New story
      </button>
      {stories.length === 0 && <p className="text-sm text-slate-400 text-center py-10">No stories yet</p>}
      {stories.map(story => (
        <div key={story.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex items-center justify-between gap-3">
          {story.imageVersion && (
            <img
              src={storyImageUrl(story.id, story.imageVersion, 240)}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-900 truncate">{story.titleSr}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${story.published ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"}`}>
                {story.published ? "Published" : "Draft"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {story.titleEn} · {levelName.get(story.levelId)} · {categoryName.get(story.categoryId)} · {story.lines.length} lines
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 text-sm font-semibold">
            <Link href={`/stories/${story.slug}`} className="text-slate-500 hover:text-violet-600">View</Link>
            <button onClick={() => setEditing(story)} className="text-slate-500 hover:text-violet-600">Edit</button>
            <button onClick={() => remove(story)} disabled={pending} className="text-slate-500 hover:text-rose-600 disabled:opacity-50">Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
