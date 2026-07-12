import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import toast from "react-hot-toast";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Image as ImageIcon,
  FolderOpen,
  ArrowLeft,
} from "lucide-react";

interface GalleryAlbum {
  id: number;
  title: string;
  slug?: string;
  description?: string;
  coverImage?: string;
  sortOrder: number;
  isActive: boolean;
  images?: GalleryImage[];
  createdAt: string;
  updatedAt: string;
}

interface GalleryImage {
  id: number;
  imageUrl: string;
  caption?: string;
  sortOrder: number;
  isActive: boolean;
  albumId: number;
  album?: GalleryAlbum;
  createdAt: string;
  updatedAt: string;
}

type Tab = "albums" | "images";

export default function AdminGallery() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("albums");
  const [search, setSearch] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);

  // Album modal state
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<GalleryAlbum | null>(null);
  const [albumFormData, setAlbumFormData] = useState({
    title: "",
    slug: "",
    description: "",
    coverImage: "",
    sortOrder: 0,
    isActive: true,
  });

  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [imageFormData, setImageFormData] = useState({
    imageUrl: "",
    caption: "",
    sortOrder: 0,
    isActive: true,
    albumId: 0,
  });

  // Delete modals
  const [deleteAlbumModal, setDeleteAlbumModal] = useState<{
    show: boolean;
    album: GalleryAlbum | null;
  }>({ show: false, album: null });
  const [deleteImageModal, setDeleteImageModal] = useState<{
    show: boolean;
    image: GalleryImage | null;
  }>({ show: false, image: null });

  // Queries
  const { data: albumsData, isLoading: albumsLoading } = useQuery({
    queryKey: ["admin-gallery-albums"],
    queryFn: async () => {
      const response = await api.get("/gallery/albums?active=false");
      return response.data;
    },
  });

  const { data: imagesData, isLoading: imagesLoading } = useQuery({
    queryKey: ["admin-gallery-images"],
    queryFn: async () => {
      const response = await api.get("/gallery/images?active=false");
      return response.data;
    },
  });

  const allAlbums: GalleryAlbum[] = Array.isArray(albumsData) ? albumsData : [];
  const allImages: GalleryImage[] = Array.isArray(imagesData) ? imagesData : [];

  const filteredAlbums = search
    ? allAlbums.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : allAlbums;

  const filteredImages = search
    ? allImages.filter(
        (i) =>
          i.caption?.toLowerCase().includes(search.toLowerCase()) ||
          i.imageUrl.toLowerCase().includes(search.toLowerCase()),
      )
    : allImages;

  const displayImages = selectedAlbum
    ? filteredImages.filter((i) => i.albumId === selectedAlbum.id)
    : filteredImages;

  // Album mutations
  const createAlbumMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post("/gallery/albums", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-albums"] });
      toast.success("Album created successfully");
      closeAlbumModal();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create album");
    },
  });

  const updateAlbumMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const response = await api.put(`/gallery/albums/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-albums"] });
      toast.success("Album updated successfully");
      closeAlbumModal();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update album");
    },
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/gallery/albums/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-albums"] });
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-images"] });
      toast.success("Album deleted successfully");
      setDeleteAlbumModal({ show: false, album: null });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete album");
      setDeleteAlbumModal({ show: false, album: null });
    },
  });

  // Image mutations
  const addImageMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post("/gallery/images", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-images"] });
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-albums"] });
      toast.success("Image added successfully");
      closeImageModal();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to add image");
    },
  });

  const updateImageMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const response = await api.put(`/gallery/images/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-images"] });
      toast.success("Image updated successfully");
      closeImageModal();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update image");
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/gallery/images/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-images"] });
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-albums"] });
      toast.success("Image deleted successfully");
      setDeleteImageModal({ show: false, image: null });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete image");
      setDeleteImageModal({ show: false, image: null });
    },
  });

  // Album helpers
  const openAlbumModal = (album?: GalleryAlbum) => {
    if (album) {
      setEditingAlbum(album);
      setAlbumFormData({
        title: album.title || "",
        slug: album.slug || "",
        description: album.description || "",
        coverImage: album.coverImage || "",
        sortOrder: album.sortOrder || 0,
        isActive: album.isActive ?? true,
      });
    } else {
      setEditingAlbum(null);
      setAlbumFormData({
        title: "",
        slug: "",
        description: "",
        coverImage: "",
        sortOrder: 0,
        isActive: true,
      });
    }
    setShowAlbumModal(true);
  };

  const closeAlbumModal = () => {
    setShowAlbumModal(false);
    setEditingAlbum(null);
  };

  const handleAlbumSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumFormData.title.trim()) {
      toast.error("Album title is required");
      return;
    }

    const payload = {
      title: albumFormData.title.trim(),
      slug: albumFormData.slug.trim() || albumFormData.title.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      description: albumFormData.description.trim() || undefined,
      coverImage: albumFormData.coverImage || undefined,
      sortOrder: albumFormData.sortOrder,
      isActive: albumFormData.isActive,
    };

    if (editingAlbum) {
      updateAlbumMutation.mutate({ id: editingAlbum.id, payload });
    } else {
      createAlbumMutation.mutate(payload);
    }
  };

  // Image helpers
  const openImageModal = (image?: GalleryImage) => {
    if (image) {
      setEditingImage(image);
      setImageFormData({
        imageUrl: image.imageUrl || "",
        caption: image.caption || "",
        sortOrder: image.sortOrder || 0,
        isActive: image.isActive ?? true,
        albumId: image.albumId || 0,
      });
    } else {
      setEditingImage(null);
      setImageFormData({
        imageUrl: "",
        caption: "",
        sortOrder: 0,
        isActive: true,
        albumId: selectedAlbum?.id || 0,
      });
    }
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setEditingImage(null);
  };

  const handleImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFormData.imageUrl) {
      toast.error("Image is required");
      return;
    }
    if (!imageFormData.albumId) {
      toast.error("Please select an album");
      return;
    }

    const payload = {
      imageUrl: imageFormData.imageUrl,
      caption: imageFormData.caption.trim() || undefined,
      sortOrder: imageFormData.sortOrder,
      isActive: imageFormData.isActive,
      albumId: imageFormData.albumId,
    };

    if (editingImage) {
      updateImageMutation.mutate({ id: editingImage.id, payload });
    } else {
      addImageMutation.mutate(payload);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage photo albums and images
          </p>
        </div>
        <div className="flex gap-2">
          {tab === "albums" ? (
            <button
              onClick={() => openAlbumModal()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-5 h-5" />
              Add Album
            </button>
          ) : (
            <button
              onClick={() => openImageModal()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-5 h-5" />
              Add Image
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => { setTab("albums"); setSelectedAlbum(null); setSearch(""); }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "albums"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FolderOpen className="w-4 h-4 inline mr-2" />
          Albums ({allAlbums.length})
        </button>
        <button
          onClick={() => { setTab("images"); setSearch(""); }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "images"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <ImageIcon className="w-4 h-4 inline mr-2" />
          Images ({allImages.length})
        </button>
      </div>

      {/* Albums Tab */}
      {tab === "albums" && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search albums..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {albumsLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : filteredAlbums.length === 0 ? (
            <div className="p-8 text-center">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No albums found</p>
              <button
                onClick={() => openAlbumModal()}
                className="mt-4 text-primary-600 hover:text-primary-700"
              >
                Create your first album
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredAlbums.map((album) => (
                <div
                  key={album.id}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video bg-gray-100 relative">
                    {album.coverImage ? (
                      <img
                        src={album.coverImage}
                        alt={album.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/400x225?text=No+Cover";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FolderOpen className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                    <span
                      className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full ${
                        album.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {album.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900">{album.title}</h3>
                    {album.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {album.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {album.images?.length || 0} images
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <button
                        onClick={() => {
                          setSelectedAlbum(album);
                          setTab("images");
                        }}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        View Images
                      </button>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openAlbumModal(album)}
                          className="p-1.5 text-gray-400 hover:text-primary-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteAlbumModal({ show: true, album })
                          }
                          className="p-1.5 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Images Tab */}
      {tab === "images" && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center gap-4">
            {selectedAlbum && (
              <button
                onClick={() => setSelectedAlbum(null)}
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
              >
                <ArrowLeft className="w-4 h-4" />
                All Images
              </button>
            )}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search images..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {imagesLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : displayImages.length === 0 ? (
            <div className="p-8 text-center">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {selectedAlbum
                  ? "No images in this album"
                  : "No images found"}
              </p>
              <button
                onClick={() => openImageModal()}
                className="mt-4 text-primary-600 hover:text-primary-700"
              >
                Add your first image
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {displayImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img
                    src={image.imageUrl}
                    alt={image.caption || "Gallery image"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/300x300?text=No+Image";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    {image.caption && (
                      <p className="text-white text-xs truncate">
                        {image.caption}
                      </p>
                    )}
                    <p className="text-white/70 text-xs">
                      {allAlbums.find((a) => a.id === image.albumId)?.title || "Unknown album"}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openImageModal(image)}
                      className="p-1.5 bg-white/90 rounded-md text-gray-600 hover:text-primary-600"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteImageModal({ show: true, image })
                      }
                      className="p-1.5 bg-white/90 rounded-md text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span
                    className={`absolute top-2 left-2 px-1.5 py-0.5 text-[10px] rounded-full ${
                      image.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {image.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Album Create/Edit Modal */}
      {showAlbumModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingAlbum ? "Edit Album" : "Add Album"}
              </h2>
              <button
                onClick={closeAlbumModal}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAlbumSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={albumFormData.title}
                  onChange={(e) =>
                    setAlbumFormData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="e.g. Our Office, Team Photos"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={albumFormData.description}
                  onChange={(e) =>
                    setAlbumFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of this album"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <ImageUpload
                label="Cover Image"
                value={albumFormData.coverImage}
                onChange={(url) =>
                  setAlbumFormData((prev) => ({
                    ...prev,
                    coverImage: url || "",
                  }))
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={albumFormData.sortOrder}
                    onChange={(e) =>
                      setAlbumFormData((prev) => ({
                        ...prev,
                        sortOrder: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={albumFormData.isActive ? "true" : "false"}
                    onChange={(e) =>
                      setAlbumFormData((prev) => ({
                        ...prev,
                        isActive: e.target.value === "true",
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeAlbumModal}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createAlbumMutation.isPending || updateAlbumMutation.isPending
                  }
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {createAlbumMutation.isPending || updateAlbumMutation.isPending
                    ? "Saving..."
                    : editingAlbum
                      ? "Update"
                      : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Create/Edit Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingImage ? "Edit Image" : "Add Image"}
              </h2>
              <button
                onClick={closeImageModal}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleImageSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Album <span className="text-red-500">*</span>
                </label>
                <select
                  value={imageFormData.albumId}
                  onChange={(e) =>
                    setImageFormData((prev) => ({
                      ...prev,
                      albumId: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value={0}>Select an album</option>
                  {allAlbums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.title}
                    </option>
                  ))}
                </select>
              </div>

              <ImageUpload
                label="Image *"
                value={imageFormData.imageUrl}
                onChange={(url) =>
                  setImageFormData((prev) => ({
                    ...prev,
                    imageUrl: url || "",
                  }))
                }
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caption
                </label>
                <input
                  type="text"
                  value={imageFormData.caption}
                  onChange={(e) =>
                    setImageFormData((prev) => ({
                      ...prev,
                      caption: e.target.value,
                    }))
                  }
                  placeholder="Optional caption for this image"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={imageFormData.sortOrder}
                    onChange={(e) =>
                      setImageFormData((prev) => ({
                        ...prev,
                        sortOrder: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={imageFormData.isActive ? "true" : "false"}
                    onChange={(e) =>
                      setImageFormData((prev) => ({
                        ...prev,
                        isActive: e.target.value === "true",
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeImageModal}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    addImageMutation.isPending || updateImageMutation.isPending
                  }
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {addImageMutation.isPending || updateImageMutation.isPending
                    ? "Saving..."
                    : editingImage
                      ? "Update"
                      : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Album Confirmation */}
      {deleteAlbumModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Delete Album</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "
              <span className="font-medium">{deleteAlbumModal.album?.title}</span>
              "? All images in this album will also be deleted. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteAlbumModal({ show: false, album: null })}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteAlbumModal.album &&
                  deleteAlbumMutation.mutate(deleteAlbumModal.album.id)
                }
                disabled={deleteAlbumMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteAlbumMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Image Confirmation */}
      {deleteImageModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Delete Image</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this image? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteImageModal({ show: false, image: null })}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteImageModal.image &&
                  deleteImageMutation.mutate(deleteImageModal.image.id)
                }
                disabled={deleteImageMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteImageMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
