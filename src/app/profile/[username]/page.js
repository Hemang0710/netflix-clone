import prisma from '@/lib/prisma'
import CurrentVideosGrid from '@/components/content/CurrentVideosGrid'

export default async function PublicProfilePage({ params }) {
  const profile = await prisma.profile.findFirst({
    where: {
      username: params.username,
      isPublic: true,
    },
    include: {
      user: {
        select: {
          badgeIssuances: {
            where: { isPublic: true },
            include: { badge: true },
          },
        },
      },
    },
  })

  if (!profile) {
    return <div className="p-8 text-center text-slate-600">Profile not found</div>
  }

  const progressData = await prisma.watchProgress.findMany({
    where: { userId: profile.userId },
  })

  const currentVideos = await prisma.watchProgress.findMany({
    where: {
      userId: profile.userId,
      completed: false,
    },
    include: { content: { select: { id: true, title: true, thumbnailUrl: true, duration: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  })

  const heatmapData = {}
  progressData.forEach(p => {
    const date = p.updatedAt.toISOString().split('T')[0]
    heatmapData[date] = (heatmapData[date] || 0) + 1
  })

  const activeDays = Object.keys(heatmapData).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-4">
          {profile.avatarUrl && (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-20 h-20 rounded-full"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{profile.name}</h1>
            <p className="text-slate-600 dark:text-slate-400">@{profile.username}</p>
            {profile.bio && <p className="text-slate-700 dark:text-slate-300 mt-2">{profile.bio}</p>}
          </div>
        </div>
      </div>

      {profile.showHeatmap && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Learning Activity</h2>
          <div className="text-center text-slate-600 dark:text-slate-400">
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {activeDays}
            </div>
            <p className="text-sm">days active in the last year</p>
          </div>
        </div>
      )}

      {profile.showBadges && profile.user.badgeIssuances.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🏅 Badges Earned</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {profile.user.badgeIssuances.map(bi => (
              <div key={bi.id} className="text-center">
                <div className="text-4xl mb-2">{bi.badge.icon}</div>
                <p className="text-xs font-medium">{bi.badge.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.showCurrentVideos && currentVideos.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📚 Currently Learning</h2>
          <CurrentVideosGrid
            videos={currentVideos.map(wp => ({
              contentId: wp.contentId,
              title: wp.content?.title,
              thumbnailUrl: wp.content?.thumbnailUrl,
              timestamp: wp.timestamp,
              duration: wp.duration,
            }))}
          />
        </div>
      )}
    </div>
  )
}
