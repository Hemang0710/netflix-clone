"use client"

import { useState } from "react"

export default function StudyGroupCard({ group, onJoin }) {
  const [joining, setJoining] = useState(false)

  async function handleJoin() {
    if (joining) return
    setJoining(true)
    try {
      await onJoin(group.id)
    } finally {
      setJoining(false)
    }
  }

  const isFull = group.memberCount >= group.maxMembers
  const firstMembers = group.members.slice(0, 3)

  return (
    <div className="glass-card rounded-xl p-4 space-y-3 hover:bg-white/8 transition-colors">
      <div>
        <h3 className="font-bold text-white text-sm">{group.topicName}</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {group.memberCount}/{group.maxMembers} members
        </p>
      </div>

      {/* Member avatars */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {firstMembers.map((member, idx) => (
            <div
              key={idx}
              className="w-7 h-7 rounded-full bg-indigo-600 border border-white/20 flex items-center justify-center text-xs font-bold text-white"
              title={member.name}
            >
              {member.name?.charAt(0) || "?"}
            </div>
          ))}
          {group.memberCount > 3 && (
            <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs text-slate-400">
              +{group.memberCount - 3}
            </div>
          )}
        </div>
      </div>

      {/* Join button */}
      <button
        onClick={handleJoin}
        disabled={joining || isFull}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
      >
        {joining ? "Joining…" : isFull ? "Group Full" : "Join Group"}
      </button>
    </div>
  )
}
