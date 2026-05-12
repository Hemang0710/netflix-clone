"use client"

import { useState, useEffect } from "react"

export default function AnimatedVideoExplainer({ animation, onClose }) {
  const [currentScene, setCurrentScene] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)

  const scenes = animation?.scenes || []
  const scene = scenes[currentScene]

  // Auto-advance scenes based on duration
  useEffect(() => {
    if (!isPlaying || !scene) return

    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 0.1
        if (newTime >= scene.duration) {
          // Move to next scene
          if (currentScene < scenes.length - 1) {
            setCurrentScene(currentScene + 1)
            return 0
          } else {
            // End of video
            setIsPlaying(false)
            return scene.duration
          }
        }
        return newTime
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, scene, currentScene, scenes.length])

  const progress = (elapsedTime / (scene?.duration || 1)) * 100

  return (
    <div className="w-full bg-linear-to-b from-zinc-950 to-zinc-900 rounded-xl border border-zinc-700 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-lg">{animation?.title}</h3>
          <p className="text-zinc-400 text-xs mt-1">
            Scene {currentScene + 1} of {scenes.length}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Video Display Area */}
      <div className="bg-black rounded-lg aspect-video border border-zinc-700 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-linear-to-br from-indigo-950 via-black to-purple-950 opacity-50" />

        {/* Scene Content */}
        <div className="relative z-10 text-center max-w-md">
          {/* Animated title */}
          <div
            className="text-2xl font-bold text-white mb-4 animate-fade-in"
            style={{
              animation: `fadeIn 0.5s ease-in`,
              opacity: Math.min(elapsedTime / 0.5, 1),
            }}
          >
            {scene?.title}
          </div>

          {/* Key elements visualization */}
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {scene?.keyElements?.map((element, i) => (
              <div
                key={i}
                className="px-3 py-1 bg-indigo-600/40 border border-indigo-500/50 rounded-full text-xs text-indigo-200"
                style={{
                  animation: `slideUp 0.5s ease-out ${i * 0.1}s`,
                  opacity: Math.min((elapsedTime - i * 0.1) / 0.3, 1),
                }}
              >
                {element}
              </div>
            ))}
          </div>

          {/* Animation description */}
          <p className="text-zinc-300 text-sm">{scene?.animation}</p>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Narration */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
        <p className="text-zinc-200 text-sm leading-relaxed">{scene?.narration}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentScene(Math.max(0, currentScene - 1))}
            disabled={currentScene === 0}
            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
          >
            ← Prev
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors"
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            onClick={() => setCurrentScene(Math.min(scenes.length - 1, currentScene + 1))}
            disabled={currentScene === scenes.length - 1}
            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
          >
            Next →
          </button>
        </div>

        <div className="text-xs text-zinc-400">
          {elapsedTime.toFixed(1)}s / {scene?.duration}s
        </div>
      </div>

      {/* Key Takeaways (final scene) */}
      {currentScene === scenes.length - 1 && animation?.keyTakeaways && (
        <div className="bg-emerald-950/30 border border-emerald-700/50 rounded-lg p-4">
          <h4 className="text-emerald-400 font-semibold text-sm mb-2">Key Takeaways:</h4>
          <ul className="space-y-1">
            {animation.keyTakeaways.map((takeaway, i) => (
              <li key={i} className="text-emerald-200 text-xs flex gap-2">
                <span>✓</span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
