"use client"

import { useEffect, useRef, useState } from "react"

export default function StudyGroupChat({ groupId, currentUserId, onLeave }) {
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  // Fetch group data and messages
  async function loadGroup() {
    try {
      const res = await fetch(`/api/study-groups/${groupId}`)
      const data = await res.json()

      if (data.success) {
        setMessages(data.data.messages)
        setMembers(data.data.group.members)
      }
    } catch (error) {
      console.error("Failed to load group:", error)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadGroup()
  }, [groupId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(loadGroup, 5000)
    return () => clearInterval(interval)
  }, [groupId])

  async function handleSendMessage(e) {
    e.preventDefault()
    if (!input.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/study-groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() })
      })

      if (res.ok) {
        setInput("")
        // Reload messages
        await loadGroup()
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  async function handleHelpful(messageId) {
    try {
      await fetch(`/api/study-groups/${groupId}/messages/${messageId}/helpful`, {
        method: "POST"
      })
      // Update local state
      setMessages(msgs =>
        msgs.map(m => (m.id === messageId ? { ...m, helpfulCount: m.helpfulCount + 1 } : m))
      )
    } catch (error) {
      console.error("Failed to mark helpful:", error)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-white/10 rounded mb-4" />
          <div className="h-4 w-48 bg-white/5 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white/2 rounded-2xl overflow-hidden">
      {/* Header with members */}
      <div className="bg-white/3 border-b border-white/8 px-5 py-4">
        <h3 className="text-white font-bold mb-3">Study Group Members</h3>
        <div className="flex flex-wrap gap-2">
          {members.map(member => (
            <div key={member.userId} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
                {member.name?.charAt(0) || "?"}
              </div>
              <div className="text-xs">
                <div className="text-white font-semibold">{member.name}</div>
                <div className="text-slate-500 text-[10px]">{member.skillLevel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-slate-500 text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isCurrentUser = msg.userId === currentUserId
            const isAI = msg.isAI

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isCurrentUser ? "justify-end" : ""}`}
              >
                {!isAI && !isCurrentUser && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {msg.userName?.charAt(0) || "?"}
                  </div>
                )}

                {isAI && (
                  <div className="text-lg shrink-0">🤖</div>
                )}

                <div
                  className={`max-w-xs rounded-xl px-3.5 py-2.5 ${
                    isCurrentUser
                      ? "bg-indigo-600 text-white"
                      : isAI
                        ? "bg-purple-600/20 border border-purple-500/30 text-slate-200"
                        : "bg-white/8 text-white"
                  }`}
                >
                  {isAI && <p className="text-purple-300 text-xs font-semibold mb-1">AI Tutor</p>}
                  <p className="text-sm break-words">{msg.message}</p>

                  {!isAI && !msg.isFlagged && (
                    <button
                      onClick={() => handleHelpful(msg.id)}
                      className="text-[10px] text-slate-400 hover:text-slate-300 mt-1 transition-colors"
                    >
                      👍 Helpful ({msg.helpfulCount})
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/8 px-5 py-3 bg-white/1">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask for help or share insights..."
            disabled={sending}
            className="flex-1 bg-white/5 border border-white/8 text-white placeholder-slate-600 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 text-white rounded-lg px-4 py-2.5 text-sm font-bold transition-colors"
          >
            {sending ? "…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  )
}
