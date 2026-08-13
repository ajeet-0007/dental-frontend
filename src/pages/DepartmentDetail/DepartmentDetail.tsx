import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "@/api";
import Seo from "@/components/seo/Seo";
import { buildBreadcrumbJsonLd, truncateDescription } from "@/components/seo/seoHelpers";
import ProductCarousel from "@/components/common/ProductCarousel";
import AppImage from "@/components/common/AppImage";
import Products from "@/pages/Products/Products";
import {
  Building2,
  Package,
  Store,
  FolderOpen,
  ShoppingBag,
  ChevronRight,
  Sparkles,
  ArrowDown,
} from "lucide-react";

const INITIAL_COLORS = [
  "from-blue-500 to-blue-600",
  "from-green-500 to-green-600",
  "from-purple-500 to-purple-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
  "from-teal-500 to-teal-600",
  "from-red-500 to-red-600",
  "from-indigo-500 to-indigo-600",
];

export default function DepartmentDetail() {
  const { slug } = useParams();

  const { data: department, isLoading, isError } = useQuery({
    queryKey: ["department", "slug", slug],
    queryFn: async () => {
      const response = await api.get(`/departments/slug/${slug}`);
      return response.data;
    },
    enabled: !!slug,
    retry: false,
  });

  const { data: details } = useQuery({
    queryKey: ["department", "details", slug],
    queryFn: async () => {
      const response = await api.get(`/departments/slug/${slug}/details`);
      return response.data;
    },
    enabled: !!slug && !isError,
    retry: false,
  });

  const { data: featuredData } = useQuery({
    queryKey: ["products", "department", slug, "featured"],
    queryFn: async () => {
      const response = await api.get("/products", {
        params: { departments: slug, isFeatured: true, limit: 12 },
      });
      return response.data;
    },
    enabled: !!slug && !isError,
    retry: false,
  });

  const featuredProducts = featuredData?.products || [];
  const stats = details && typeof details === "object" ? details : {};
  const categories = department?.categories || [];
  const entityName = department?.name || "";
  const description = truncateDescription(
    department?.description ||
      (entityName
        ? `Shop ${entityName} dental products online at the best prices.`
        : ""),
    155
  );
  const path = `/departments/${slug}`;

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Departments", path: "/departments" },
    { name: entityName || slug || "", path },
  ]);

  const gradientClass =
    INITIAL_COLORS[
      Math.abs(((department?.id ?? 1) - 1) % INITIAL_COLORS.length)
    ];

  const scrollToProducts = () => {
    document
      .getElementById("shop-the-department")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  if (isError) {
    return (
      <>
        <Seo title={entityName || "Page Not Found"} noindex />
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <h1 className="text-2xl font-semibold mb-2">Page Not Found</h1>
            <p>The department you are looking for does not exist.</p>
          </div>
        </div>
      </>
    );
  }

  const statItems = [
    { label: "Products", value: stats.productCount ?? "--", icon: Package },
    { label: "Categories", value: stats.categoryCount ?? "--", icon: FolderOpen },
    { label: "Brands", value: stats.brandCount ?? "--", icon: Store },
  ];

  return (
    <>
      <Seo
        title={entityName}
        description={description}
        canonical={path}
        jsonLd={breadcrumb}
      />
      <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-3 md:px-4 pt-4">
          {/* Hero */}
          {isLoading || !department ? (
            <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 md:p-8 mb-8 animate-pulse">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-20 bg-gray-100 rounded-full" />
                  <div className="h-8 w-56 bg-gray-100 rounded-lg" />
                  <div className="h-4 w-full max-w-xl bg-gray-100 rounded" />
                </div>
              </div>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-2xl" />
                ))}
              </div>
            </div>
          ) : (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-50 via-white to-blue-50 border border-primary-100 shadow-sm mb-8"
            >
              <div className="relative px-5 md:px-8 py-8 md:py-12">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-white border border-gray-100 shadow-md flex items-center justify-center p-2 flex-shrink-0 overflow-hidden">
                    {department.image ? (
                      <AppImage
                        src={department.image}
                        alt={department.name}
                        className="w-full h-full object-cover"
                        priority
                        widths={[200, 400, 640]}
                        sizes="112px"
                      />
                    ) : (
                      <div
                        className={`w-full h-full rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center`}
                      >
                        <span className="text-3xl font-bold text-white">
                          {department.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary-600 bg-primary-50 border border-primary-100 rounded-full px-3 py-1 mb-2">
                      <Building2 className="w-3 h-3" />
                      Department
                    </span>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                      {department.name}
                    </h1>
                    {department.description && (
                      <p className="text-sm md:text-base text-gray-500 max-w-2xl leading-relaxed">
                        {department.description}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <button
                      onClick={scrollToProducts}
                      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Shop {department.name}
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {statItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 bg-white/70 backdrop-blur-sm border border-gray-100 rounded-2xl px-4 py-3 shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base md:text-lg font-bold text-gray-900 leading-tight truncate">
                          {item.value}
                        </p>
                        <p className="text-xs text-gray-400 font-medium">
                          {item.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
                  <FolderOpen className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Shop by Category
                  </h2>
                  <p className="text-xs text-gray-400">
                    Browse within {entityName}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {categories.map((cat: any) => (
                  <Link
                    key={cat.id}
                    to={`/categories/${cat.slug}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-medium text-gray-700"
                  >
                    <span
                      className={`w-6 h-6 rounded-lg bg-gradient-to-br ${
                        INITIAL_COLORS[
                          Math.abs(
                            ((cat.id ?? 1) - 1) % INITIAL_COLORS.length
                          )
                        ]
                      } flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0`}
                    >
                      {cat.name?.charAt(0).toUpperCase()}
                    </span>
                    {cat.name}
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          {/* Featured products */}
          {featuredProducts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Featured {entityName} Products
                  </h2>
                  <p className="text-xs text-gray-400">
                    Handpicked bestsellers from {entityName}
                  </p>
                </div>
              </div>
              <ProductCarousel products={featuredProducts} />
            </motion.section>
          )}
        </div>
      </div>

      {/* Shop the department */}
      <div id="shop-the-department" className="scroll-mt-4">
        <Products
          departmentSlug={slug}
          seoTitle={entityName}
          seoDescription={description}
          seoCanonical={path}
        />
      </div>
    </>
  );
}
