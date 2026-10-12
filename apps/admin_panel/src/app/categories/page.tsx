"use client";

import { useState } from "react";
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

type IconType = "scissors" | "brush" | "sparkles" | "palette" | "zap" | "flower";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  serviceCount: number;
  isActive: boolean;
}

interface FormData {
  name: string;
  description: string;
  icon: IconType;
  isActive: boolean;
}

const mockCategories: Category[] = [
  {
    id: "1",
    name: "Saç",
    description: "Saç kesim, boyama ve şekillendirme hizmetleri",
    icon: "scissors",
    serviceCount: 12,
    isActive: true,
  },
  {
    id: "2",
    name: "Tırnak",
    description: "Manikür, pedikür ve nail art hizmetleri",
    icon: "brush",
    serviceCount: 8,
    isActive: true,
  },
  {
    id: "3",
    name: "Cilt Bakımı",
    description: "Cilt temizliği, bakım ve tedavi hizmetleri",
    icon: "sparkles",
    serviceCount: 15,
    isActive: true,
  },
  {
    id: "4",
    name: "Makyaj",
    description: "Profesyonel makyaj ve güzellik konsültasyonu",
    icon: "palette",
    serviceCount: 6,
    isActive: true,
  },
  {
    id: "5",
    name: "Epilasyon",
    description: "Vücut epilasyon ve hair removal hizmetleri",
    icon: "zap",
    serviceCount: 10,
    isActive: true,
  },
  {
    id: "6",
    name: "SPA",
    description: "Masaj, rahatlama ve wellness hizmetleri",
    icon: "flower",
    serviceCount: 9,
    isActive: false,
  },
];

const getIcon = (iconType: IconType) => {
  switch (iconType) {
    case "scissors":
      return Scissors;
    case "brush":
      return Brush;
    case "sparkles":
      return Sparkles;
    case "palette":
      return Palette;
    case "zap":
      return Zap;
    case "flower":
      return Flower;
    default:
      return Scissors;
  }
};

const iconOptions: { value: IconType; label: string }[] = [
  { value: "scissors", label: "Saç" },
  { value: "brush", label: "Tırnak" },
  { value: "sparkles", label: "Cilt Bakımı" },
  { value: "palette", label: "Makyaj" },
  { value: "zap", label: "Epilasyon" },
  { value: "flower", label: "SPA" },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    icon: "scissors",
    isActive: true,
  });

  // Open modal for creating new category
  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      icon: "scissors",
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
      icon: "scissors",
      isActive: true,
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      // Update existing category
      setCategories(
        categories.map((cat) =>
          cat.id === editingId
            ? { ...cat, ...formData }
            : cat
        )
      );
    } else {
      // Create new category
      const newCategory: Category = {
        id: Date.now().toString(),
        ...formData,
        serviceCount: 0,
      };
      setCategories([...categories, newCategory]);
    }

    handleCloseModal();
  };

  // Delete category
  const handleDelete = (id: string) => {
    if (confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) {
      setCategories(categories.filter((cat) => cat.id !== id));
    }
  };

  // Toggle active status
  const handleToggleActive = (id: string) => {
    setCategories(
      categories.map((cat) =>
        cat.id === id ? { ...cat, isActive: !cat.isActive } : cat
      )
    );
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

      {/* Categories Grid */}
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
                      icon: e.target.value as IconType,
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
