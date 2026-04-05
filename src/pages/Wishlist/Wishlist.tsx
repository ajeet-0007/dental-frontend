import { Link } from 'react-router-dom'
import { Heart, Trash2, ShoppingBag } from 'lucide-react'
import { useWishlistStore } from '@/stores/wishlistStore'
import { useCartStore } from '@/stores/cartStore'
import toast from 'react-hot-toast'

export default function Wishlist() {
  const { items, removeItem } = useWishlistStore()
  const { addItem: addToCart } = useCartStore()

  const handleAddToCart = (item: any) => {
    addToCart({
      id: item.product.id,
      quantity: 1,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        images: item.product.images || [],
        price: item.product.price,
        sellingPrice: item.product.sellingPrice,
        mrp: item.product.mrp,
        unit: item.product.unit,
      },
      variant: null,
    })
    toast.success('Added to cart')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">Save items you love to your wishlist</p>
          <Link
            to="/products"
            className="inline-block px-8 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">My Wishlist ({items.length})</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border p-4">
            <Link to={`/products/${item.product.slug}`} className="block">
              <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                {item.product.images?.[0] ? (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </div>
              <h3 className="font-medium text-gray-900 line-clamp-2">{item.product.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.product.unit}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-bold text-gray-900">₹{item.product.sellingPrice}</span>
                {item.product.mrp > item.product.sellingPrice && (
                  <span className="text-sm text-gray-400 line-through">₹{item.product.mrp}</span>
                )}
              </div>
            </Link>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleAddToCart(item)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Cart
              </button>
              <button
                onClick={() => removeItem(item.id)}
                className="p-2 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
              >
                <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}