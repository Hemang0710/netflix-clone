"use client"

import { useEffect, useState } from "react"
import StudyGroupCard from "./StudyGroupCard"
import StudyGroupChat from "./StudyGroupChat"
import { getCurrentUser } from "@/lib/auth"

export default function StudyGroupPanel({ contentId }) {
  const [view, setView] = useState("list") // "list" or "chat"
  const [groups, setGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [joining, setJoining] = useState(false)

  // Get current user
  useEffect(() => {
    async function getUser() {
      try {
        const res = await fetch("/api/auth/me")
        const data = await res.json()
        if (data.userId) {
          setCurrentUserId(data.userId)
        }
      } catch (error) {
        console.error("Failed to get user:", error)
      }
    }
    getUser()
  }, [])

  // Fetch groups
  useEffect(() => {
    async function loadGroups() {
      try {
        const res = await fetch(`/api/study-groups?contentId=${contentId}`)
        const data = await res.json()
        if (data.success) {
          setGroups(data.data)
        }
      } catch (error) {
        console.error("Failed to load groups:", error)
      } finally {
        setLoading(false)
      }
    }
    loadGroups()
  }, [contentId])

  async function handleAutoJoin(groupId) {
    setJoining(true)
    try {
      const res = await fetch("/api/study-groups/find-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          skillLevel: "intermediate",
          quizScore: 0
        })
      })

      const data = await res.json()
      if (data.success) {
        setSelectedGroupId(data.data.groupId)
        setView("chat")
      }
    } catch (error) {
      console.error("Failed to join group:", error)
    } finally {
      setJoining(false)
    }
  }

  function handleLeaveGroup() {
    setView("list")
    setSelectedGroupId(null)
    // Reload groups
    fetch(`/api/study-groups?contentId=${contentId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setGroups(d.data)
      })
  }

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-5 h-full flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-32 bg-white/10 rounded mx-auto mb-4" />
          <div className="h-4 w-48 bg-white/5 rounded mx-auto" />
        </div>
      </div>
    )
  }

  if (view === "chat" && selectedGroupId) {
    return (
      <div className="glass-card rounded-2xl p-5 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold">Study Group Chat</h2>
          <button
            onClick={handleLeaveGroup}
            className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            ← Back to Groups
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <StudyGroupChat groupId={selectedGroupId} currentUserId={currentUserId} onLeave={handleLeaveGroup} />
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="space-y-4">
        <div>
          <h2 className="text-white font-bold mb-1">Study Groups</h2>
          <p className="text-sm text-slate-500">Learn together with peers on this topic</p>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-slate-500 text-sm">No study groups yet. Start one!</p>
            <button
              onClick={() => handleAutoJoin(null)}
              disabled={joining}
              className="mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
            >
              {joining ? "Creating…" : "Create Study Group"}
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {groups.map(group => (
              <StudyGroupCard
                key={group.id}
                group={group}
                onJoin={() => handleAutoJoin(group.id)}
              />
            ))}

            {/* Auto-match button */}
            <button
              onClick={() => handleAutoJoin(null)}
              disabled={joining}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-indigo-900 disabled:to-purple-900 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {joining ? "Finding Group…" : "🤖 Auto-Match Me to a Group"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
