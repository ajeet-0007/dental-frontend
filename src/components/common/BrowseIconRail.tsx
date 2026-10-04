import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import AppImage from '@/components/common/AppImage'
import api from '@/api'

interface Item {
  id: number
  name: string
  slug: string
  image?: string
}

const CIRCLE = 'h-12 w-12 rounded-full'
const COLUMN = 'shrink-0 snap-start w-[68px] flex flex-col items-center gap-1 active:opacity-70 transition-opacity'

export default function BrowseIconRail() {
  const { data: departmentData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data,
  })

  const { data: categoryData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  })

  const normalize = (data: unknown): Item[] => {
    const list = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data || []
    return (list as Item[]).slice().sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
  }

  const departments = normalize(departmentData)
  const categories = normalize(categoryData)

  if (departments.length === 0 && categories.length === 0) return null

  const renderItem = (item: Item, basePath: string) => (
    <Link
      key={`${basePath}-${item.id}`}
      to={`${basePath}/${item.slug}`}
      title={item.name}
      className={COLUMN}
    >
      {item.image ? (
        <AppImage
          src={item.image}
          alt={item.name}
          className={`${CIRCLE} object-cover bg-gray-100 ring-1 ring-gray-200`}
          widths={[96, 192]}
          sizes="48px"
        />
      ) : (
        <span className={`${CIRCLE} bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center`}>
          <span className="text-sm font-bold text-primary-700">{item.name.charAt(0)}</span>
        </span>
      )}
      <span className="h-[13px] w-full truncate text-[10px] text-gray-600 text-center leading-[13px]">
        {item.name}
      </span>
    </Link>
  )

  return (
    <div className="md:hidden bg-white">
      <nav
        aria-label="Shop by department and category"
        className="flex items-start gap-2.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 pt-2 pb-0"
      >
        {departments.map((item) => renderItem(item, '/departments'))}

        {departments.length > 0 && categories.length > 0 && (
          <span aria-hidden="true" className="shrink-0 w-px h-[65px] bg-gray-200" />
        )}

        {categories.map((item) => renderItem(item, '/categories'))}
      </nav>
    </div>
  )
}