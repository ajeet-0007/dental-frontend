import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { Package, Shield, Truck, CreditCard } from "lucide-react";
import ProductCarousel from "@/components/common/ProductCarousel";
import CategoryCarousel from "@/components/common/CategoryCarousel";
import HeroCarousel from "@/components/common/HeroCarousel";
import CartDrawer from "@/components/common/CartDrawer";

export default function Home() {
  const [cartDrawerProduct, setCartDrawerProduct] = useState<any>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const { data: productsData } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => api.get("/products/featured?limit=8"),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories"),
  });

  const { data: bannersData } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const response = await api.get("/banners");
      return response.data;
    },
  });

  const products = productsData?.data?.products || productsData?.data || [];
  const categories = categoriesData?.data || [];
  const banners = Array.isArray(bannersData) ? bannersData : [];

  const handleOpenCartDrawer = (product: any) => {
    setCartDrawerProduct(product);
    setIsCartDrawerOpen(true);
  };

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
            <Link
              to="/products"
              className="inline-block px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {banners.length > 0 && (
        <section className="py-4">
          <div className="container mx-auto px-4">
            <HeroCarousel banners={banners} />
          </div>
        </section>
      )}

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
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Shop by Category</h2>
              <Link
                to="/products"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                View All →
              </Link>
            </div>
            <CategoryCarousel categories={categories} itemsPerPage={6} />
          </div>
        </section>
      )}

      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <Link
              to="/products"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View All →
            </Link>
          </div>
          {products.length > 0 ? (
            <ProductCarousel products={products} onOpenCartDrawer={handleOpenCartDrawer} />
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No products available yet.</p>
            </div>
          )}
        </div>
      </section>

      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        product={cartDrawerProduct}
      />
    </div>
  );
}
