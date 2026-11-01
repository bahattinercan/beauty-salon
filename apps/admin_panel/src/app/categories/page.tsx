"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  Search,
  Video,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import PageHeader from "@/components/shell/PageHeader";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Dialog from "@/components/ui/Dialog";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import Pagination from "@/components/ui/Pagination";
import FilterBar from "@/components/ui/FilterBar";
import FilterChips from "@/components/ui/FilterChips";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea, Toggle } from "@/components/ui/Field";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import ImageField from "@/components/salons/ImageField";
import VideoField from "@/components/categories/VideoField";
import { cx } from "@/lib/cx";
import {
  CATEGORIES_PAGE_SIZES,
  CATEGORY_MEDIA_FILTERS,
  CATEGORY_MEDIA_FILTER_LABEL_KEYS,
  CATEGORY_SORT_OPTIONS,
  CATEGORY_STATUS_FILTERS,
  CATEGORY_STATUS_FILTER_LABEL_KEYS,
  DEFAULT_CATEGORIES_QUERY,
  PAGE_SIZE_STORAGE_KEY,
  activeChips,
  buildCategoriesQuery,
  filterCategories,
  hasActiveFilters,
  normalizeQuery,
  paginateCategories,
  parseCategoriesQuery,
  sortCategories,
  type CategoriesQueryState,
  type CategoryRow,
  type CategoryStatusFilter,
  type CategoryView,
} from "@/lib/categoriesQuery";
import { useI18n } from "@/providers/LocaleProvider";

interface ApiCategory {
  id: string;
  name: string;
  iconName: string;
  description?: string | null;
  isActive?: boolean;
  serviceCount?: number;
  imageUrl?: string | null;
  videoUrl?: string | null;
  /** Sıralama meta'sı: `sortCategories` bu alanları satırda arar. */
  sortOrder?: number;
  createdAt?: string;
}

/**
 * `CategoryRow` + sıralama meta'sı. `sortOrder`/`createdAt` `CategoryRow`
 * sözleşmesinde yok; satıra eklenmezse "Sıra (varsayılan)" ve "En yeni"
 * karşılaştırması 0 döner (bkz. `lib/categoriesQuery.ts` → `sortCategories`).
 */
type CategoryListRow = CategoryRow & { sortOrder?: number; createdAt?: string };

interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  imageUrl: string | null;
  videoUrl: string | null;
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

const iconOptions: { value: string; labelKey: string }[] = [
  { value: "content_cut", labelKey: "categories.icons.hair" },
  { value: "brush", labelKey: "categories.icons.nail" },
  { value: "face", labelKey: "categories.icons.skin" },
  { value: "palette", labelKey: "categories.icons.makeup" },
  { value: "spa", labelKey: "categories.icons.epilation" },
  { value: "self_improvement", labelKey: "categories.icons.spa" },
];

const EMPTY_FORM: CategoryFormData = {
  name: "",
  description: "",
  icon: "content_cut",
  isActive: true,
  imageUrl: null,
  videoUrl: null,
};

/**
 * Yüklenen yol göreldir (`/uploads/<uuid>.png`) ve API tarafından servis edilir;
 * panel ayrı origin'de çalıştığı için (dev: 3001) onu API origin'ine tamamlamak
 * gerekir (`ImageField`/`VideoField` ile aynı kural).
 */
function mediaUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1").replace(
    /\/api\/v1\/?$/,
    ""
  );
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** Boş/boşluklu medya yolu = "yok" → API'ye `null` gider (PATCH'te alanı temizler). */
function toMediaValue(value: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

function hasMedia(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim() !== "";
}

function mapCategory(category: ApiCategory): CategoryListRow {
  return {
    id: category.id,
    name: category.name,
    description: category.description ?? null,
    icon: category.iconName ?? "scissors",
    serviceCount: category.serviceCount ?? 0,
    isActive: category.isActive ?? true,
    imageUrl: category.imageUrl ?? null,
    videoUrl: category.videoUrl ?? null,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt,
  };
}

export default function CategoriesPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [query, setQuery] = useState<CategoriesQueryState>(DEFAULT_CATEGORIES_QUERY);
  const [hydrated, setHydrated] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [rows, setRows] = useState<CategoryListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(EMPTY_FORM);

  /**
   * İlk açılış: durum URL'den okunur (deep-link), sayfa boyutu tercihi
   * localStorage'dan gelir — URL'de açık `limit` varsa o kazanır. `salons/page.tsx`
   * deseni: `useSearchParams` statik prerender'da Suspense sınırı zorunlu kıldığı
   * için `window.location.search` kullanılır.
   */
  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.push("/login");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const fromUrl = parseCategoriesQuery(window.location.search);
    const stored = Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
    const limit = params.has("limit")
      ? fromUrl.limit
      : CATEGORIES_PAGE_SIZES.includes(stored)
        ? stored
        : fromUrl.limit;

    setQuery(normalizeQuery({ ...fromUrl, limit }));
    setHydrated(true);
  }, [router]);

  /** GET /categories tüm listeyi döndürür; filtreleme/sayfalama istemci tarafında. */
  const fetchCategories = useCallback(
    async (signal: AbortSignal) => {
      try {
        setError(null);
        setLoading(true);
        const res = await apiFetch<{ data: ApiCategory[] }>("/categories", { signal });
        if (signal.aborted) return;
        setRows(res.data.map(mapCategory));
      } catch (err) {
        if (signal.aborted) return;
        const message = err instanceof Error ? err.message : t("categories.notice.loadError");
        if (message.includes("401") || message.includes("403")) {
          router.push("/login");
          return;
        }
        setError(message);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [router, t]
  );

  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    void fetchCategories(controller.signal);
    return () => controller.abort();
  }, [fetchCategories, hydrated, reloadKey]);

  /**
   * Tek kaynak `query` → URL. İlk render yazmaz (URL zaten okunuyor), sonra her
   * değişiklik `router.replace` ile yazılır (`scroll: false`).
   */
  const lastWrittenQuery = useRef<string | null>(null);
  useEffect(() => {
    const next = buildCategoriesQuery(query);
    if (lastWrittenQuery.current === null) {
      lastWrittenQuery.current = next;
      return;
    }
    if (lastWrittenQuery.current === next) return;
    lastWrittenQuery.current = next;
    router.replace(next ? `/categories?${next}` : "/categories", { scroll: false });
  }, [query, router]);

  /** Filtre değişimi sayfayı 1'e döndürür; sayfa değişimi açıkça `page` verir. */
  const updateFilter = useCallback((patch: Partial<CategoriesQueryState>) => {
    setQuery((prev) => normalizeQuery({ ...prev, ...patch, page: patch.page ?? 1 }));
  }, []);

  /** Temizle: arama/durum/medya/ikon/sıralama varsayılana döner; limit ve görünüm korunur. */
  const clearFilters = useCallback(() => {
    setQuery((prev) =>
      normalizeQuery({ ...DEFAULT_CATEGORIES_QUERY, limit: prev.limit, view: prev.view })
    );
  }, []);

  const changePageSize = (size: number) => {
    localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(size));
    updateFilter({ limit: size });
  };

  const counts = useMemo<Record<CategoryStatusFilter, number>>(
    () => ({
      tümü: rows.length,
      aktif: rows.filter((row) => row.isActive).length,
      pasif: rows.filter((row) => !row.isActive).length,
    }),
    [rows]
  );

  const filtered = useMemo(
    () => sortCategories(filterCategories(rows, query), query),
    [rows, query]
  );
  const paged = useMemo(() => paginateCategories(filtered, query), [filtered, query]);

  // Aralık dışı sayfa (silme/derin bağlantı sonrası) en yakın geçerli sayfaya kırpılır.
  useEffect(() => {
    if (!hydrated || loading) return;
    if (paged.page !== query.page) {
      setQuery((prev) => normalizeQuery({ ...prev, page: paged.page }));
    }
  }, [hydrated, loading, paged.page, query.page]);

  const filtersActive = hasActiveFilters(query);
  const noRowsAtAll = rows.length === 0;

  /** Filtre select'i, veride geçen ama `iconOptions`'ta olmayan ikonları da listeler. */
  const iconChoices = useMemo(() => {
    const known = new Set(iconOptions.map((option) => option.value));
    const extras = Array.from(new Set(rows.map((row) => row.icon))).filter(
      (icon) => icon !== "" && !known.has(icon)
    );
    return [...iconOptions, ...extras.map((icon) => ({ value: icon, labelKey: icon }))];
  }, [rows]);

  const handleAddClick = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const handleEditClick = (category: CategoryListRow) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description ?? "",
      icon: category.icon,
      isActive: category.isActive,
      imageUrl: category.imageUrl ?? null,
      videoUrl: category.videoUrl ?? null,
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
    setError(null);
    const payload = {
      name: formData.name,
      iconName: formData.icon,
      description: formData.description,
      isActive: formData.isActive,
      imageUrl: toMediaValue(formData.imageUrl),
      videoUrl: toMediaValue(formData.videoUrl),
    };
    try {
      if (editingId) {
        const res = await apiFetch<{ data: ApiCategory }>(`/categories/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setRows((prev) =>
          prev.map((row) =>
            row.id === editingId
              ? // PATCH yanıtı `serviceCount` taşımıyor: mevcut sayaç korunur.
                { ...mapCategory(res.data), serviceCount: row.serviceCount }
              : row
          )
        );
      } else {
        const res = await apiFetch<{ data: ApiCategory }>("/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setRows((prev) => [...prev, mapCategory(res.data)]);
      }
      handleCloseModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("categories.notice.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("categories.confirm.delete"))) return;
    try {
      setError(null);
      await apiFetch(`/categories/${id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("categories.notice.deleteError"));
    }
  };

  const rowActions = (category: CategoryListRow) => (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => handleEditClick(category)}>
        <Edit2 className="h-4 w-4" aria-hidden />
        {t("categories.actions.edit")}
      </Button>
      <Button
        variant="danger"
        size="icon-sm"
        onClick={() => void handleDelete(category.id)}
        aria-label={t("categories.actions.delete")}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );

  const columns: Column<CategoryListRow>[] = [
    {
      key: "name",
      header: t("categories.columns.name"),
      mobile: "primary",
      cell: (category) => {
        const Icon = getIcon(category.icon);
        return (
          <div className="flex items-center gap-3">
            {/* Kartlardaki dairesel ikon çipi — tabloda aynı görsel dil korunur. */}
            <span
              className={cx(
                "grid h-9 w-9 shrink-0 place-items-center rounded-pill",
                category.isActive
                  ? "bg-primary/12 text-primary ring-2 ring-accent-lime"
                  : "bg-surface-variant text-fg-subtle"
              )}
              aria-hidden
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="truncate font-semibold text-fg">{category.name}</span>
          </div>
        );
      },
    },
    {
      key: "description",
      header: t("categories.columns.description"),
      block: true,
      cell: (category) =>
        category.description ? (
          <span className="line-clamp-2 text-fg-muted">{category.description}</span>
        ) : (
          <span className="text-fg-muted">—</span>
        ),
    },
    {
      key: "media",
      header: t("categories.columns.media"),
      cell: (category) => {
        const image = hasMedia(category.imageUrl) ? category.imageUrl : null;
        const video = hasMedia(category.videoUrl);
        if (!image && !video) return <span className="text-fg-muted">—</span>;
        return (
          <div className="flex items-center gap-2">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element -- API göreli /uploads yolu veriyor; next/image konfigürasyonu kapsam dışı
              <img
                src={mediaUrl(image)}
                alt=""
                className="h-10 w-10 shrink-0 rounded-field object-cover"
              />
            ) : null}
            {video ? (
              <Badge tone="neutral">
                <Video className="h-3.5 w-3.5" aria-hidden />
                {t("categories.cells.video")}
              </Badge>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "serviceCount",
      header: t("categories.columns.serviceCount"),
      align: "right",
      cell: (category) => (
        <span className="tnum font-semibold text-fg">{category.serviceCount}</span>
      ),
    },
    {
      key: "status",
      header: t("categories.columns.status"),
      cell: (category) =>
        category.isActive ? (
          <Badge tone="success">{t("categories.statusFilter.active")}</Badge>
        ) : (
          <Badge tone="neutral">{t("categories.statusFilter.passive")}</Badge>
        ),
    },
    {
      key: "actions",
      header: t("categories.columns.actions"),
      align: "right",
      mobile: false,
      cell: (category) => rowActions(category),
    },
  ];

  const createButton = (
    <Button size="sm" onClick={handleAddClick}>
      <Plus className="h-4 w-4" aria-hidden />
      {t("categories.empty.createFirst")}
    </Button>
  );

  const cardGrid = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {paged.rows.map((category) => {
        const Icon = getIcon(category.icon);
        const image = hasMedia(category.imageUrl) ? category.imageUrl : null;
        const video = hasMedia(category.videoUrl);
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
                  <Badge tone="success">{t("categories.statusFilter.active")}</Badge>
                ) : (
                  <Badge tone="neutral">{t("categories.statusFilter.passive")}</Badge>
                )}
                {video ? (
                  <Badge tone="neutral">
                    <Video className="h-3.5 w-3.5" aria-hidden />
                    {t("categories.cells.video")}
                  </Badge>
                ) : null}
              </div>
              {category.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{category.description}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="tnum text-xs font-semibold text-fg-muted">
                  {t("categories.card.serviceCount", { count: category.serviceCount })}
                </span>
                <div className="flex items-center gap-2">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- API göreli /uploads yolu veriyor; next/image konfigürasyonu kapsam dışı
                    <img
                      src={mediaUrl(image)}
                      alt={t("categories.card.imageAlt", { name: category.name })}
                      className="h-10 w-10 rounded-field object-cover"
                    />
                  ) : null}
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(category)}>
                    <Edit2 className="h-4 w-4" aria-hidden />
                    {t("categories.actions.edit")}
                  </Button>
                  <Button
                    variant="danger"
                    size="icon-sm"
                    onClick={() => void handleDelete(category.id)}
                    aria-label={t("categories.actions.delete")}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  return (
    <>
      <PageHeader
        title={t("pages.categories.title")}
        // Toplam filtrelenmiş sonuçtan, "aktif" sayısı filtrelerden bağımsız veriden.
        subtitle={t("pages.categories.subtitle", {
          count: paged.total,
          active: counts.aktif,
        })}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Görünüm seçimi filtre değil sunum kontrolü (salons deseni). */}
            <Tabs<CategoryView>
              ariaLabel={t("categories.filter.view")}
              className="mx-0 -mb-1 [&>button]:px-2.5"
              value={query.view}
              onChange={(view) => setQuery((prev) => normalizeQuery({ ...prev, view }))}
              items={[
                { value: "tablo", label: t("categories.filter.viewTable") },
                { value: "kartlar", label: t("categories.filter.viewCards") },
              ]}
            />
            <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
              {t("categories.filter.refresh")}
            </Button>
            <Button size="sm" onClick={handleAddClick}>
              <Plus className="h-4 w-4" aria-hidden />
              {t("categories.filter.newCategory")}
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-2">
        <FilterBar
          leading={
            // Ölçü sarmalayıcıda: Field kontrolünün taban sınıfı `w-full` olduğu için
            // genişlik/daralma sınıfları doğrudan kontrole verilince eziliyor.
            <div className="min-w-[10rem] flex-1 overflow-hidden">
              <Input
                icon={Search}
                value={query.q}
                onChange={(e) => updateFilter({ q: e.target.value })}
                placeholder={t("categories.filter.searchPlaceholder")}
                aria-label={t("categories.filter.search")}
              />
            </div>
          }
        >
          {/* Sekme sayaçları filtrelerden bağımsız global sayımlardan gelir. */}
          <div className="max-w-full shrink-0">
            <Tabs<CategoryStatusFilter>
              ariaLabel={t("categories.filter.status")}
              className="mx-0 -mb-1 [&>button]:px-2 [&>button]:gap-1 [&_span]:px-1"
              value={query.status}
              onChange={(status) => updateFilter({ status })}
              items={CATEGORY_STATUS_FILTERS.map((status) => ({
                value: status,
                label: t(CATEGORY_STATUS_FILTER_LABEL_KEYS[status]),
                count: counts[status],
              }))}
            />
          </div>
          {/* `!` şart: FilterBar kökündeki `[&>*]:min-w-0` doğrudan çocukların
              `min-w-*` tabanını eziyor (aynı özgüllük, sonra gelen kazanıyor). */}
          <div className="!min-w-[8.5rem] max-w-48 flex-1">
            <Select
              aria-label={t("categories.filter.media")}
              value={query.media}
              onChange={(e) => {
                const media = CATEGORY_MEDIA_FILTERS.find((item) => item === e.target.value);
                if (media) updateFilter({ media });
              }}
            >
              {CATEGORY_MEDIA_FILTERS.map((media) => (
                <option key={media} value={media}>
                  {t(CATEGORY_MEDIA_FILTER_LABEL_KEYS[media])}
                </option>
              ))}
            </Select>
          </div>
          <div className="!min-w-[8.5rem] max-w-48 flex-1">
            <Select
              aria-label={t("categories.filter.icon")}
              value={query.icon}
              onChange={(e) => updateFilter({ icon: e.target.value })}
            >
              <option value="">{t("categories.filter.iconAll")}</option>
              {iconChoices.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.labelKey === option.value ? option.value : t(option.labelKey)}
                </option>
              ))}
            </Select>
          </div>
          <div className="!min-w-[8.5rem] max-w-48 flex-1">
            <Select
              aria-label={t("categories.filter.sort")}
              value={`${query.sort}:${query.order}`}
              onChange={(e) => {
                const option = CATEGORY_SORT_OPTIONS.find((item) => item.value === e.target.value);
                if (option) updateFilter({ sort: option.sort, order: option.order });
              }}
            >
              {CATEGORY_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>
          </div>
        </FilterBar>

        {/* Chip satırı ayrı blok: filtre çubuğu tek satır kalır (≥1024px). */}
        <FilterChips
          chips={activeChips(query).map((chip) => ({
            key: chip.key,
            label: t(chip.labelKey, {
              ...chip.vars,
              ...(chip.valueKey ? { label: t(chip.valueKey) } : {}),
            }),
            onRemove: () => updateFilter(chip.patch),
          }))}
          onClearAll={clearFilters}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : null}

      {query.view === "tablo" ? (
        !loading && !filtersActive && noRowsAtAll ? (
          <Card>
            <EmptyState
              title={t("categories.empty.noneTitle")}
              description={t("categories.empty.noneDescription")}
              action={createButton}
            />
          </Card>
        ) : (
          <DataTable<CategoryListRow>
            rows={paged.rows}
            columns={columns}
            rowKey={(category) => category.id}
            loading={loading}
            actions={rowActions}
            minWidthClass="min-w-[44rem]"
            emptyTitle={
              filtersActive
                ? t("categories.empty.filteredTitle")
                : t("categories.empty.noneTitle")
            }
            emptyDescription={
              filtersActive
                ? t("categories.empty.filteredDescription")
                : t("categories.empty.noneDescription")
            }
          />
        )
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : noRowsAtAll && !filtersActive ? (
        <Card>
          <EmptyState
            title={t("categories.empty.noneTitle")}
            description={t("categories.empty.noneDescription")}
            action={createButton}
          />
        </Card>
      ) : paged.rows.length === 0 ? (
        <Card>
          <EmptyState
            title={t("categories.empty.filteredTitle")}
            description={t("categories.empty.filteredDescription")}
          />
        </Card>
      ) : (
        cardGrid
      )}

      <Pagination
        page={paged.page}
        totalPages={paged.totalPages}
        total={paged.total}
        pageSize={query.limit}
        pageSizeOptions={CATEGORIES_PAGE_SIZES}
        onPage={(page) => updateFilter({ page })}
        onPageSize={changePageSize}
      />

      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        title={
          editingId ? t("categories.dialog.editTitle") : t("categories.dialog.createTitle")
        }
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={handleCloseModal}>
              {t("categories.actions.cancel")}
            </Button>
            {/* Form dışındaki düğme `form` ile bağlanır: alanlar kaydırılırken
                Kaydet/Vazgeç görünür kalır (alan sayısı medya ile arttı). */}
            <Button variant="primary" size="sm" type="submit" form="category-form" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {editingId ? t("categories.actions.save") : t("categories.actions.create")}
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <Field label={t("categories.dialog.nameLabel")} htmlFor="cat-name" required>
            <Input
              id="cat-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t("categories.dialog.namePlaceholder")}
              required
            />
          </Field>

          <Field
            label={t("categories.dialog.descriptionLabel")}
            htmlFor="cat-desc"
            hint={t("categories.dialog.descriptionHint")}
          >
            <Textarea
              id="cat-desc"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Field>

          <Field label={t("categories.dialog.iconLabel")} htmlFor="cat-icon">
            <Select
              id="cat-icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            >
              {iconOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex items-center justify-between gap-3 rounded-field border border-border bg-surface-variant p-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-fg">{t("categories.dialog.activeLabel")}</p>
              <p className="text-xs text-fg-muted">{t("categories.dialog.activeHint")}</p>
            </div>
            <Toggle
              checked={formData.isActive}
              onChange={(next) => setFormData({ ...formData, isActive: next })}
              label={t("categories.dialog.activeToggle")}
            />
          </div>

          <ImageField
            label={t("categories.dialog.imageLabel")}
            value={formData.imageUrl}
            onChange={(imageUrl) => setFormData({ ...formData, imageUrl })}
          />

          <VideoField
            label={t("categories.dialog.videoLabel")}
            value={formData.videoUrl}
            onChange={(videoUrl) => setFormData({ ...formData, videoUrl })}
          />
        </form>
      </Dialog>
    </>
  );
}
