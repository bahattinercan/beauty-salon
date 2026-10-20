'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CheckCheck, XCircle, UserX } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import PageHeader from '@/components/shell/PageHeader';
import Button from '@/components/ui/Button';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import { StatusBadge, APPOINTMENT_STATUS } from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import { ErrorState } from '@/components/ui/States';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
type FilterTab = 'ALL' | AppointmentStatus;

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
    meta: { total: number; page: number; limit: number; totalPages: number };
  };
}

const ITEMS_PER_PAGE = 10;

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return Number.isNaN(d.getTime())
    ? dateString
    : d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function money(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/admin/appointments?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
      if (filter !== 'ALL') url += `&status=${filter}`;
      const res = await apiFetch<ApiResponse>(url);
      if (res.success && res.data) {
        setAppointments(res.data.data || []);
        setTotalPages(res.data.meta.totalPages);
        setTotalCount(res.data.meta.total);
      } else {
        setAppointments([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Randevular yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    try {
      setUpdatingId(id);
      await apiFetch(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Durum güncellenemedi');
    } finally {
      setUpdatingId(null);
    }
  };

  const rowActions = (a: ApiAppointment) => {
    const busy = updatingId === a.id;
    return (
      <>
        {a.status === 'PENDING' ? (
          <Button variant="primary" size="sm" disabled={busy} onClick={() => updateStatus(a.id, 'CONFIRMED')}>
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Onayla
          </Button>
        ) : null}
        {a.status === 'CONFIRMED' ? (
          <>
            <Button variant="primary" size="sm" disabled={busy} onClick={() => updateStatus(a.id, 'COMPLETED')}>
              <CheckCheck className="h-4 w-4" aria-hidden />
              Tamamla
            </Button>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => updateStatus(a.id, 'NO_SHOW')}>
              <UserX className="h-4 w-4" aria-hidden />
              Gelmedi
            </Button>
          </>
        ) : null}
        {a.status === 'PENDING' || a.status === 'CONFIRMED' ? (
          <Button variant="danger" size="sm" disabled={busy} onClick={() => updateStatus(a.id, 'CANCELLED')}>
            <XCircle className="h-4 w-4" aria-hidden />
            İptal
          </Button>
        ) : null}
      </>
    );
  };

  const columns: Column<ApiAppointment>[] = [
    {
      key: 'salon',
      header: 'Salon / Hizmet',
      mobile: 'primary',
      cell: (a) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-fg">{a.salon?.name ?? '—'}</div>
          <div className="truncate text-xs text-fg-muted">{a.service?.name ?? '—'}</div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Müşteri',
      cell: (a) => <span className="truncate">{a.customer?.fullName ?? '—'}</span>,
    },
    {
      key: 'staff',
      header: 'Personel',
      mobile: 'meta',
      cell: (a) => <span className="text-fg-muted">{a.staff?.fullName ?? '—'}</span>,
    },
    {
      key: 'when',
      header: 'Tarih / Saat',
      mobile: 'meta',
      cell: (a) => (
        <span className="tnum whitespace-nowrap">
          {formatDate(a.date)}
          <span className="text-fg-muted">
            {' '}
            {a.startTime?.slice(0, 5)}–{a.endTime?.slice(0, 5)}
          </span>
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Tutar',
      align: 'right',
      cell: (a) => <span className="tnum font-semibold">{money(a.service?.price ?? 0)}</span>,
    },
    {
      key: 'status',
      header: 'Durum',
      cell: (a) => <StatusBadge map={APPOINTMENT_STATUS} value={a.status} />,
    },
    {
      key: 'actions',
      header: 'İşlem',
      align: 'right',
      mobile: false,
      cell: (a) => <div className="flex flex-wrap justify-end gap-2">{rowActions(a)}</div>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Randevu Yönetimi"
        subtitle={`${totalCount} randevu`}
        actions={
          <Button variant="outline" size="sm" onClick={fetchAppointments}>
            Yenile
          </Button>
        }
      />

      <div className="mb-4">
        <Tabs<FilterTab>
          ariaLabel="Randevu durumu filtresi"
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setCurrentPage(1);
          }}
          items={[
            { value: 'ALL', label: 'Tümü' },
            { value: 'PENDING', label: 'Bekliyor' },
            { value: 'CONFIRMED', label: 'Onaylandı' },
            { value: 'COMPLETED', label: 'Tamamlandı' },
            { value: 'CANCELLED', label: 'İptal' },
            { value: 'NO_SHOW', label: 'Gelmedi' },
          ]}
        />
      </div>

      {error ? <ErrorState message={error} onRetry={fetchAppointments} /> : null}

      <DataTable<ApiAppointment>
        rows={appointments}
        columns={columns}
        rowKey={(a) => a.id}
        loading={loading}
        actions={rowActions}
        minWidthClass="min-w-[46rem]"
        emptyTitle="Randevu yok"
        emptyDescription="Seçili filtrede randevu bulunmuyor."
      />

      <Pagination page={currentPage} totalPages={totalPages} onPage={setCurrentPage} />
    </>
  );
}
