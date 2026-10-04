import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import AppImage from '@/components/common/AppImage'
import api from '@/api'

interface Department {
  id: number
  name: string
  slug: string
  image?: string
}

const CIRCLE = 'h-12 w-12 rounded-full'

export default function CategoryIconRail() {
  const { data } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data,
  })

  const departments = (Array.isArray(data) ? data : data?.data || []) as Department[]
  const items = [...departments].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))

  if (items.length === 0) return null

  return (
    <div className="md:hidden bg-white border-t border-gray-100">
      <nav
        aria-label="Shop by department"
        className="flex items-start gap-2.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 pt-2 pb-0"
      >
        {items.map((department) => (
          <Link
            key={department.id}
            to={`/departments/${department.slug}`}
            className="shrink-0 snap-start w-[68px] flex flex-col items-center gap-1 active:opacity-70 transition-opacity"
          >
            {department.image ? (
              <AppImage
                src={department.image}
                alt={department.name}
                className={`${CIRCLE} object-cover bg-gray-100 ring-1 ring-gray-200`}
                widths={[96, 192]}
                sizes="48px"
              />
            ) : (
              <span
                className={`${CIRCLE} bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center`}
              >
                <span className="text-sm font-bold text-primary-700">
                  {department.name.charAt(0)}
                </span>
              </span>
            )}
            <span className="h-[26px] w-full text-[10px] text-gray-600 text-center leading-[1.15] line-clamp-2">
              {department.name}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}