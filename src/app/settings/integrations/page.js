import Navbar from "@/components/layout/Navbar"
import IntegrationsClient from "@/components/settings/IntegrationsClient"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function IntegrationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Navbar />
      <div className="pt-24 pb-16 px-6 md:px-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-black tracking-tight">Integrations</h1>
        <p className="text-slate-500 text-sm mt-1 mb-10">
          Your learning data is yours — sync it to your calendar, export it to
          Obsidian or Notion, or push events anywhere with webhooks.
        </p>
        <IntegrationsClient />
      </div>
    </main>
  )
}
