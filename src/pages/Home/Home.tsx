import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "@/api";
import { 
  Package, Shield, Truck, CreditCard, ChevronRight, Star, 
  MessageSquare, Award, CheckCircle
} from "lucide-react";
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

  // Sample testimonials data (in real app, fetch from API)
  const testimonials = [
    {
      id: 1,
      name: "Dr. Priya Sharma",
      specialty: "Orthodontist, Mumbai",
      rating: 5,
      text: "Excellent quality products and super fast delivery. Been ordering for my clinic for 2 years now.",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: 2,
      name: "Dr. Rajesh Kumar",
      specialty: "Endodontist, Delhi",
      rating: 5,
      text: "Best prices in the market for genuine products. Customer service is very responsive.",
      avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: 3,
      name: "Dr. Ananya Patel",
      specialty: "Prosthodontist, Bangalore",
      rating: 4,
      text: "Great selection of implant systems. Easy reordering. Highly recommend for dental clinics.",
      avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop&crop=face"
    },
  ];

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

      {/* Categories Section */}
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

      {/* Brands Section */}
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

      {/* Departments Section */}
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

      {/* Testimonials Section */}
      <section className="py-6 md:py-8 lg:py-10 bg-gradient-to-br from-primary-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">What Our Customers Say</p>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Testimonials</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-4 md:p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium md:font-semibold text-gray-900 text-sm md:text-base">{testimonial.name}</p>
                    <p className="text-xs md:text-sm text-gray-500">{testimonial.specialty}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < testimonial.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">"{testimonial.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards & Recognition Section */}
      <section className="py-6 md:py-8 lg:py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Award className="w-6 h-6 text-white" />
            </div>
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Recognition</p>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Awards & Recognition</h2>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
            {['ISO 9001:2015', 'GDP Approved', 'CE Certified', 'Quality Assurance'].map((award, index) => (
              <motion.div
                key={award}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 md:gap-3 px-3 py-2 md:px-5 md:py-3 bg-gray-50 rounded-lg md:rounded-xl"
              >
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                <span className="text-xs md:text-sm font-medium text-gray-700">{award}</span>
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
