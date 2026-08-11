import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Play, ChevronLeft, Package, AlertCircle } from "lucide-react";
import api from "@/api";
import { extractYouTubeId } from "@/utils/youtube";
import Seo from "@/components/seo/Seo";

export default function HowToUseVideo() {
  const { slug } = useParams();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const res = await api.get(`/products/slug/${slug}`);
      return res.data;
    },
  });

  const videoId = extractYouTubeId(product?.videoUrl);
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?rel=0&color=white`
    : null;

  return (
    <>
      <Seo
        noindex
        title={product ? `${product.name} - How to Use` : "How to Use"}
        description={
          product
            ? `Watch how to use ${product.name} with this step-by-step guide video.`
            : undefined
        }
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="container mx-auto px-4 py-6 md:py-10">
          <div className="max-w-4xl mx-auto">
            <Link
              to={product ? `/products/${product.slug}` : "/products"}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors mb-6"
            >
              <ChevronLeft className="h-4 w-4" />
              {product ? "Back to product" : "Back to products"}
            </Link>

            {isLoading && !product ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded-xl w-2/3 mb-6"></div>
                <div className="aspect-video bg-gray-200 rounded-3xl"></div>
              </div>
            ) : !product ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl flex items-center justify-center shadow-inner">
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Product not found
                </h2>
                <p className="text-gray-500 mb-6">
                  The product you're looking for doesn't exist or has been
                  removed.
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl font-semibold shadow-lg shadow-primary-600/30 hover:scale-105 transition-all"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
                    <Play className="h-5 w-5 text-white fill-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest">
                      How to Use
                    </p>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                      {product.name}
                    </h1>
                  </div>
                </div>

                {embedUrl ? (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="aspect-video bg-black">
                      <iframe
                        src={embedUrl}
                        title={`How to use ${product.name}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div className="p-5 flex items-start gap-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
                      <AlertCircle className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Watch this step-by-step guide to learn how to use{" "}
                        <span className="font-semibold text-gray-800">
                          {product.name}
                        </span>
                        . For more details, check the directions on the product
                        page.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-50 to-blue-50 rounded-3xl flex items-center justify-center shadow-inner">
                      <Play className="h-10 w-10 text-primary-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      No how-to video available yet
                    </h2>
                    <p className="text-gray-500 mb-6">
                      We're working on a video guide for this product. Please
                      check back soon.
                    </p>
                    <Link
                      to={`/products/${product.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl font-semibold shadow-lg shadow-primary-600/30 hover:scale-105 transition-all"
                    >
                      <Package className="h-5 w-5" />
                      View Product Details
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
