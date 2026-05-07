"use client"

import { useState, useEffect } from "react"

function Avatar({ name, size = "sm" }) {
  const s = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"
  return (
    <div className={`${s} rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0`}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  )
}

function CommentItem({ comment, contentId, currentUserId, onDelete, onReply }) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const name = comment.user?.profile?.name || comment.user?.email?.split("@")[0] || "User"

  async function submitReply(e) {
    e.preventDefault()
    if (!replyText.trim()) return
    setSubmitting(true)
    await onReply(replyText.trim(), comment.id)
    setReplyText("")
    setShowReply(false)
    setSubmitting(false)
  }

  return (
    <div className="py-4 border-b border-white/5 last:border-0">
      <div className="flex items-start gap-3">
        <Avatar name={name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white text-xs font-semibold">{name}</span>
            <span className="text-slate-600 text-[10px]">{new Date(comment.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{comment.body}</p>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setShowReply(!showReply)} className="text-slate-500 hover:text-indigo-400 text-xs transition-colors">Reply</button>
            {comment.userId === currentUserId && (
              <button onClick={() => onDelete(comment.id)} className="text-slate-600 hover:text-red-400 text-xs transition-colors">Delete</button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies?.length > 0 && (
        <div className="ml-10 mt-3 space-y-3 border-l-2 border-white/5 pl-4">
          {comment.replies.map(reply => {
            const rName = reply.user?.profile?.name || reply.user?.email?.split("@")[0] || "User"
            return (
              <div key={reply.id} className="flex items-start gap-2">
                <Avatar name={rName} size="xs" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white text-xs font-semibold">{rName}</span>
                    <span className="text-slate-600 text-[10px]">{new Date(reply.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{reply.body}</p>
                </div>
                {reply.userId === currentUserId && (
                  <button onClick={() => onDelete(reply.id)} className="text-slate-700 hover:text-red-400 text-xs transition-colors shrink-0">✕</button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showReply && (
        <form onSubmit={submitReply} className="ml-10 mt-3 flex gap-2">
          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Write a reply…"
            className="flex-1 bg-white/5 border border-white/8 text-white placeholder-slate-600 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button type="submit" disabled={submitting || !replyText.trim()}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-3 py-2 rounded-xl transition-colors font-semibold">
            {submitting ? "…" : "Reply"}
          </button>
        </form>
      )}
    </div>
  )
}

export default function CommentsSection({ contentId }) {
  const [comments, setComments] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => { if (d.userId) setCurrentUserId(d.userId) }).catch(() => {})
    fetchComments()
  }, [contentId])

  async function fetchComments() {
    setLoading(true)
    try {
      const res = await fetch(`/api/comments?contentId=${contentId}`)
      const data = await res.json()
      if (data.success) setComments(data.data)
    } finally { setLoading(false) }
  }

  async function postComment(e) {
    e.preventDefault()
    if (!input.trim()) return
    setSubmitting(true)
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId, body: input.trim() }),
    })
    const data = await res.json()
    if (data.success) { setComments(prev => [data.data, ...prev]); setInput("") }
    setSubmitting(false)
  }

  async function postReply(body, parentId) {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId, body, parentId }),
    })
    const data = await res.json()
    if (data.success) {
      setComments(prev => prev.map(c =>
        c.id === parentId ? { ...c, replies: [...(c.replies || []), data.data] } : c
      ))
    }
  }

  async function deleteComment(id) {
    await fetch(`/api/comments/${id}`, { method: "DELETE" })
    setComments(prev => prev.filter(c => c.id !== id).map(c => ({ ...c, replies: (c.replies || []).filter(r => r.id !== id) })))
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="font-bold text-sm mb-4">💬 Discussion ({comments.length})</h3>

      <form onSubmit={postComment} className="flex gap-2 mb-6">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Share a thought or question…"
          className="flex-1 bg-white/5 border border-white/8 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" disabled={submitting || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-colors">
          Post
        </button>
      </form>

      {loading && <p className="text-slate-500 text-sm">Loading comments…</p>}
      {!loading && comments.length === 0 && <p className="text-slate-500 text-sm">No comments yet. Be the first!</p>}

      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          contentId={contentId}
          currentUserId={currentUserId}
          onDelete={deleteComment}
          onReply={postReply}
        />
      ))}
    </div>
  )
}
