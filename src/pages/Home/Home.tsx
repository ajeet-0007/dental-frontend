import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "@/api";
import { Package, Shield, Truck, CreditCard, ChevronRight } from "lucide-react";
import ProductCarousel from "@/components/common/ProductCarousel";
import CategoryCarousel from "@/components/common/CategoryCarousel";
import DepartmentCarousel from "@/components/common/DepartmentCarousel";
import BrandCarousel from "@/components/common/BrandCarousel";
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

  const { data: departmentsData } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await api.get("/departments");
      return response.data;
    },
  });

  const { data: brandsData } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await api.get("/brands");
      return response.data;
    },
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
  const departments = Array.isArray(departmentsData) ? departmentsData : departmentsData?.data || [];
  const brands = Array.isArray(brandsData) ? brandsData : brandsData?.data || [];
  const banners = Array.isArray(bannersData) ? bannersData : [];

  const handleOpenCartDrawer = (product: any) => {
    setCartDrawerProduct(product);
    setIsCartDrawerOpen(true);
  };

  return (
    <div>
      {/* <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
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
      </section> */}

      {banners.length > 0 && (
        <section className="py-4">
          <div className="container mx-auto px-4">
            <HeroCarousel banners={banners} />
          </div>
        </section>
      )}

      {/* Trust Badges - Modern Gradient & Shadow */}
      <section className="py-6 md:py-8 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4">
          {/* Mobile: 2x2 Grid - Compact */}
          <div className="grid grid-cols-2 gap-2 md:hidden">
            <motion.div 
              whileHover={{ scale: 1.03 }} 
              className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-md shadow-primary-500/20">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">Genuine Products</p>
                <p className="text-[9px] text-gray-500">100% Authentic</p>
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.03 }} 
              className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                <Truck className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">Fast Delivery</p>
                <p className="text-[9px] text-gray-500">Pan India Delivery</p>
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.03 }} 
              className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-md shadow-green-500/20">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">Secure Payment</p>
                <p className="text-[9px] text-gray-500">Safe Checkout</p>
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.03 }} 
              className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-md shadow-amber-500/20">
                <Package className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">Easy Returns</p>
                <p className="text-[9px] text-gray-500">7-Day Returns</p>
              </div>
            </motion.div>
          </div>

          {/* Desktop: Horizontal Row */}
          <div className="hidden md:flex items-center justify-between gap-4">
            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }} 
              className="flex-1 flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-primary-500/10 transition-all"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Genuine Products</p>
                <p className="text-sm text-gray-500">100% Authentic Guaranteed</p>
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }} 
              className="flex-1 flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Truck className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Fast Delivery</p>
                <p className="text-sm text-gray-500">Pan India Delivery</p>
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }} 
              className="flex-1 flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-green-500/10 transition-all"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <CreditCard className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Secure Payment</p>
                <p className="text-sm text-gray-500">256-bit SSL Encrypted</p>
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }} 
              className="flex-1 flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-amber-500/10 transition-all"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Easy Returns & Refunds</p>
                <p className="text-sm text-gray-500">7-Day Return Policy</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="py-6 md:py-8 lg:py-10">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-4 md:mb-6">
              <div>
                <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Explore</p>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Categories</h2>
              </div>
              <Link
                to="/categories"
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors group"
              >
                <span>View All</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <CategoryCarousel categories={categories} itemsPerPage={6} />
            <Link to="/categories" className="sm:hidden flex justify-center mt-4 text-sm font-medium text-primary-600 py-2">
              View All Categories →
            </Link>
          </div>
        </section>
      )}

      {brands.length > 0 && (
        <section className="py-6 md:py-8 lg:py-10 bg-gray-50/50">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-4 md:mb-6">
              <div>
                <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Top Picks</p>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Brands</h2>
              </div>
              <Link
                to="/brands"
                className="hidden md:flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <BrandCarousel brands={brands} itemsPerPage={6} />
            <Link to="/brands" className="sm:hidden flex justify-center mt-4 text-sm font-medium text-primary-600 py-2">
              View All Brands →
            </Link>
          </div>
        </section>
      )}

      {departments.length > 0 && (
        <section className="py-6 md:py-8 lg:py-10">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-4 md:mb-6">
              <div>
                <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Browse</p>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Departments</h2>
              </div>
              <Link
                to="/departments"
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors group"
              >
                <span>View All</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <DepartmentCarousel departments={departments} itemsPerPage={6} />
            <Link to="/departments" className="sm:hidden flex justify-center mt-4 text-sm font-medium text-primary-600 py-2">
              View All Departments →
            </Link>
          </div>
        </section>
      )}

      <section className="py-6 md:py-8 lg:py-10 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-4 md:mb-6">
            <div>
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Don't Miss</p>
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Featured Products</h2>
            </div>
            <Link
              to="/products"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors group"
            >
              <span>View All</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {products.length > 0 ? (
            <ProductCarousel products={products} onOpenCartDrawer={handleOpenCartDrawer} />
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No products available yet.</p>
            </div>
          )}
          <Link to="/products" className="sm:hidden flex justify-center mt-4 text-sm font-medium text-primary-600 py-2">
            View All Products →
          </Link>
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
