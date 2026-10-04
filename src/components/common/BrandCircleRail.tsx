import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import AppImage from '@/components/common/AppImage'
import api from '@/api'

interface Brand {
  id: number
  name: string
  slug: string
  logo?: string
}

const CIRCLE = 'h-12 w-12 rounded-full'

export default function BrandCircleRail() {
  const { data } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => (await api.get('/brands')).data,
  })

  const brands = (Array.isArray(data) ? data : data?.data || []) as Brand[]
  const items = [...brands].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))

  if (items.length === 0) return null

  return (
    <div className="md:hidden bg-white border-t border-gray-100">
      <nav
        aria-label="Shop by brand"
        className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 py-2"
      >
        {items.map((brand) => (
          <Link
            key={brand.id}
            to={`/brands/${brand.slug}`}
            title={brand.name}
            className="shrink-0 snap-start active:opacity-70 transition-opacity"
          >
            {brand.logo ? (
              <AppImage
                src={brand.logo}
                alt={brand.name}
                className={`${CIRCLE} object-contain p-2 bg-white ring-1 ring-gray-200`}
                widths={[96, 192]}
                sizes="48px"
              />
            ) : (
              <span
                className={`${CIRCLE} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-500`}
              >
                {brand.name.charAt(0)}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  )
}