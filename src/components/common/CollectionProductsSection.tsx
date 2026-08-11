import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";
import ProductCarousel from "./ProductCarousel";

interface CollectionItem {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  image?: string;
}

interface CollectionSection {
  item: CollectionItem;
  products: any[];
}

interface CollectionProductsSectionProps {
  sections: CollectionSection[];
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconGradient: string;
  itemLink: (item: CollectionItem) => string;
  viewAllLink: string;
  onOpenCartDrawer?: (product: any) => void;
}

const GRADIENTS = [
  "from-primary-700 to-primary-400",
  "from-primary-800 to-primary-500",
  "from-blue-700 to-sky-400",
  "from-sky-700 to-primary-500",
  "from-cyan-700 to-primary-400",
  "from-primary-600 to-sky-500",
  "from-blue-800 to-primary-400",
  "from-sky-800 to-primary-500",
];

const TEXT_SHADOWS = [
  "shadow-primary-700/30",
  "shadow-primary-800/30",
  "shadow-blue-700/30",
  "shadow-sky-700/30",
  "shadow-cyan-700/30",
  "shadow-primary-600/30",
  "shadow-blue-800/30",
  "shadow-sky-800/30",
];

export default function CollectionProductsSection({
  sections,
  title,
  subtitle,
  icon,
  iconGradient,
  itemLink,
  viewAllLink,
  onOpenCartDrawer,
}: CollectionProductsSectionProps) {
  if (!sections || sections.length === 0) return null;

  return (
    <section className="py-8 md:py-12 lg:py-14 bg-gradient-to-b from-white via-gray-50/80 to-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 bg-gradient-to-br ${iconGradient} rounded-xl flex items-center justify-center shadow-lg`}
            >
              {icon}
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">
                {subtitle}
              </p>
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
                {title}
              </h2>
            </div>
          </div>
          <Link
            to={viewAllLink}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors group"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="space-y-8 md:space-y-10">
          {sections.map((section, index) => {
            const colorIndex = Math.abs(section.item.id - 1) % GRADIENTS.length;
            const gradientClass = GRADIENTS[colorIndex];
            const shadowClass = TEXT_SHADOWS[colorIndex];
            const thumb = section.item.logo || section.item.image;

            return (
              <motion.div
                key={section.item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 bg-white">
                  <div className={`relative bg-gradient-to-r ${gradientClass} px-4 md:px-6 py-4 md:py-5`}>
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        {thumb ? (
                          <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-xl p-1.5 shadow-md flex items-center justify-center shrink-0">
                            <img
                              src={thumb}
                              alt={section.item.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur rounded-xl shadow-md flex items-center justify-center shrink-0">
                            <span className="text-xl md:text-2xl font-bold text-white">
                              {section.item.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-white font-bold text-base md:text-xl truncate">
                            {section.item.name}
                          </h3>
                          <p className="text-white/80 text-xs md:text-sm mt-0.5 flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />
                            {section.products.length} products
                          </p>
                        </div>
                      </div>
                      <Link
                        to={itemLink(section.item)}
                        className={`shrink-0 inline-flex items-center gap-1.5 bg-white text-gray-900 text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-full shadow-lg ${shadowClass} hover:scale-105 active:scale-95 transition-transform`}
                      >
                        Shop Now
                        <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="p-3 md:p-4">
                    <ProductCarousel
                      products={section.products}
                      onOpenCartDrawer={onOpenCartDrawer}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
