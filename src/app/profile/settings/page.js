import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import ProfileSettingsForm from '@/components/profile/ProfileSettingsForm'
import { redirect } from 'next/navigation'

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
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      <ProfileSettingsForm initialProfile={profile || {}} />
    </div>
  )
}
