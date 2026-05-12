'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        const notifs = data.notifications || []
        setNotifications(notifs)
        setUnreadCount(notifs.filter(n => !n.read).length)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const markAsRead = async notificationId => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
      fetchNotifications()
    } catch (err) {
      console.error(err)
    }
  }

  const getNotificationMessage = n => {
    const payload = n.payload
    switch (n.type) {
      case 'buddy_invite':
        return `${payload.requesterName} wants to be your study buddy`
      case 'buddy_accepted':
        return 'Your buddy request was accepted!'
      case 'partner_request':
        return `${payload.requesterName} sent you a partner request`
      case 'partner_accepted':
        return 'Your partner request was accepted!'
      case 'partner_missed':
        return `${payload.partnerName} hasn't checked in today`
      default:
        return 'New notification'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg z-50">
          <div className="sticky top-0 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
            <h3 className="font-semibold">Notifications</h3>
            <button onClick={() => setOpen(false)} className="p-1">
              <X size={16} />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 text-center text-slate-600 dark:text-slate-400">
              No notifications yet
            </div>
          ) : (
            <div>
              {notifications.map(n => (
                <div
                  key={n.id}
                  className="p-3 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <p className="text-sm">{getNotificationMessage(n)}</p>
                    {!n.read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Mark
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
