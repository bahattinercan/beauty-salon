"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, SearchX } from "lucide-react";
import { apiFetch } from "@/lib/api";
import PageHeader from "@/components/shell/PageHeader";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Dialog from "@/components/ui/Dialog";
import Pagination from "@/components/ui/Pagination";
import SalonCard from "@/components/ui/SalonCard";
import { StatusBadge, SALON_STATUS } from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import { Input, Select } from "@/components/ui/Field";
import { ErrorState } from "@/components/ui/States";
import { Card, CardBody } from "@/components/ui/Card";
import FilterBar from "@/components/ui/FilterBar";
import FilterChips from "@/components/ui/FilterChips";
import SalonActions, { type SalonPendingAction } from "@/components/salons/SalonActions";
import SalonEditDialog, { type SalonEditPayload } from "@/components/salons/SalonEditDialog";
import useDebouncedValue from "@/lib/useDebouncedValue";
import {
  DEFAULT_SALONS_QUERY,
  PAGE_SIZE_STORAGE_KEY,
  SALON_SORT_OPTIONS,
  SALONS_PAGE_SIZES,
  activeChips,
  buildSalonsQuery,
  normalizeQuery,
  parseSalonsQuery,
  toApiSearchParams,
  type SalonStatusFilter,
  type SalonsQueryState,
} from "@/lib/salonsQuery";
import type { WorkingHours } from "@/components/salons/WorkingHoursEditor";

type SalonStatus = "onaylı" | "bekliyor" | "pasif";
type View = "tablo" | "kartlar";

interface ApiSalon {
  id: string;
  name: string;
  phone?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  workingHours?: WorkingHours | string | null;
  galleryImages?: string[] | string | null;
  isVerified: boolean;
  isActive: boolean;
  /** API `ratingAvg` döndürüyor; `averageRating` eski ad — ikisi de okunur. */
  ratingAvg?: number | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  coverImageUrl?: string | null;
  logoUrl?: string | null;
  createdAt?: string;
  owner?: { fullName: string; email: string };
}

interface Salon {
  id: string;
  name: string;
  phone: string;
  description: string | null;
  address: string;
  city: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  workingHours: WorkingHours;
  galleryImages: string[];
  owner: string;
  rating: number | null;
  reviewCount: number;
  status: SalonStatus;
  coverImageUrl?: string | null;
  logoUrl?: string | null;
  isNew: boolean;
}

interface SalonsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  /** Filtrelerden bağımsız global sayaçlar (plan §5.2: `counts` state'ten değil `meta`'dan). */
  counts?: Partial<Record<SalonStatusFilter, number>>;
  cities?: string[];
}

interface ApiResponse {
  success: boolean;
  data: { data: ApiSalon[]; meta: SalonsMeta };
}

/** `workingHours` API'den JSON string de gelebilir (TEXT kolon); tek yerde çözülür. */
function toWorkingHours(value: ApiSalon["workingHours"]): WorkingHours {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === "object" ? (parsed as WorkingHours) : {};
    } catch {
      return {};
    }
  }
  return value;
}

