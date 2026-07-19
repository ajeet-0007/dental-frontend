import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/api";
import { ArrowLeft, X, ChevronLeft, ChevronRight, FolderOpen, Image as ImageIcon } from "lucide-react";

interface GalleryAlbum {
  id: number;
  title: string;
  slug?: string;
  description?: string;
  coverImage?: string;
  sortOrder: number;
  isActive: boolean;
  images?: GalleryImage[];
}

interface GalleryImage {
  id: number;
  imageUrl: string;
  caption?: string;
  sortOrder: number;
  albumId: number;
}

export default function GalleryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: albumsData, isLoading: albumsLoading } = useQuery({
    queryKey: ["gallery-albums"],
    queryFn: async () => {
      const response = await api.get("/gallery/albums");
      return response.data;
    },
    enabled: !slug,
  });

  const { data: albumData, isLoading: albumLoading } = useQuery({
    queryKey: ["gallery-album", slug],
    queryFn: async () => {
      const response = await api.get(`/gallery/albums/${slug}`);
      return response.data;
    },
    enabled: !!slug,
  });

  const albums: GalleryAlbum[] = Array.isArray(albumsData) ? albumsData : [];
  const currentAlbum: GalleryAlbum | null = albumData || null;
  const images: GalleryImage[] = currentAlbum?.images || [];

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % images.length);
    }
  };

  const goPrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
    }
  };

  // Album view
  if (slug) {
    if (albumLoading) {
      return (
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      );
    }

    if (!currentAlbum) {
      return (
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Album not found</h1>
            <Link to="/gallery" className="text-primary-600 hover:text-primary-700">
              Back to Gallery
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Gallery
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{currentAlbum.title}</h1>
            {currentAlbum.description && (
              <p className="text-gray-500 mt-2">{currentAlbum.description}</p>
            )}
          </div>

          {images.length === 0 ? (
            <div className="text-center py-16">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No images in this album yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group cursor-pointer"
                  onClick={() => openLightbox(index)}
                >
                  <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={image.imageUrl}
                      alt={image.caption || currentAlbum.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  {image.caption && (
                    <p className="text-sm text-gray-600 mt-2 truncate">{image.caption}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
              onClick={closeLightbox}
            >
              <button
                  onClick={closeLightbox}
                  className="absolute top-4 right-4 text-white/70 hover:text-white z-10 p-2"
                  title="Close"
                >
                  <X className="w-6 h-6" />
                </button>

              {images.length > 1 && (
                <>
                  <button
                      onClick={(e) => { e.stopPropagation(); goPrev(); }}
                      className="absolute left-4 text-white/70 hover:text-white z-10 p-2 bg-white/10 rounded-full"
                      title="Previous image"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  <button
                      onClick={(e) => { e.stopPropagation(); goNext(); }}
                      className="absolute right-4 text-white/70 hover:text-white z-10 p-2 bg-white/10 rounded-full"
                      title="Next image"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                </>
              )}

              <motion.div
                key={lightboxIndex}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-[90vw] max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={images[lightboxIndex].imageUrl}
                  alt={images[lightboxIndex].caption || currentAlbum.title}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
                {images[lightboxIndex].caption && (
                  <p className="text-white text-center mt-4 text-sm">
                    {images[lightboxIndex].caption}
                  </p>
                )}
                <p className="text-white/50 text-center mt-2 text-xs">
                  {lightboxIndex + 1} / {images.length}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Albums grid view
  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gallery</h1>
          <p className="text-gray-500 mt-2">Explore our photo albums</p>
        </div>

        {albumsLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No albums available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album, index) => (
              <motion.div
                key={album.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/gallery/${album.slug}`}
                  className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    {album.coverImage ? (
                      <img
                        src={album.coverImage}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FolderOpen className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {album.title}
                    </h2>
                    {album.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {album.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {album.images?.length || 0} photos
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
