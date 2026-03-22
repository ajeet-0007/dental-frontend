import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/api'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { Package, ShoppingCart, Star } from 'lucide-react'

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=400&fit=crop'

export default function ProductDetail() {
  const { slug } = useParams()
  const { isAuthenticated } = useAuthStore()
  const { addItem } = useCartStore()
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/slug/${slug}`),
  })

  const addToCartMutation = useMutation({
    mutationFn: (productId: string) =>
      api.post('/cart/add', { productId, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  const product = data?.data

  const handleAddToCart = async () => {
    if (!product) return
    
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart')
      return
    }

    try {
      await addToCartMutation.mutateAsync(product.id)
      addItem({
        id: product.id,
        quantity,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          images: product.images,
          price: product.price,
          sellingPrice: product.sellingPrice,
          mrp: product.mrp,
          unit: product.unit,
        },
        variant: null,
      })
      toast.success('Added to cart!')
    } catch (error) {
      toast.error('Failed to add to cart')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-20 bg-gray-200 rounded w-full"></div>
                <div className="h-12 bg-gray-200 rounded w-1/4 mt-8"></div>
                <div className="h-14 bg-gray-200 rounded w-full mt-4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Product not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={DEFAULT_IMAGE}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-4">
            <span className="text-3xl font-bold text-primary-600">
              ₹{product.sellingPrice}
            </span>
            {product.mrp > product.sellingPrice && (
              <>
                <span className="text-xl text-gray-500 line-through">
                  ₹{product.mrp}
                </span>
                <span className="text-green-600 font-medium">
                  {Math.round((1 - product.sellingPrice / product.mrp) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-500">(4 reviews)</span>
          </div>

          <p className="text-gray-600 mb-6">{product.description}</p>

          <div className="flex items-center gap-4 mb-6">
            <label className="text-gray-600">Quantity:</label>
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-2 hover:bg-gray-100"
              >
                -
              </button>
              <span className="px-4 py-2">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="px-4 py-2 hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <ShoppingCart className="h-5 w-5" />
            {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