function toGallery(value: ApiSalon["galleryImages"]): string[] {
  if (Array.isArray(value)) return value.filter((url): url is string => typeof url === "string");
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((url): url is string => typeof url === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapSalon(s: ApiSalon, now: number): Salon {
  let status: SalonStatus = "pasif";
  if (s.isActive && s.isVerified) status = "onaylı";
  else if (s.isActive && !s.isVerified) status = "bekliyor";

  const rating = s.ratingAvg ?? s.averageRating ?? null;

  return {
    id: s.id,
    name: s.name,
    phone: s.phone ?? "",
    description: s.description ?? null,
    address: s.address || [s.city, s.district].filter(Boolean).join(", ") || "—",
    city: s.city ?? null,
    district: s.district ?? null,
    latitude: typeof s.latitude === "number" ? s.latitude : null,
    longitude: typeof s.longitude === "number" ? s.longitude : null,
    workingHours: toWorkingHours(s.workingHours),
    galleryImages: toGallery(s.galleryImages),
    owner: s.owner?.fullName || "—",
    // API `ratingAvg` veriyor, kod `averageRating` okuyordu → Puan daima 0'dı.
    rating: typeof rating === "number" ? rating : null,
    reviewCount: s.reviewCount ?? 0,
    status,
    coverImageUrl: s.coverImageUrl,
    logoUrl: s.logoUrl,
    // "Yeni" rozeti fetch anında hesaplanır (render içinde Date.now() saf değil).
    isNew: !!s.createdAt && now - new Date(s.createdAt).getTime() < 30 * 864e5,
  };
}

const EMPTY_META: SalonsMeta = { total: 0, page: 1, limit: DEFAULT_SALONS_QUERY.limit, totalPages: 1 };

export default function SalonsPage() {
  const router = useRouter();

  const [query, setQuery] = useState<SalonsQueryState>(DEFAULT_SALONS_QUERY);
  const [hydrated, setHydrated] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [salons, setSalons] = useState<Salon[]>([]);
  const [meta, setMeta] = useState<SalonsMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [editTarget, setEditTarget] = useState<Salon | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Salon | null>(null);

  // Arama 300ms debounce; filtreler anında. Sunucu isteği debounce edilmiş değerle.
  const debouncedQ = useDebouncedValue(query.q, 300);
  const apiQuery = toApiSearchParams({ ...query, q: debouncedQ });

  /**
   * İlk açılış: URL'den durum okunur, sayfa boyutu tercihi localStorage'dan gelir
   * (URL'de açık `limit` varsa o kazanır). `useSearchParams` statik prerender'da
   * Suspense sınırı zorunlu kılıyordu → `window.location` (mevcut desen).
   */
  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.push("/login");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const fromUrl = parseSalonsQuery(window.location.search);
    const stored = Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
    const limit = params.has("limit")
      ? fromUrl.limit
      : SALONS_PAGE_SIZES.includes(stored)
        ? stored
        : fromUrl.limit;

    setQuery(normalizeQuery({ ...fromUrl, limit }));
    setHydrated(true);
  }, [router]);

  const fetchSalons = useCallback(
    async (search: string, signal: AbortSignal) => {
      try {
        setError(null);
        setLoading(true);
        const result = await apiFetch<ApiResponse>(`/admin/salons?${search}`, { signal });
        if (result.success && result.data) {
          const now = Date.now();
          setSalons(result.data.data.map((item) => mapSalon(item, now)));
          setMeta(result.data.meta);
        }
      } catch (err) {
        // R3: iptal edilen istek state yazmaz (yavaş cevap yeni filtreyi ezmesin).
        if (signal.aborted) return;
        const msg = err instanceof Error ? err.message : "Veri yüklenemedi";
        if (msg.includes("401") || msg.includes("403")) {
          router.push("/login");
          return;
        }
        setError(msg);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    void fetchSalons(apiQuery, controller.signal);
    return () => controller.abort();
  }, [apiQuery, fetchSalons, hydrated, reloadKey]);

  /**
   * Tek kaynak `query` → URL. İlk render yazmaz (URL zaten okunuyor), sonra her
   * değişiklik `router.replace` ile yazılır (`scroll: false`, R5).
   */
  const lastWrittenQuery = useRef<string | null>(null);
  useEffect(() => {
    const next = buildSalonsQuery(query);
    if (lastWrittenQuery.current === null) {
      lastWrittenQuery.current = next;
      return;
    }
    if (lastWrittenQuery.current === next) return;
    lastWrittenQuery.current = next;
    router.replace(next ? `/salons?${next}` : "/salons", { scroll: false });
  }, [query, router]);

  /** Filtre değişimi sayfayı 1'e döndürür (R2); sayfa değişimi açıkça `page` verir. */
  const updateFilter = useCallback((patch: Partial<SalonsQueryState>) => {
    setQuery((prev) => normalizeQuery({ ...prev, ...patch, page: patch.page ?? 1 }));
  }, []);

  /** Temizle: q/durum/şehir/puan sıfır, sayfa 1 — limit ve görünüm korunur. */
  const clearFilters = useCallback(() => {
    setQuery((prev) =>
      normalizeQuery({ ...DEFAULT_SALONS_QUERY, limit: prev.limit, view: prev.view })
    );
  }, []);

  const changePageSize = (size: number) => {
    localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(size));
    updateFilter({ limit: size });
  };

  const handleVerify = async (id: string) => {
    try {
      setPending(`${id}-verify`);
      setNotice(null);
      await apiFetch(`/salons/${id}/verify`, { method: "PATCH" });
      setSalons((prev) => prev.map((s) => (s.id === id ? { ...s, status: "onaylı" } : s)));
      setNotice({ kind: "success", text: "Salon onaylandı" });
    } catch (err) {
      setNotice({
        kind: "error",
        text: err instanceof Error ? err.message : "İşlem başarısız",
      });
    } finally {
      setPending(null);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      setPending(`${id}-toggle`);
      setNotice(null);
      await apiFetch(`/salons/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: true }),
      });
      setSalons((prev) => prev.map((s) => (s.id === id ? { ...s, status: "bekliyor" } : s)));
      setNotice({ kind: "success", text: "Salon etkinleştirildi" });
    } catch (err) {
      setNotice({
        kind: "error",
        text: err instanceof Error ? err.message : "İşlem başarısız",
      });
    } finally {
      setPending(null);
    }
  };

  /** Pasife alma onay diyaloğundan gelir (R7); `DELETE` soft delete. */
  const handleDeactivate = async (id: string) => {
    try {
      setPending(`${id}-toggle`);
      setNotice(null);
      await apiFetch(`/salons/${id}`, { method: "DELETE" });
      setSalons((prev) => prev.map((s) => (s.id === id ? { ...s, status: "pasif" } : s)));
      setConfirmTarget(null);
      setNotice({ kind: "success", text: "Salon pasife alındı" });
    } catch (err) {
      setNotice({
        kind: "error",
        text: err instanceof Error ? err.message : "İşlem başarısız",
      });
    } finally {
      setPending(null);
    }
  };

  const handleSaved = (id: string, payload: SalonEditPayload) => {
    setSalons((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              name: payload.name,
              phone: payload.phone,
              description: payload.description,
              address: payload.address,
              city: payload.city,
              district: payload.district,
              latitude: payload.latitude ?? null,
              longitude: payload.longitude ?? null,
              workingHours: payload.workingHours,
              logoUrl: payload.logoUrl,
              coverImageUrl: payload.coverImageUrl,
              galleryImages: payload.galleryImages,
            }
          : s
      )
    );
    setEditTarget(null);
    // Başarı duyurusu sayfada: diyalog kapanınca kendi canlı bölgesi sökülürdü.
    setNotice({ kind: "success", text: "Salon güncellendi" });
  };

  const pendingFor = (id: string): SalonPendingAction => {
    if (pending === `${id}-verify`) return "verify";
    if (pending === `${id}-toggle`) return "toggle";
    return null;
  };

  const rowActions = (salon: Salon) => (
    <SalonActions
      status={salon.status}
      pending={pendingFor(salon.id)}
      onEdit={() => setEditTarget(salon)}
      onVerify={() => void handleVerify(salon.id)}
      onDeactivate={() => setConfirmTarget(salon)}
      onActivate={() => void handleActivate(salon.id)}
    />
  );

  const counts = meta.counts ?? {};
  const cities = meta.cities ?? [];
  const cityOptions = query.city && !cities.includes(query.city) ? [query.city, ...cities] : cities;
  const hasFilters = Boolean(
    query.q || query.city || query.minRating !== null || query.status !== "tümü"
  );

  // API `staff` döndürmüyor → "Ekip" kolonu daima 0'dı; kaldırıldı (6→5 kolon).
  const columns: Column<Salon>[] = [
    {
      key: "name",
      header: "Salon",
      mobile: "primary",
      cell: (s) => <span className="font-semibold text-fg">{s.name}</span>,
    },
    { key: "owner", header: "Sahibi", cell: (s) => s.owner },
    {
      key: "address",
      header: "Konum",
      mobile: false,
      cell: (s) => <span className="text-fg-muted">{s.address}</span>,
    },
    {
      key: "rating",
      header: "Puan",
      align: "right",
      cell: (s) =>
        s.rating === null ? (
          <span className="text-fg-muted">—</span>
        ) : (
          <span className="tnum font-semibold text-fg">
            {s.rating.toFixed(1)}
            {s.reviewCount ? <span className="text-fg-muted"> ({s.reviewCount})</span> : null}
          </span>
        ),
    },
    {
      key: "status",
      header: "Durum",
      cell: (s) => <StatusBadge map={SALON_STATUS} value={s.status} />,
    },
    {
      key: "actions",
      header: "İşlem",
      align: "right",
      mobile: false,
      cell: (s) => rowActions(s),
    },
  ];

  return (
    <>
      <PageHeader
        title="Salon Yönetimi"
        // Sayaçlar filtreli `meta.total` değil, filtrelerden bağımsız global `meta.counts` (plan §5.2).
        subtitle={`${counts["tümü"] ?? meta.total} salon · ${counts.bekliyor ?? 0} onay bekliyor`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Görünüm seçimi filtre değil sunum kontrolü: 1280px'te filtre çubuğuna
                sığmadığı için başlık aksiyonlarına taşındı (AP-007 §5.3). */}
            <Tabs<View>
              ariaLabel="Görünüm"
              className="mx-0 -mb-1 [&>button]:px-2.5"
              value={query.view}
              onChange={(view) => setQuery((prev) => normalizeQuery({ ...prev, view }))}
              items={[
                { value: "tablo", label: "Tablo" },
                { value: "kartlar", label: "Kartlar" },
              ]}
            />
            <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
              Yenile
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-2">
        <FilterBar
          leading={
            // Ölçü sarmalayıcıda: Field kontrolünün taban sınıfı `w-full` olduğu için
            // genişlik/daralma sınıfları doğrudan kontrole verilince eziliyor (AP-007).
            <div className="min-w-[10rem] flex-1 overflow-hidden">
              <Input
                icon={Search}
                value={query.q}
                onChange={(e) => updateFilter({ q: e.target.value })}
                placeholder="Salon adı, sahibi veya adres ara…"
                aria-label="Salon ara"
              />
            </div>
          }
        >
          <div className="max-w-full shrink-0">
            <Tabs<SalonStatusFilter>
              ariaLabel="Durum filtresi"
              className="mx-0 -mb-1 [&>button]:px-2 [&>button]:gap-1 [&_span]:px-1"
              value={query.status}
              onChange={(status) => updateFilter({ status })}
              items={[
                { value: "tümü", label: "Tümü", count: counts["tümü"] },
                { value: "onaylı", label: "Onaylı", count: counts["onaylı"] },
                { value: "bekliyor", label: "Bekliyor", count: counts["bekliyor"] },
                { value: "pasif", label: "Pasif", count: counts["pasif"] },
              ]}
            />
          </div>
          <div className="min-w-28 max-w-40 flex-1">
            <Select
              aria-label="Şehir"
              value={query.city}
              onChange={(e) => updateFilter({ city: e.target.value })}
            >
              <option value="">Tüm şehirler</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-28 max-w-40 flex-1">
            <Select
              aria-label="Puan"
              value={query.minRating === null ? "" : String(query.minRating)}
              onChange={(e) =>
                updateFilter({ minRating: e.target.value ? Number(e.target.value) : null })
              }
            >
              <option value="">Tüm puanlar</option>
              <option value="3">3+ puan</option>
              <option value="4">4+ puan</option>
              <option value="4.5">4.5+ puan</option>
            </Select>
          </div>
          <div className="min-w-28 max-w-40 flex-1">
            <Select
              aria-label="Sıralama"
              value={`${query.sort}:${query.order}`}
              onChange={(e) => {
                const option = SALON_SORT_OPTIONS.find((item) => item.value === e.target.value);
                if (option) updateFilter({ sort: option.sort, order: option.order });
              }}
            >
              {SALON_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </FilterBar>

        <FilterChips
          chips={activeChips(query).map((chip) => ({
            key: chip.key,
            label: chip.label,
            onRemove: () => updateFilter(chip.patch),
          }))}
          onClearAll={clearFilters}
        />
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {notice?.kind === "success" ? notice.text : ""}
      </p>
      {notice?.kind === "error" ? (
        <p role="alert" className="mb-3 text-sm text-error">
          {notice.text}
        </p>
      ) : null}

      {error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : null}

      {query.view === "tablo" ? (
        <DataTable<Salon>
          rows={salons}
          columns={columns}
          rowKey={(s) => s.id}
          loading={loading}
          actions={rowActions}
          minWidthClass="min-w-[40rem]"
          emptyTitle={hasFilters ? "Eşleşme yok" : "Salon yok"}
          emptyDescription={
            hasFilters ? "Filtreleri temizleyip tekrar deneyin." : "Henüz salon bulunmuyor."
          }
        />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardBody className="h-64" />
            </Card>
          ))}
        </div>
      ) : salons.length === 0 ? (
        <Card>
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 p-6 text-center text-fg-muted">
            <SearchX className="h-8 w-8" aria-hidden />
            <p className="font-display font-bold text-fg">Eşleşme yok</p>
            <p className="text-sm">Arama veya filtre kriterlerinizi değiştirin.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {salons.map((salon) => (
            <SalonCard key={salon.id} salon={salon} actions={rowActions(salon)} />
          ))}
        </div>
      )}

      <Pagination
        page={query.page}
        totalPages={meta.totalPages}
        total={meta.total}
        pageSize={query.limit}
        onPage={(page) => updateFilter({ page })}
        onPageSize={changePageSize}
      />

      <SalonEditDialog
        open={editTarget !== null}
        salon={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={handleSaved}
      />

      <Dialog
        open={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        title="Salonu pasife al"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmTarget(null)} disabled={pending !== null}>
              Vazgeç
            </Button>
            <Button
              variant="danger"
              disabled={pending !== null}
              onClick={() => {
                if (confirmTarget) void handleDeactivate(confirmTarget.id);
              }}
            >
              {pending !== null ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              Pasife al
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">
          <span className="font-semibold text-fg">{confirmTarget?.name}</span> pasife alınacak;
          mevcut randevular silinmez.
        </p>
      </Dialog>
    </>
  );
}
