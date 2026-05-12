"use client"

import { useEffect, useState } from "react"
import DiagramExplainer from "@/components/ai/visual/DiagramExplainer"
import AnalogyExplainer from "@/components/ai/visual/AnalogyExplainer"
import WalkthroughExplainer from "@/components/ai/visual/WalkthroughExplainer"

export default function VisualExplainer({
  data,
  onTryDifferent,
  onFollowUp,
  onGotIt,
  contentId,
  chapterTitle
}) {
  const [proactiveStyle, setProactiveStyle] = useState(null)
  const [showProactiveHint, setShowProactiveHint] = useState(false)

  // Load user's preferred style on mount
  useEffect(() => {
    async function loadPreferredStyle() {
      try {
        const response = await fetch("/api/explanation-feedback/preferences")
        const preferences = await response.json()

        if (preferences.bestExplainerType) {
          setProactiveStyle(preferences.bestExplainerType)
          setShowProactiveHint(true)
          // Auto-hide hint after 5 seconds
          setTimeout(() => setShowProactiveHint(false), 5000)
        }
      } catch (error) {
        console.error("Error loading preferred style:", error)
      }
    }

    loadPreferredStyle()
  }, [])

  if (!data) return null

  const shared = { onTryDifferent, onFollowUp, contentId, chapterTitle }

  const proactiveHintText = {
    diagram: "Based on your learning style, this diagram might work best for you!",
    analogy: "Based on your learning style, an analogy might work best for you!",
    walkthrough: "Based on your learning style, a step-by-step walkthrough might work best for you!",
  }

  return (
    <div className="space-y-2">
      {showProactiveHint && proactiveStyle === data.type && (
        <div className="bg-amber-950/40 border border-amber-700/50 rounded-lg px-3 py-2 text-xs text-amber-300">
          💡 {proactiveHintText[data.type]}
        </div>
      )}

      {data.type === "diagram" && (
        <DiagramExplainer
          title={data.title}
          description={data.description}
          svgCode={data.svgCode}
          keyPoints={data.keyPoints}
          followUpPrompts={data.followUpPrompts}
          {...shared}
        />
      )}

      {data.type === "analogy" && (
        <AnalogyExplainer
          title={data.title}
          realWorldSetup={data.realWorldSetup}
          story={data.story}
          mapping={data.mapping}
          followUpPrompts={data.followUpPrompts}
          {...shared}
        />
      )}

      {data.type === "walkthrough" && (
        <WalkthroughExplainer
          title={data.title}
          steps={data.steps}
          onGotIt={onGotIt}
          onTryDifferent={onTryDifferent}
          {...{ contentId, chapterTitle }}
        />
      )}

      {!["diagram", "analogy", "walkthrough"].includes(data.type) && (
        <div className="text-zinc-400 text-xs p-3">
          <p className="font-semibold text-white">{data.title}</p>
          <p className="mt-1">{data.description || data.story || ""}</p>
        </div>
      )}
    </div>
  )
}
