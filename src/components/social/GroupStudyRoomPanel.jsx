'use client'

import { useEffect, useState } from 'react'
import { Play, Pause, Plus } from 'lucide-react'
import StudyGroupChat from '@/components/social/StudyGroupChat'

export default function GroupStudyRoomPanel({ contentId, videoRef, userId }) {
  const [rooms, setRooms] = useState([])
  const [activeRoomId, setActiveRoomId] = useState(null)
  const [isHost, setIsHost] = useState(false)
  const [roomState, setRoomState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRooms()
  }, [contentId])

  const fetchRooms = async () => {
    try {
      const res = await fetch(`/api/study-groups/rooms?contentId=${contentId}`)
      if (res.ok) {
        const data = await res.json()
        setRooms(data.rooms || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!activeRoomId || !isHost) return

    const syncVideoState = async () => {
      if (!videoRef.current) return

      const playing = !videoRef.current.paused
      const timestamp = videoRef.current.currentTime

      try {
        await fetch(`/api/study-groups/rooms/${activeRoomId}/state`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomState: playing ? 'playing' : 'paused',
            roomTimestamp: timestamp,
          }),
        })
      } catch (err) {
        console.error(err)
      }
    }

    const interval = setInterval(syncVideoState, 2000)
    videoRef.current?.addEventListener('play', syncVideoState)
    videoRef.current?.addEventListener('pause', syncVideoState)
    videoRef.current?.addEventListener('seeked', syncVideoState)

    return () => {
      clearInterval(interval)
      videoRef.current?.removeEventListener('play', syncVideoState)
      videoRef.current?.removeEventListener('pause', syncVideoState)
      videoRef.current?.removeEventListener('seeked', syncVideoState)
    }
  }, [activeRoomId, isHost])

  useEffect(() => {
    if (!activeRoomId || isHost) return

    const syncFromRoom = async () => {
      try {
        const res = await fetch(`/api/study-groups/rooms/${activeRoomId}/state`)
        if (res.ok) {
          const data = await res.json()
          if (videoRef.current && Math.abs(videoRef.current.currentTime - data.roomTimestamp) > 2) {
            videoRef.current.currentTime = data.roomTimestamp
          }
          if (data.roomState === 'playing' && videoRef.current?.paused) {
            videoRef.current.play()
          } else if (data.roomState === 'paused' && !videoRef.current?.paused) {
            videoRef.current.pause()
          }
        }
      } catch (err) {
        console.error(err)
      }
    }

    const interval = setInterval(syncFromRoom, 5000)
    return () => clearInterval(interval)
  }, [activeRoomId, isHost])

  const handleCreateRoom = async () => {
    try {
      const res = await fetch('/api/study-groups/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId }),
      })
      if (res.ok) {
        const data = await res.json()
        setActiveRoomId(data.groupId)
        setIsHost(true)
        fetchRooms()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleJoinRoom = async (roomId, hostId) => {
    try {
      await fetch('/api/study-groups/find-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, groupId: roomId }),
      })
      setActiveRoomId(roomId)
      setIsHost(hostId === userId)
    } catch (err) {
      console.error(err)
    }
  }

  if (activeRoomId) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">🎬 Group Study Room</h3>
          <button
            onClick={() => {
              setActiveRoomId(null)
              setIsHost(false)
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Leave Room
          </button>
        </div>
        <StudyGroupChat groupId={activeRoomId} userId={userId} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleCreateRoom}
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700"
      >
        <Plus size={16} />
        Create Room
      </button>

      {loading ? (
        <div>Loading rooms...</div>
      ) : rooms.length === 0 ? (
        <div className="text-center text-slate-600 dark:text-slate-400 py-4">
          No active rooms. Create one or wait for others to join!
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map(room => (
            <div
              key={room.id}
              className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium text-sm">{room.hostName}'s Room</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {room.memberCount}/{room.maxMembers} learning
                  </div>
                </div>
                <button
                  onClick={() => handleJoinRoom(room.id, room.members[0]?.userId)}
                  disabled={room.memberCount >= room.maxMembers}
                  className="text-xs bg-blue-600 text-white rounded px-2 py-1 hover:bg-blue-700 disabled:opacity-50"
                >
                  Join
                </button>
              </div>
              <div className="flex gap-1 flex-wrap">
                {room.members.slice(0, 3).map(m => (
                  <div key={m.userId} className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                ))}
                {room.memberCount > 3 && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 self-center">
                    +{room.memberCount - 3}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
