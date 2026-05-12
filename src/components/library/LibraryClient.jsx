'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, Plus, Loader } from 'lucide-react'
import YouTubeImportModal from '@/components/library/YouTubeImportModal'

export default function LibraryClient({ userId }) {
  const [videos, setVideos] = useState([])
  const [filteredVideos, setFilteredVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [searchType, setSearchType] = useState('title')
  const [conceptSearchResults, setConceptSearchResults] = useState(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/external')
      if (res.ok) {
        const data = await res.json()
        setVideos(data.data || [])
        setFilteredVideos(data.data || [])
      }
    } catch (err) {
      console.error('[LIBRARY] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setFilteredVideos(videos)
      setConceptSearchResults(null)
      return
    }

    if (searchType === 'title') {
      const results = videos.filter(
        v => v.title.toLowerCase().includes(query.toLowerCase()) ||
             v.channelName?.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredVideos(results)
      setConceptSearchResults(null)
    } else if (searchType === 'concept') {
      // Search across transcripts
      try {
        const res = await fetch('/api/search/concepts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, limit: 10 })
        })
        if (res.ok) {
          const data = await res.json()
          setConceptSearchResults(data.results)
          // Also filter videos that contain matching concepts
          const matchingVideoIds = new Set(data.results.map(r => r.contentId))
          setFilteredVideos(videos.filter(v => matchingVideoIds.has(v.id)))
        }
      } catch (err) {
        console.error('[CONCEPT_SEARCH] error:', err)
      }
    }
  }, [videos, searchType])

  const handleVideoImported = () => {
    setShowImportModal(false)
    fetchVideos()
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">📚 My Learning Library</h1>
        <p className="text-zinc-400 mb-6">
          {videos.length} video{videos.length !== 1 ? 's' : ''} saved • AI-powered summaries, chapters & quizzes
        </p>

        {/* Search and Import */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="Search by title, channel, or concept..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={searchType}
            onChange={e => {
              setSearchType(e.target.value)
              if (searchQuery) handleSearch(searchQuery)
            }}
            className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="title">Title & Channel</option>
            <option value="concept">Concepts</option>
          </select>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            <Plus size={18} />
            Import Video
          </button>
        </div>

        {/* Search Type Info */}
        {searchType === 'concept' && (
          <p className="text-sm text-zinc-400 mb-4">
            🔍 Searching across video transcripts for concepts and ideas
          </p>
        )}
      </div>

      {/* Concept Search Results */}
      {conceptSearchResults && conceptSearchResults.length > 0 && (
        <div className="mb-8 bg-zinc-900 border border-blue-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">📌 Found in {conceptSearchResults.length} location(s)</h2>
          <div className="space-y-3">
            {conceptSearchResults.map((result, idx) => (
              <div key={idx} className="bg-zinc-800 p-4 rounded border border-zinc-700">
                <p className="text-sm text-zinc-400 mb-2">
                  From: <span className="text-blue-400">{result.videoTitle}</span>
                </p>
                <p className="text-white mb-2">{result.context}</p>
                <div className="flex gap-2">
                  <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">
                    at {Math.floor(result.timestamp / 60)}:{String(Math.floor(result.timestamp % 60)).padStart(2, '0')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin" size={32} />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-400 mb-4">
            {videos.length === 0 ? 'No videos yet. Start by importing a YouTube video!' : 'No videos match your search.'}
          </p>
          {videos.length === 0 && (
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              <Plus size={18} />
              Import Your First Video
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map(video => (
            <Link key={video.id} href={`/external/${video.id}`}>
              <div className="group cursor-pointer h-full">
                <div className="relative overflow-hidden rounded-lg aspect-video bg-zinc-900 mb-3 border border-zinc-800 group-hover:border-blue-600 transition-colors">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                      <span className="text-4xl">🎬</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    {video.status === 'pending' && (
                      <span className="bg-yellow-600 text-yellow-100 text-xs px-2 py-1 rounded">⏳ Processing</span>
                    )}
                    {video.status === 'ready' && (
                      <span className="bg-green-600 text-green-100 text-xs px-2 py-1 rounded">✓ Ready</span>
                    )}
                    {video.status === 'failed' && (
                      <span className="bg-red-600 text-red-100 text-xs px-2 py-1 rounded">✕ Failed</span>
                    )}
                  </div>

                  {/* Features Overlay */}
                  {video.status === 'ready' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1 text-xs text-white">
                        {video.aiSummary && <span className="bg-blue-600 px-2 py-0.5 rounded">Summary</span>}
                        {video.chapters && <span className="bg-purple-600 px-2 py-0.5 rounded">Chapters</span>}
                      </div>
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-white mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {video.title}
                </h3>
                <p className="text-sm text-zinc-400 line-clamp-1">{video.channelName || 'Unknown Channel'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <YouTubeImportModal onClose={() => setShowImportModal(false)} onSuccess={handleVideoImported} />
      )}
    </div>
  )
}
