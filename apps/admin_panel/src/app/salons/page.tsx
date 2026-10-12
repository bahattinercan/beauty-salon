"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  Eye,
  CheckCircle,
  XCircle,
  ToggleRight,
  Star,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type SalonStatus = "onaylı" | "bekliyor" | "pasif";

interface ApiSalon {
  id: string;
  name: string;
  address: string;
  city?: string;
  district?: string;
  isVerified: boolean;
  isActive: boolean;
  averageRating?: number;
  reviewCount?: number;
  owner?: { fullName: string; email: string };
  staff?: unknown[];
}

interface Salon {
  id: string;
  name: string;
  address: string;
  owner: string;
  rating: number;
  reviewCount: number;
  staffCount: number;
  status: SalonStatus;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: ApiSalon[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

const ITEMS_PER_PAGE = 10;

function mapSalon(s: ApiSalon): Salon {
  let status: SalonStatus = "pasif";
  if (s.isActive && s.isVerified) status = "onaylı";
  else if (s.isActive && !s.isVerified) status = "bekliyor";

  const address = s.address || [s.city, s.district].filter(Boolean).join(", ") || "—";

  return {
    id: s.id,
    name: s.name,
    address,
    owner: s.owner?.fullName || "—",
    rating: s.averageRating ?? 0,
    reviewCount: s.reviewCount ?? 0,
    staffCount: Array.isArray(s.staff) ? s.staff.length : 0,
    status,
  };
}

const ITEMS_PER_PAGE_SERVER = ITEMS_PER_PAGE;

export default function SalonsPage() {
  const router = useRouter();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"tümü" | SalonStatus>("tümü");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const fetchSalons = useCallback(async (page = 1) => {
    try {
      setError(null);
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE_SERVER),
      });

      const result = await apiFetch<ApiResponse>(`/admin/salons?${params}`);

      if (result.success && result.data) {
        setSalons(result.data.data.map(mapSalon));
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
  }, [router]);

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
      setSalons((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "onaylı" } : s))
      );
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
        // Soft delete = deactivate
        await apiFetch(`/salons/${id}`, { method: "DELETE" });
        setSalons((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: "pasif" } : s))
        );
      } else {
        // Reactivate via PATCH
        await apiFetch(`/salons/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ isActive: true }),
        });
        setSalons((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: "bekliyor" } : s))
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setActionLoading(null);
    }
  };

  // Client-side filtering
  const filteredSalons = salons.filter((salon) => {
    const matchesSearch =
      salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "tümü" || salon.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: totalCount,
    approved: salons.filter((s) => s.status === "onaylı").length,
    pending: salons.filter((s) => s.status === "bekliyor").length,
  };

  const getStatusStyles = (status: SalonStatus) => {
    switch (status) {
      case "onaylı":
        return "bg-success/10 text-success border border-success/30";
      case "bekliyor":
        return "bg-warning/10 text-warning border border-warning/30";
      case "pasif":
        return "bg-error/10 text-error border border-error/30";
    }
  };

  const getStatusLabel = (status: SalonStatus) => {
    switch (status) {
      case "onaylı": return "Onaylı";
      case "bekliyor": return "Bekliyor";
      case "pasif": return "Pasif";
    }
  };

  const filterOptions = [
    { label: "Tümü", value: "tümü" as const },
    { label: "Onaylı", value: "onaylı" as const },
    { label: "Bekliyor", value: "bekliyor" as const },
    { label: "Pasif", value: "pasif" as const },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-gray-500">Salonlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <XCircle className="mt-1 h-5 w-5 text-red-500" />
          <div className="flex-1">
            <h3 className="font-medium text-red-800">Veri Yükleme Hatası</h3>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <button
              onClick={() => fetchSalons(currentPage)}
              className="mt-3 flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-4xl font-bold text-primary">Salon Yönetimi</h1>
        <button
          onClick={() => fetchSalons(currentPage)}
          className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Yenile
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
          <input
            type="text"
            placeholder="Salon adı, sahip veya adres ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-all"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:border-primary/50 transition-colors bg-white"
          >
            <span className="text-text-secondary text-sm font-medium">
              Durum:{" "}
              <span className="text-text-primary font-semibold">
                {filterOptions.find((o) => o.value === filterStatus)?.label}
              </span>
            </span>
            <ChevronDown className="w-4 h-4 text-text-secondary" />
          </button>

          {showFilterDropdown && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setFilterStatus(option.value);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    filterStatus === option.value
                      ? "bg-secondary text-primary font-semibold"
                      : "text-text-primary"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-text-secondary text-sm font-medium mb-2">Toplam</p>
          <p className="text-4xl font-bold text-primary">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-text-secondary text-sm font-medium mb-2">Onaylı (bu sayfa)</p>
          <p className="text-4xl font-bold text-success">{stats.approved}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-text-secondary text-sm font-medium mb-2">Bekliyor (bu sayfa)</p>
          <p className="text-4xl font-bold text-warning">{stats.pending}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-variant border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Salon Adı</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Sahibi</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Puan</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Yorum</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Durum</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSalons.length > 0 ? (
                filteredSalons.map((salon) => (
                  <tr key={salon.id} className="hover:bg-surface-variant transition-colors">
                    {/* Salon Name & Address */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <p className="font-semibold text-text-primary">{salon.name}</p>
                        <div className="flex items-center gap-1 text-text-secondary text-sm">
                          <MapPin className="w-3 h-3" />
                          {salon.address}
                        </div>
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="px-6 py-4">
                      <p className="text-text-primary">{salon.owner}</p>
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {salon.rating > 0 ? (
                          <>
                            <Star className="w-4 h-4 fill-warning text-warning" />
                            <span className="font-semibold text-text-primary">
                              {salon.rating.toFixed(1)}
                            </span>
                          </>
                        ) : (
                          <span className="text-text-secondary text-sm">Yok</span>
                        )}
                      </div>
                    </td>

                    {/* Review Count */}
                    <td className="px-6 py-4">
                      <p className="text-text-primary">{salon.reviewCount}</p>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(
                          salon.status
                        )}`}
                      >
                        {getStatusLabel(salon.status)}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 hover:bg-info/10 text-info rounded-lg transition-colors"
                          title="Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {salon.status === "bekliyor" ? (
                          <>
                            <button
                              onClick={() => handleVerify(salon.id)}
                              disabled={actionLoading === salon.id + "-verify"}
                              className="p-2 hover:bg-success/10 text-success rounded-lg transition-colors disabled:opacity-50"
                              title="Onayla"
                            >
                              {actionLoading === salon.id + "-verify" ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleToggleActive(salon.id, salon.status)}
                              disabled={actionLoading === salon.id + "-toggle"}
                              className="p-2 hover:bg-error/10 text-error rounded-lg transition-colors disabled:opacity-50"
                              title="Reddet / Pasif Yap"
                            >
                              {actionLoading === salon.id + "-toggle" ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(salon.id, salon.status)}
                            disabled={actionLoading === salon.id + "-toggle"}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              salon.status === "onaylı"
                                ? "hover:bg-warning/10 text-warning"
                                : "hover:bg-success/10 text-success"
                            }`}
                            title={salon.status === "onaylı" ? "Pasif Yap" : "Aktif Yap"}
                          >
                            {actionLoading === salon.id + "-toggle" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ToggleRight className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-text-secondary">
                      Aranılan kriterlere uygun salon bulunamadı
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Sayfa {currentPage} / {totalPages} (Toplam: {totalCount} salon)
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-text-primary" />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                      page === currentPage
                        ? "bg-primary text-white border-primary"
                        : "border-gray-200 text-text-primary hover:bg-secondary"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-text-primary" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
