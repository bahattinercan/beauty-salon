"use client";

import { useEffect, useState } from "react";
import {
  Scissors,
  Brush,
  Sparkles,
  Palette,
  Zap,
  Flower,
  X,
  Edit2,
  Trash2,
  Plus,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ApiCategory {
  id: string;
  name: string;
  iconName: string;
  description?: string | null;
  isActive?: boolean;
  serviceCount?: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  serviceCount: number;
  isActive: boolean;
}

interface FormData {
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
}

// DB'deki iconName değerleri (content_cut, face, spa, self_improvement...)
// seed'daki isimlerle birebir eşleşiyor; UI ikonlarına map'leniyor.
const ICON_MAP: Record<string, typeof Scissors> = {
  scissors: Scissors,
  content_cut: Scissors,
  brush: Brush,
  sparkles: Sparkles,
  face: Sparkles,
  palette: Palette,
  zap: Zap,
  flower: Flower,
  spa: Flower,
  self_improvement: Zap,
};

const getIcon = (iconName: string) => ICON_MAP[iconName] ?? Scissors;

const iconOptions: { value: string; label: string }[] = [
  { value: "content_cut", label: "Saç" },
  { value: "brush", label: "Tırnak" },
  { value: "face", label: "Cilt Bakımı" },
  { value: "palette", label: "Makyaj" },
  { value: "spa", label: "Epilasyon" },
  { value: "self_improvement", label: "SPA & Masaj" },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: ApiCategory[] }>("/categories");
      setCategories(
        res.data.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description ?? "",
          icon: c.iconName ?? "scissors",
          serviceCount: c.serviceCount ?? 0,
          isActive: c.isActive ?? true,
        }))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kategoriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    icon: "content_cut",
    isActive: true,
  });

  // Open modal for creating new category
  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      icon: "content_cut",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open modal for editing category
  const handleEditClick = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      isActive: category.isActive,
    });
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      icon: "content_cut",
      isActive: true,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      iconName: formData.icon,
      description: formData.description,
      isActive: formData.isActive,
    };

    try {
      if (editingId) {
        const res = await apiFetch<{ data: ApiCategory }>(
          `/categories/${editingId}`,
          { method: "PATCH", body: JSON.stringify(payload) }
        );
        setCategories(
          categories.map((cat) =>
            cat.id === editingId
              ? {
                  ...cat,
                  name: res.data.name,
                  description: res.data.description ?? "",
                  icon: res.data.iconName ?? cat.icon,
                  isActive: res.data.isActive ?? cat.isActive,
                }
              : cat
          )
        );
      } else {
        const res = await apiFetch<{ data: ApiCategory }>("/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setCategories([
          ...categories,
          {
            id: res.data.id,
            name: res.data.name,
            description: res.data.description ?? "",
            icon: res.data.iconName ?? "scissors",
            serviceCount: res.data.serviceCount ?? 0,
            isActive: res.data.isActive ?? true,
          },
        ]);
      }
      handleCloseModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kategori kaydedilemedi");
    }
  };

  // Delete category
  const handleDelete = async (id: string) => {
    if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return;
    try {
      await apiFetch(`/categories/${id}`, { method: "DELETE" });
      setCategories(categories.filter((cat) => cat.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kategori silinemedi");
    }
  };

  // Toggle active status
  const handleToggleActive = async (id: string) => {
    const current = categories.find((cat) => cat.id === id);
    try {
      const res = await apiFetch<{ data: ApiCategory }>(`/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !current?.isActive }),
      });
      setCategories(
        categories.map((cat) =>
          cat.id === id ? { ...cat, isActive: res.data.isActive ?? !cat.isActive } : cat
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Durum güncellenemedi");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-4xl font-bold text-primary">Kategori Yönetimi</h1>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold"
        >
          <Plus className="w-5 h-5" />
          Kategori Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-text-secondary text-sm font-medium mb-2">
            Toplam Kategori
          </p>
          <p className="text-4xl font-bold text-primary">{categories.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-text-secondary text-sm font-medium mb-2">
            Aktif Kategoriler
          </p>
          <p className="text-4xl font-bold text-success">
            {categories.filter((c) => c.isActive).length}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
          <button
            onClick={loadCategories}
            className="ml-3 underline font-medium"
          >
            Tekrar dene
          </button>
        </div>
      )}

      {/* Categories Grid */}
      {loading ? (
        <p className="text-text-secondary">Kategoriler yükleniyor…</p>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const IconComponent = getIcon(category.icon);
          return (
            <div
              key={category.id}
              className={`bg-white border-2 rounded-lg p-6 transition-all ${
                category.isActive
                  ? "border-secondary shadow-sm hover:shadow-md"
                  : "border-gray-200 opacity-60"
              }`}
            >
              {/* Icon & Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <IconComponent className="w-6 h-6 text-primary" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(category)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Category Name */}
              <h3 className="text-xl font-bold text-text-primary mb-2">
                {category.name}
              </h3>

              {/* Description */}
              <p className="text-text-secondary text-sm mb-4">
                {category.description}
              </p>

              {/* Service Count Badge */}
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-block px-3 py-1 bg-info/10 text-info text-xs font-semibold rounded-full">
                  {category.serviceCount} Hizmet
                </span>
              </div>

              {/* Active/Inactive Toggle */}
              <button
                onClick={() => handleToggleActive(category.id)}
                className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                  category.isActive
                    ? "bg-success/10 text-success border border-success/30"
                    : "bg-error/10 text-error border border-error/30"
                }`}
              >
                {category.isActive ? "Aktif" : "Pasif"}
              </button>
            </div>
          );
        })}
      </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-text-primary">
                {editingId ? "Kategori Düzenle" : "Kategori Ekle"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Kategori Adı
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Kategori adını girin"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Kategori açıklamasını girin"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  required
                />
              </div>

              {/* Icon Select */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  İkon
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      icon: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  {iconOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 p-3 bg-surface-variant rounded-lg">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded cursor-pointer accent-primary"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-text-primary cursor-pointer flex-1">
                  Aktif Kategorisi
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-200 text-text-primary rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold"
                >
                  {editingId ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
