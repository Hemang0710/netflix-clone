'use client'

import { useEffect, useState } from 'react'
import { HelpCircle } from 'lucide-react'

export default function SharedQuestionsPanel({ contentId }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/questions?contentId=${contentId}`)
        if (res.ok) {
          const data = await res.json()
          setQuestions(data.questions || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [contentId])

  if (loading || questions.length === 0) return null

  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle size={16} className="text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
          Common Questions
        </span>
      </div>
      <div className="space-y-2">
        {questions.slice(0, 3).map((q, idx) => (
          <div key={idx} className="text-xs text-amber-800 dark:text-amber-200">
            <span className="font-medium">{q.count}</span> others asked about{' '}
            {q.concept || 'this concept'}
          </div>
        ))}
      </div>
    </div>
  )
}
