import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import ProfileSettingsForm from '@/components/profile/ProfileSettingsForm'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.userId },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <Link href="/settings/integrations" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">
          🔌 Integrations →
        </Link>
      </div>
      <ProfileSettingsForm initialProfile={profile || {}} />
    </div>
  )
}
