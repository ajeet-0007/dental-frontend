import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "@/api";
import {
  Package, Shield, Truck, CreditCard,
  Sparkles, LayoutGrid, Store, Stethoscope,
  Flame, Trophy, BadgeCheck, Award, Stamp, ShieldCheck, History,
  GraduationCap
} from "lucide-react";
import ProductCarousel from "@/components/common/ProductCarousel";
import CategoryCarousel from "@/components/common/CategoryCarousel";
import DepartmentCarousel from "@/components/common/DepartmentCarousel";
import BrandCarousel from "@/components/common/BrandCarousel";
import HeroCarousel from "@/components/common/HeroCarousel";
import CartDrawer from "@/components/common/CartDrawer";
import NewsSection from "@/components/common/NewsSection";
import GalleryPreview from "@/pages/Gallery/GalleryPreview";
import { useAuthStore } from "@/stores/authStore";
import { useRecentlyViewedStore } from "@/stores/recentlyViewedStore";

export default function Home() {
  const [cartDrawerProduct, setCartDrawerProduct] = useState<any>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { items: recentlyViewed, clearItems: clearRecentlyViewed } = useRecentlyViewedStore();

  const { data: productsData } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => api.get("/products/featured?limit=100"),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: topSellingData } = useQuery({
    queryKey: ["products", "top-selling"],
    queryFn: () => api.get("/products/top-selling?limit=20"),
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

  const { data: studentData } = useQuery({
    queryKey: ["products", "student-section"],
    queryFn: () => api.get("/products?category=student-section&limit=10"),
  });

  const products = productsData?.data?.products || productsData?.data || [];
  const topSelling = topSellingData?.data?.products || topSellingData?.data || [];
  const categories = categoriesData?.data || [];
  const departments = Array.isArray(departmentsData) ? departmentsData : departmentsData?.data || [];
  const brands = Array.isArray(brandsData) ? brandsData : brandsData?.data || [];
  const banners = Array.isArray(bannersData) ? bannersData : [];
  const studentProducts = studentData?.data?.products || studentData?.data || [];

  const handleOpenCartDrawer = (product: any) => {
    setCartDrawerProduct(product);
    setIsCartDrawerOpen(true);
  };

  return (
    <div>
      {/* Hero Banner Carousel */}
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

      {/* Featured Products */}
      <section className="py-6 md:py-8 lg:py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Don't Miss</p>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Featured Products</h2>
              </div>
            </div>
            <Link
              to="/products"
              className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors group"
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
        </div>
      </section>

      {/* Recently Viewed Products */}
      {isAuthenticated && recentlyViewed.length > 0 && (
        <section className="py-6 md:py-8 lg:py-10">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Your History</p>
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Recently Viewed</h2>
                </div>
              </div>
              <button
                onClick={clearRecentlyViewed}
                className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
              >
                Clear History
              </button>
            </div>
            <ProductCarousel products={recentlyViewed} onOpenCartDrawer={handleOpenCartDrawer} />
          </div>
        </section>
      )}

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-6 md:py-8 lg:py-10 bg-gray-50/50">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                  <LayoutGrid className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Explore</p>
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Categories</h2>
                </div>
              </div>
              <Link
                to="/categories"
                className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors group"
              >
                <span>View All</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <CategoryCarousel categories={categories} itemsPerPage={6} />
          </div>
        </section>
      )}

      {/* Brands Section */}
      {brands.length > 0 && (
        <section className="py-6 md:py-8 lg:py-10 bg-gray-50/50">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Top Picks</p>
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Brands</h2>
                </div>
              </div>
              <Link
                to="/brands"
                className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors group"
              >
                <span>View All</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <BrandCarousel brands={brands} itemsPerPage={6} />
          </div>
        </section>
      )}

      {/* Departments Section */}
      {departments.length > 0 && (
        <section className="py-6 md:py-8 lg:py-10 bg-gray-50/50">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Browse</p>
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Departments</h2>
                </div>
              </div>
              <Link
                to="/departments"
                className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors group"
              >
                <span>View All</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <DepartmentCarousel departments={departments} itemsPerPage={6} />
          </div>
        </section>
      )}

      {/* Top Selling Products */}
      {topSelling.length > 0 && (
        <section className="py-6 md:py-8 lg:py-10">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Bestsellers</p>
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Top Selling Products</h2>
                </div>
              </div>
              <Link
                to="/products"
                className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors group"
              >
                <span>View All</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <ProductCarousel products={topSelling} onOpenCartDrawer={handleOpenCartDrawer} />
          </div>
        </section>
      )}

      {/* Student Essentials Section */}
      {studentProducts.length > 0 && (
        <section className="py-6 md:py-8 lg:py-10">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">For Dental Students</p>
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Student Essentials</h2>
                </div>
              </div>
              <Link
                to="/products?category=student-section"
                className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors group"
              >
                <span>View All</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <ProductCarousel products={studentProducts} onOpenCartDrawer={handleOpenCartDrawer} />
          </div>
        </section>
      )}

      {/* Latest Dental News Section */}
      <NewsSection />

      {/* Gallery Preview Section */}
      <GalleryPreview />

      {/* Awards & Recognition Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-1">Recognition</p>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Awards & Certifications</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { name: 'ISO 9001:2015', desc: 'Quality Management', color: 'from-emerald-500 to-teal-500', Icon: BadgeCheck },
              { name: 'GDP Approved', desc: 'Good Distribution', color: 'from-blue-500 to-cyan-500', Icon: ShieldCheck },
              { name: 'CE Certified', desc: 'Europe Compliance', color: 'from-violet-500 to-purple-500', Icon: Stamp },
              { name: 'Quality Assurance', desc: 'Standard Verified', color: 'from-amber-500 to-orange-500', Icon: Award },
            ].map((award, index) => (
              <motion.div
                key={award.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200 transition-all duration-300"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${award.color} rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <award.Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 text-center mb-1">{award.name}</h3>
                <p className="text-xs text-gray-500 text-center">{award.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { value: '10+', label: 'Years Experience' },
              { value: '500+', label: 'Happy Clients' },
              { value: '50+', label: 'Brand Partners' },
              { value: '1000+', label: 'Products' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="text-center"
              >
                <p className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-xs md:text-sm text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
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
