"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

type FilterTab = "ALL" | AppointmentStatus;

interface ApiAppointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  customer?: { fullName: string; email: string };
  salon?: { name: string };
  staff?: { fullName: string };
  service?: { name: string; price: number };
}

interface ApiResponse {
  success: boolean;
  data: {
    data: ApiAppointment[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

const ITEMS_PER_PAGE = 10;

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/admin/appointments?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
      if (filter !== "ALL") {
        url += `&status=${filter}`;
      }
      const res = await apiFetch<ApiResponse>(url);
      if (res.success && res.data) {
        setAppointments(res.data.data || []);
      } else {
        setAppointments([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Randevular yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const getStatusColor = (status: AppointmentStatus): string => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "NO_SHOW":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: AppointmentStatus): string => {
    switch (status) {
      case "PENDING":
        return "Bekliyor";
      case "CONFIRMED":
        return "Onaylandı";
      case "COMPLETED":
        return "Tamamlandı";
      case "CANCELLED":
        return "İptal Edildi";
      case "NO_SHOW":
        return "Gelmedi";
      default:
        return status;
    }
  };

  const tabs: { label: string; value: FilterTab }[] = [
    { label: "Tümü", value: "ALL" },
    { label: "Bekliyor", value: "PENDING" },
    { label: "Onaylandı", value: "CONFIRMED" },
    { label: "Tamamlandı", value: "COMPLETED" },
    { label: "İptal", value: "CANCELLED" },
    { label: "Gelmedi", value: "NO_SHOW" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Randevu Yönetimi</h1>
          <p className="text-gray-600 mt-1">Platformdaki tüm randevuları takip edin</p>
        </div>
        <button
          onClick={fetchAppointments}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setFilter(tab.value);
                setCurrentPage(1);
              }}
              className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                filter === tab.value
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Müşteri
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Salon
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Hizmet / Tutar
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Uzman
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Tarih & Saat
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.length > 0 ? (
                  appointments.map((apt) => (
                    <tr
                      key={apt.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {apt.customer?.fullName || "Misafir"}
                        </p>
                        <p className="text-xs text-gray-500">{apt.customer?.email || ""}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-800 text-sm font-medium">{apt.salon?.name || "-"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-800 text-sm">{apt.service?.name || "-"}</p>
                        {apt.service?.price !== undefined && (
                          <p className="text-xs text-primary font-semibold">{apt.service.price} ₺</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700 text-sm">{apt.staff?.fullName || "-"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-sm text-gray-700">
                          <span className="flex items-center gap-1 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {apt.date}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {apt.startTime} - {apt.endTime}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            apt.status
                          )}`}
                        >
                          {getStatusLabel(apt.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Randevu bulunamadı
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Sayfa: <span className="font-semibold">{currentPage}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Önceki sayfa"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={appointments.length < ITEMS_PER_PAGE || loading}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Sonraki sayfa"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
