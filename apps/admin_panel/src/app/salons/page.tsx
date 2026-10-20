"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, Power, Search, SearchX, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import PageHeader from "@/components/shell/PageHeader";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import SalonCard from "@/components/ui/SalonCard";
import { StatusBadge, SALON_STATUS } from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Field";
import { ErrorState } from "@/components/ui/States";
import { Card, CardBody } from "@/components/ui/Card";

type SalonStatus = "onaylı" | "bekliyor" | "pasif";

interface ApiSalon {
  id: string;
  name: string;
  address?: string;
  city?: string | null;
  district?: string | null;
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
  address: string;
  city?: string | null;
  district?: string | null;
  owner: string;
  rating: number | null;
  reviewCount: number;
  status: SalonStatus;
  coverImageUrl?: string | null;
  logoUrl?: string | null;
  isNew: boolean;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: ApiSalon[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  };
}

const ITEMS_PER_PAGE = 10;

function mapSalon(s: ApiSalon, now: number): Salon {
  let status: SalonStatus = "pasif";
  if (s.isActive && s.isVerified) status = "onaylı";
  else if (s.isActive && !s.isVerified) status = "bekliyor";

  const rating = s.ratingAvg ?? s.averageRating ?? null;

  return {
    id: s.id,
    name: s.name,
    address: s.address || [s.city, s.district].filter(Boolean).join(", ") || "—",
    city: s.city,
    district: s.district,
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

type Filter = "tümü" | SalonStatus;

export default function SalonsPage() {
  const router = useRouter();

  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("tümü");
  const [view, setView] = useState<"tablo" | "kartlar">("tablo");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Panel hero'sundan gelen derin bağlantı: /salons?filter=bekliyor
  // (useSearchParams yerine location: statik prerender'da Suspense sınırı zorunlu olurdu.)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("filter");
    if (q === "onaylı" || q === "bekliyor" || q === "pasif") setFilter(q);
  }, []);

  const fetchSalons = useCallback(
    async (page = 1) => {
      try {
        setError(null);
        setLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          limit: String(ITEMS_PER_PAGE),
        });
        const result = await apiFetch<ApiResponse>(`/admin/salons?${params}`);
        if (result.success && result.data) {
          setSalons(result.data.data.map((item) => mapSalon(item, Date.now())));
          setTotalPages(result.data.meta.totalPages);
          setTotalCount(result.data.meta.total);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Veri yüklenemedi";
        if (msg.includes("401") || msg.includes("403")) {
          router.push("/login");
          return;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.push("/login");
      return;
    }
    fetchSalons(currentPage);
  }, [currentPage, fetchSalons, router]);

  const handleVerify = async (id: string) => {
    try {
      setActionLoading(id + "-verify");
      await apiFetch(`/salons/${id}/verify`, { method: "PATCH" });
      setSalons((prev) => prev.map((s) => (s.id === id ? { ...s, status: "onaylı" } : s)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: SalonStatus) => {
    try {
      setActionLoading(id + "-toggle");
      if (currentStatus === "onaylı" || currentStatus === "bekliyor") {
        await apiFetch(`/salons/${id}`, { method: "DELETE" }); // soft delete
        setSalons((prev) => prev.map((s) => (s.id === id ? { ...s, status: "pasif" } : s)));
      } else {
        await apiFetch(`/salons/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ isActive: true }),
        });
        setSalons((prev) => prev.map((s) => (s.id === id ? { ...s, status: "bekliyor" } : s)));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = useMemo(
    () =>
      salons.filter((salon) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          salon.name.toLowerCase().includes(q) ||
          salon.owner.toLowerCase().includes(q) ||
          salon.address.toLowerCase().includes(q);
        return matchesSearch && (filter === "tümü" || salon.status === filter);
      }),
    [salons, searchQuery, filter]
  );

  const counts = useMemo(
    () => ({
      tümü: salons.length,
      onaylı: salons.filter((s) => s.status === "onaylı").length,
      bekliyor: salons.filter((s) => s.status === "bekliyor").length,
      pasif: salons.filter((s) => s.status === "pasif").length,
    }),
    [salons]
  );

  const rowActions = (salon: Salon) => (
    <>
      {salon.status === "bekliyor" ? (
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleVerify(salon.id)}
          disabled={actionLoading === salon.id + "-verify"}
        >
          {actionLoading === salon.id + "-verify" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <CheckCircle className="h-4 w-4" aria-hidden />
          )}
          Onayla
        </Button>
      ) : null}
      {salon.status === "pasif" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToggleActive(salon.id, salon.status)}
          disabled={actionLoading === salon.id + "-toggle"}
        >
          <Power className="h-4 w-4" aria-hidden />
          Etkinleştir
        </Button>
      ) : (
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleToggleActive(salon.id, salon.status)}
          disabled={actionLoading === salon.id + "-toggle"}
        >
          {actionLoading === salon.id + "-toggle" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <XCircle className="h-4 w-4" aria-hidden />
          )}
          Pasife al
        </Button>
      )}
    </>
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
      cell: (s) => <div className="flex justify-end gap-2">{rowActions(s)}</div>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Salon Yönetimi"
        subtitle={`${totalCount} salon · ${counts.bekliyor} onay bekliyor`}
        actions={
          <Button variant="outline" size="sm" onClick={() => fetchSalons(currentPage)}>
            Yenile
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <Input
          icon={Search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Salon adı, sahibi veya adres ara…"
          aria-label="Salon ara"
        />
        <Tabs<Filter>
          ariaLabel="Durum filtresi"
          value={filter}
          onChange={(v) => setFilter(v)}
          items={[
            { value: "tümü", label: "Tümü", count: counts.tümü },
            { value: "onaylı", label: "Onaylı", count: counts.onaylı },
            { value: "bekliyor", label: "Bekliyor", count: counts.bekliyor },
            { value: "pasif", label: "Pasif", count: counts.pasif },
          ]}
        />
        <Tabs<"tablo" | "kartlar">
          ariaLabel="Görünüm"
          value={view}
          onChange={(v) => setView(v)}
          items={[
            { value: "tablo", label: "Tablo" },
            { value: "kartlar", label: "Kartlar" },
          ]}
        />
      </div>

      {error ? <ErrorState message={error} onRetry={() => fetchSalons(currentPage)} /> : null}

      {view === "tablo" ? (
        <DataTable<Salon>
          rows={filtered}
          columns={columns}
          rowKey={(s) => s.id}
          loading={loading}
          actions={rowActions}
          minWidthClass="min-w-[40rem]"
          emptyTitle={searchQuery || filter !== "tümü" ? "Eşleşme yok" : "Salon yok"}
          emptyDescription={
            searchQuery || filter !== "tümü"
              ? "Filtreleri temizleyip tekrar deneyin."
              : "Henüz salon bulunmuyor."
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
      ) : filtered.length === 0 ? (
        <Card>
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 p-6 text-center text-fg-muted">
            <SearchX className="h-8 w-8" aria-hidden />
            <p className="font-display font-bold text-fg">Eşleşme yok</p>
            <p className="text-sm">Arama veya filtre kriterlerinizi değiştirin.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((salon) => (
            <SalonCard key={salon.id} salon={salon} actions={rowActions(salon)} />
          ))}
        </div>
      )}

      <Pagination page={currentPage} totalPages={totalPages} onPage={setCurrentPage} />
    </>
  );
}
