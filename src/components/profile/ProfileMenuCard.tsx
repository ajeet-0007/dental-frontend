import { ChevronRight } from 'lucide-react'
import { ReactNode } from 'react'

interface ProfileMenuCardProps {
  icon: ReactNode
  title: string
  description?: string
  badge?: string | number
  onClick?: () => void
  showChevron?: boolean
  active?: boolean
}

export default function ProfileMenuCard({
  icon,
  title,
  description,
  badge,
  onClick,
  showChevron = true,
  active = false,
}: ProfileMenuCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
        active
          ? 'border-primary-300 bg-primary-50/50'
          : 'border-gray-200 bg-white hover:border-primary-200 hover:shadow-sm'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          active ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">{title}</h3>
          {badge !== undefined && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{description}</p>
        )}
      </div>
      {showChevron && (
        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
      )}
    </button>
  )
}
