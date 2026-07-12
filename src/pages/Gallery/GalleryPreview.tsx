import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "@/api";
import { Camera } from "lucide-react";

interface GalleryAlbum {
  id: number;
  title: string;
  slug?: string;
  description?: string;
  coverImage?: string;
  images?: any[];
}

export default function GalleryPreview() {
  const { data: albumsData } = useQuery({
    queryKey: ["gallery-albums-preview"],
    queryFn: async () => {
      const response = await api.get("/gallery/albums");
      return response.data;
    },
  });

  const albums: GalleryAlbum[] = Array.isArray(albumsData) ? albumsData : [];

  if (albums.length === 0) return null;

  return (
    <section className="py-6 md:py-8 lg:py-10">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Our Story</p>
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Gallery</h2>
            </div>
          </div>
          <Link
            to="/gallery"
            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors group"
          >
            <span>View All</span>
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {albums.slice(0, 6).map((album, index) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/gallery/${album.slug}`}
                className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
              >
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  {album.coverImage ? (
                    <img
                      src={album.coverImage}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Camera className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm md:text-base text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                    {album.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {album.images?.length || 0} photos
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
