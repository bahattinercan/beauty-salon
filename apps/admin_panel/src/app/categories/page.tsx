"use client";

import { useEffect, useState } from "react";
import {
  Scissors,
  Brush,
  Sparkles,
  Palette,
  Zap,
  Flower,
  Edit2,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import PageHeader from "@/components/shell/PageHeader";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Badge from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea, Toggle } from "@/components/ui/Field";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { cx } from "@/lib/cx";

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

interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
}

// DB'deki iconName değerleri seed ile birebir eşleşiyor; UI ikonlarına map'lenir.
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

const EMPTY_FORM: CategoryFormData = {
  name: "",
  description: "",
  icon: "content_cut",
  isActive: true,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(EMPTY_FORM);

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

  const handleAddClick = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: formData.name,
      iconName: formData.icon,
      description: formData.description,
      isActive: formData.isActive,
    };
    try {
      if (editingId) {
        const res = await apiFetch<{ data: ApiCategory }>(`/categories/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
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
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return;
    try {
      await apiFetch(`/categories/${id}`, { method: "DELETE" });
      setCategories(categories.filter((cat) => cat.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kategori silinemedi");
    }
  };

  return (
    <>
      <PageHeader
        title="Kategori Yönetimi"
        subtitle={`${categories.length} kategori · ${categories.filter((c) => c.isActive).length} aktif`}
        actions={
          <Button size="sm" onClick={handleAddClick}>
            <Plus className="h-4 w-4" aria-hidden />
            Yeni kategori
          </Button>
        }
      />

      {error ? <ErrorState message={error} onRetry={loadCategories} /> : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <EmptyState
            title="Kategori yok"
            description="Hizmetlerin bağlanacağı kategorileri oluşturun."
            action={
              <Button size="sm" onClick={handleAddClick}>
                <Plus className="h-4 w-4" aria-hidden />
                İlk kategoriyi oluştur
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const Icon = getIcon(category.icon);
            return (
              <Card key={category.id} className="flex items-start gap-4 p-4 sm:p-5">
                {/* Mobil desen: dairesel ikon çipi. Pasif kategoride token'lı soluk yüzey. */}
                <span
                  className={cx(
                    "grid h-14 w-14 shrink-0 place-items-center rounded-pill",
                    category.isActive
                      ? "bg-primary/12 text-primary ring-2 ring-accent-lime"
                      : "bg-surface-variant text-fg-subtle"
                  )}
                  aria-hidden
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-display text-base font-bold text-fg">
                      {category.name}
                    </h3>
                    {category.isActive ? (
                      <Badge tone="success">Aktif</Badge>
                    ) : (
                      <Badge tone="neutral">Pasif</Badge>
                    )}
                  </div>
                  {category.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{category.description}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-fg-muted tnum">
                      {category.serviceCount} hizmet
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(category)}>
                        <Edit2 className="h-4 w-4" aria-hidden />
                        Düzenle
                      </Button>
                      <Button variant="danger" size="icon-sm" onClick={() => handleDelete(category.id)} aria-label="Kategoriyi sil">
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? "Kategoriyi düzenle" : "Yeni kategori"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Kategori adı" htmlFor="cat-name" required>
            <Input
              id="cat-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Örn. Saç"
              required
            />
          </Field>

          <Field label="Açıklama" htmlFor="cat-desc" hint="Müşteri uygulamasında kısa metin olarak görünür.">
            <Textarea
              id="cat-desc"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Field>

          <Field label="İkon" htmlFor="cat-icon">
            <Select
              id="cat-icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            >
              {iconOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex items-center justify-between gap-3 rounded-field border border-border bg-surface-variant p-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-fg">Aktif</p>
              <p className="text-xs text-fg-muted">Pasif kategori müşteri uygulamasında görünmez.</p>
            </div>
            <Toggle
              checked={formData.isActive}
              onChange={(next) => setFormData({ ...formData, isActive: next })}
              label="Kategori aktif"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
            <Button variant="ghost" size="sm" onClick={handleCloseModal}>
              Vazgeç
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {editingId ? "Kaydet" : "Oluştur"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
