import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Newspaper, ArrowRight, ExternalLink } from "lucide-react";
import api from "@/api";

interface NewsArticle {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
}

function ArticleImage({ 
  src, 
  alt, 
  className
}: { 
  src?: string; 
  alt?: string; 
  className?: string;
}) {
  const hasImage = !!src;

  return (
    <div className={className}>
      {hasImage ? (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${className?.includes('group-hover') ? 'group-hover:scale-110 transition-transform duration-300' : ''}`}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            const fallback = (e.target as HTMLImageElement).parentElement?.querySelector('.img-fallback') as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      <div className={`img-fallback w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ${hasImage ? 'hidden' : ''}`}>
        <Newspaper className="w-1/3 h-1/3 text-white/50" />
      </div>
    </div>
  );
}

export default function NewsSection() {
  const { data: newsData, isLoading } = useQuery({
    queryKey: ["news", "latest"],
    queryFn: async () => {
      const response = await api.get("/news/latest");
      return response.data as { articles: NewsArticle[] };
    },
    staleTime: 1000 * 60 * 60,
  });

  const articles = newsData?.articles || [];

  if (isLoading || articles.length === 0) {
    return null;
  }

  const featuredArticle = articles[0];
  const listArticles = articles.slice(1, 5);

  return (
    <section className="py-10 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Newspaper className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Dental News & Updates</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Featured Article - Large Card */}
          <motion.a
            href={featuredArticle.link}
            target="_blank"
            rel="noopener noreferrer"
            className="lg:col-span-2 group relative overflow-hidden rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative aspect-[16/9] lg:aspect-[16/10] overflow-hidden rounded-2xl">
              <ArticleImage 
                src={featuredArticle.image} 
                alt={featuredArticle.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-6">
                <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full mb-3">
                  Featured
                </span>
                <h3 className="text-lg lg:text-xl font-bold text-white line-clamp-2 mb-2 group-hover:text-blue-200 transition-colors">
                  {featuredArticle.title}
                </h3>
                <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                  {featuredArticle.subtitle}
                </p>
                <div className="flex items-center gap-1 text-blue-300 text-sm font-medium">
                  <span>Read full article</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </motion.a>

          {/* Sidebar List */}
          <div className="flex flex-col gap-4">
            {listArticles.map((article, index) => (
              <motion.a
                key={article.id}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-4 p-3 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <ArticleImage 
                  src={article.image} 
                  alt=""
                  className="w-20 h-20 flex-shrink-0 rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h4>
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                    <ExternalLink className="w-3 h-3" />
                    <span>Read more</span>
                  </div>
                </div>
              </motion.a>
            ))}

            {/* View All Button */}
            <a
              href={listArticles[0]?.link || featuredArticle.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
            >
              <span>View All News</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}