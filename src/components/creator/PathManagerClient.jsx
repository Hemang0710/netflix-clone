"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function PathManagerClient({ paths: initialPaths, myVideos }) {
  const router = useRouter()
  const [paths, setPaths] = useState(initialPaths)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", videoIds: [], isPublished: false, dripEnabled: false, dripSchedule: [] })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)

  function toggleVideo(id) {
    setForm(f => ({
      ...f,
      videoIds: f.videoIds.includes(id) ? f.videoIds.filter(v => v !== id) : [...f.videoIds, id],
    }))
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    const method = editId ? "PUT" : "POST"
    const url = editId ? `/api/paths/${editId}` : "/api/paths"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.success) {
      router.refresh()
      setCreating(false)
      setEditId(null)
      setForm({ title: "", description: "", videoIds: [], isPublished: false })
    }
    setSaving(false)
  }

  async function deletePath(id) {
    if (!confirm("Delete this learning path?")) return
    await fetch(`/api/paths/${id}`, { method: "DELETE" })
    setPaths(prev => prev.filter(p => p.id !== id))
  }

  function setDripDays(contentId, days) {
    setForm(f => {
      const schedule = f.dripSchedule.filter(s => s.contentId !== contentId)
      if (days !== "") schedule.push({ contentId, unlockAfterDays: Number(days) })
      return { ...f, dripSchedule: schedule }
    })
  }

  function getDripDays(contentId) {
    return form.dripSchedule.find(s => s.contentId === contentId)?.unlockAfterDays ?? ""
  }

  function startEdit(path) {
    setForm({
      title: path.title, description: path.description || "",
      videoIds: JSON.parse(path.videoIds || "[]"), isPublished: path.isPublished,
      dripEnabled: path.dripEnabled || false,
      dripSchedule: JSON.parse(path.dripSchedule || "[]"),
    })
    setEditId(path.id)
    setCreating(true)
  }

  return (
    <div className="space-y-6">
      {!creating ? (
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
          + New Learning Path
        </button>
      ) : (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-bold">{editId ? "Edit Path" : "New Learning Path"}</h2>

          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Path title *"
            className="w-full bg-white/5 border border-white/8 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />

          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)" rows={2}
            className="w-full bg-white/5 border border-white/8 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />

          <div>
            <p className="text-sm font-semibold mb-3">Select videos ({form.videoIds.length} selected)</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {myVideos.map(v => (
                <label key={v.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.videoIds.includes(v.id) ? "border-indigo-500/50 bg-indigo-500/10" : "border-white/6 hover:border-white/12"}`}>
                  <input type="checkbox" checked={form.videoIds.includes(v.id)} onChange={() => toggleVideo(v.id)} className="accent-indigo-500" />
                  <div className="w-12 h-8 rounded-lg overflow-hidden bg-white/5 shrink-0">
                    {v.thumbnailUrl ? <Image src={v.thumbnailUrl} alt={v.title} width={48} height={32} className="w-full h-full object-cover" /> : <span className="text-xs flex items-center justify-center h-full">🎬</span>}
                  </div>
                  <span className="text-sm text-white truncate">{v.title}</span>
                </label>
              ))}
              {myVideos.length === 0 && <p className="text-slate-500 text-sm">Upload some videos first.</p>}
            </div>
          </div>

          {/* Drip content toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.dripEnabled} onChange={e => setForm(f => ({ ...f, dripEnabled: e.target.checked }))} className="accent-indigo-500" />
            <span className="text-sm">Enable drip content <span className="text-slate-500 text-xs">(unlock videos over time)</span></span>
          </label>

          {form.dripEnabled && form.videoIds.length > 0 && (
            <div className="bg-white/3 rounded-xl p-3 space-y-2">
              <p className="text-xs text-slate-400 font-semibold">Unlock schedule (days after enrollment)</p>
              {form.videoIds.map((vid, i) => {
                const video = myVideos.find(v => v.id === vid)
                if (!video) return null
                return (
                  <div key={vid} className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs w-4">{i + 1}.</span>
                    <span className="text-slate-300 text-xs flex-1 truncate">{video.title}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={getDripDays(vid)}
                        onChange={e => setDripDays(vid, e.target.value)}
                        className="w-14 bg-white/8 border border-white/8 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                      />
                      <span className="text-slate-600 text-xs">days</span>
                    </div>
                  </div>
                )
              })}
              <p className="text-slate-600 text-[10px] pt-1">Set 0 to unlock immediately on enrollment.</p>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} className="accent-indigo-500" />
            <span className="text-sm">Publish (visible to all learners)</span>
          </label>

          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.title.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
              {saving ? "Saving…" : "Save Path"}
            </button>
            <button onClick={() => { setCreating(false); setEditId(null); setForm({ title: "", description: "", videoIds: [], isPublished: false }) }}
              className="bg-white/5 hover:bg-white/10 border border-white/8 text-white px-5 py-2.5 rounded-xl text-sm transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {paths.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <span className="text-4xl">🎓</span>
          <p className="text-slate-400 mt-3">No paths yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/5">
          {paths.map(path => {
            const videoCount = JSON.parse(path.videoIds || "[]").length
            return (
              <div key={path.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/2 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm text-white">{path.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${path.isPublished ? "bg-emerald-500/20 text-emerald-400" : "bg-white/8 text-slate-500"}`}>
                      {path.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs">{videoCount} videos · {path._count?.enrollments || 0} enrolled</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(path)} className="text-xs bg-white/5 hover:bg-white/10 border border-white/8 px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                  <button onClick={() => deletePath(path.id)} className="text-xs bg-white/5 hover:bg-red-600/20 hover:border-red-600/40 border border-white/8 text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg transition-all">Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
