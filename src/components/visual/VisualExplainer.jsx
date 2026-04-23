"use client"

import DiagramExplainer from "./DiagramExplainer"
import AnalogyExplainer from "./AnalogyExplainer"
import WalkthroughExplainer from "./WalkthroughExplainer"

export default function VisualExplainer({ data, onTryDifferent, onFollowUp, onGotIt }) {
  if (!data) return null

  const shared = { onTryDifferent, onFollowUp }

  if (data.type === "diagram") {
    return (
      <DiagramExplainer
        title={data.title}
        description={data.description}
        svgCode={data.svgCode}
        keyPoints={data.keyPoints}
        followUpPrompts={data.followUpPrompts}
        {...shared}
      />
    )
  }

  if (data.type === "analogy") {
    return (
      <AnalogyExplainer
        title={data.title}
        realWorldSetup={data.realWorldSetup}
        story={data.story}
        mapping={data.mapping}
        followUpPrompts={data.followUpPrompts}
        {...shared}
      />
    )
  }

  if (data.type === "walkthrough") {
    return (
      <WalkthroughExplainer
        title={data.title}
        steps={data.steps}
        onGotIt={onGotIt}
        onTryDifferent={onTryDifferent}
      />
    )
  }

  // Fallback for unexpected type
  return (
    <div className="text-zinc-400 text-xs p-3">
      <p className="font-semibold text-white">{data.title}</p>
      <p className="mt-1">{data.description || data.story || ""}</p>
    </div>
  )
}
