import ContentCard from "./ContentCard"
import Link from "next/link"

export default function ContentRow({ title, items, progressMap = {}, href }) {
  if (!items?.length) return null

  return (
    <div className="mb-10 px-6 md:px-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-lg font-bold">{title}</h2>
        {href && (
          <Link href={href} className="text-indigo-400 text-xs font-medium hover:text-indigo-300 transition-colors">
            See all →
          </Link>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
        {items.map((item) => (
          <ContentCard
            key={item.id}
            content={item}
            progress={progressMap[item.id]}
          />
        ))}
      </div>
    </div>
  )
}
