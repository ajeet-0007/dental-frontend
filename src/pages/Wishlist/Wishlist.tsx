import { Link } from 'react-router-dom'
import { Heart, Trash2, ShoppingBag } from 'lucide-react'
import { motion } from 'framer-motion'
import { useWishlistStore } from '@/stores/wishlistStore'
import { useCartStore } from '@/stores/cartStore'
import { useAuthStore } from '@/stores/authStore'
import api from '@/api'
import toast from 'react-hot-toast'

export default function Wishlist() {
  const { items, removeItem } = useWishlistStore()
  const { addItem: addToCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const handleAddToCart = async (item: any) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart')
      return
    }

    const productId = String(item.product.id)
    const cartItemId = productId

    try {
      await api.post('/cart/add', { productId, quantity: 1 })
      addToCart({
        id: cartItemId,
        quantity: 1,
        product: {
          id: productId,
          name: item.product.name,
          slug: item.product.slug,
          images: item.product.images || [],
          sellingPrice: item.product.sellingPrice,
          mrp: item.product.mrp,
          unit: item.product.unit,
        },
        variant: null,
      })
      toast.success('Added to cart')
    } catch {
      toast.error('Failed to add to cart')
    }
  }

  const getDiscount = (mrp: number, selling: number) => {
    if (mrp > selling) {
      return Math.round(((mrp - selling) / mrp) * 100)
    }
    return 0
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="container mx-auto px-4 py-6 md:py-8">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Saved for later</p>
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">My Wishlist</h2>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center"
          >
            <motion.div 
              className="w-24 h-24 bg-gradient-to-br from-blue-100 to-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Heart className="h-12 w-12 text-primary-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">Save items you love to your wishlist and come back to them anytime.</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-2xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-xl shadow-primary-600/30 hover:shadow-primary-700/40 hover:scale-105"
            >
              <ShoppingBag className="h-5 w-5" />
              Browse Products
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Saved for later</p>
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">My Wishlist ({items.length})</h2>
            </div>
          </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {items.map((item, index) => {
            const discount = getDiscount(item.product.mrp, item.product.sellingPrice)
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <Link to={`/products/${item.product.slug}`} className="block">
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    {item.product.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Heart className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-medium rounded">
                        {discount}% OFF
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.preventDefault(); removeItem(item.id) }}
                      className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 min-h-[40px] mb-1">{item.product.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-primary-600">₹{item.product.sellingPrice}</span>
                      {item.product.mrp > item.product.sellingPrice && (
                        <span className="text-xs text-gray-400 line-through">₹{item.product.mrp}</span>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="px-3 pb-3">
                  <button
                    onClick={() => handleAddToCart(item)}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      'bg-primary-50 text-primary-600 hover:bg-primary-100'
                    }`}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
