import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { Package, Shield, Truck, CreditCard } from "lucide-react";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=400&fit=crop";

export default function Home() {
  const { data: productsData } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => api.get("/products/featured?limit=8"),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories"),
  });

  const products = productsData?.data?.products || productsData?.data || [];
  const categories = categoriesData?.data || [];

  return (
    <div>
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Your Trusted Dental Supplies Partner
            </h1>
            <p className="text-xl mb-8 text-primary-100">
              Shop the widest range of dental products online. Quality products
              at best prices.
            </p>
            <div className="flex gap-4">
              <Link
                to="/products"
                className="px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex items-center space-x-4">
              <Shield className="h-10 w-10 text-primary-600" />
              <div>
                <h3 className="font-semibold">Genuine Products</h3>
                <p className="text-sm text-gray-600">100% authentic</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Truck className="h-10 w-10 text-primary-600" />
              <div>
                <h3 className="font-semibold">Fast Delivery</h3>
                <p className="text-sm text-gray-600">Across India</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <CreditCard className="h-10 w-10 text-primary-600" />
              <div>
                <h3 className="font-semibold">Secure Payment</h3>
                <p className="text-sm text-gray-600">
                  Multiple payment options
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Package className="h-10 w-10 text-primary-600" />
              <div>
                <h3 className="font-semibold">Easy Returns</h3>
                <p className="text-sm text-gray-600">Hassle-free returns</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Shop by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((category: any) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.slug}&categoryName=${encodeURIComponent(category.name)}`}
                  className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow text-center"
                >
                  <Package className="h-8 w-8 mx-auto text-primary-600 mb-2" />
                  <span className="font-medium">{category.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Featured Products</h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product: any) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}`}
                  className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square bg-gray-100">
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
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary-600">
                        ₹{product.sellingPrice}
                      </span>
                      {product.mrp > product.sellingPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{product.mrp}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No products available yet.</p>
            </div>
          )}
          <div className="text-center mt-8">
            <Link
              to="/products"
              className="inline-block px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
