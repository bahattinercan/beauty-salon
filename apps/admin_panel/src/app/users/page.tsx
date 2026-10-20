'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Power, PowerOff, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import PageHeader from '@/components/shell/PageHeader';
import Button from '@/components/ui/Button';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Badge, { StatusBadge, USER_ROLE } from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Field';
import { ErrorState } from '@/components/ui/States';

type UserRole = 'CUSTOMER' | 'SALON_OWNER' | 'ADMIN';

interface ApiUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: ApiUser[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  };
}

const ITEMS_PER_PAGE = 10;

function initials(fullName: string): string {
  const parts = fullName.trim().split(' ');
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : fullName[0] || '?').toUpperCase();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

type Filter = 'ALL' | 'CUSTOMER' | 'SALON_OWNER';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<ApiResponse>(`/users?page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
      setUsers(res.success && res.data ? res.data.data || [] : []);
      if (res.success && res.data) {
        setTotalPages(res.data.meta.totalPages);
        setTotalCount(res.data.meta.total);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (userId: string) => {
    try {
      setTogglingId(userId);
      await apiFetch(`/users/${userId}/toggle-active`, { method: 'PATCH' });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Durum güncellenemedi');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      user.fullName.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      !!user.phone?.includes(searchQuery);
    return matchesSearch && (filter === 'ALL' || user.role === filter);
  });

  const rowActions = (user: ApiUser) => (
    <Button
      variant={user.isActive ? 'danger' : 'outline'}
      size="sm"
      onClick={() => handleToggleStatus(user.id)}
      disabled={togglingId === user.id}
    >
      {togglingId === user.id ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : user.isActive ? (
        <PowerOff className="h-4 w-4" aria-hidden />
      ) : (
        <Power className="h-4 w-4" aria-hidden />
      )}
      {user.isActive ? 'Pasife al' : 'Aktifleştir'}
    </Button>
  );

  const columns: Column<ApiUser>[] = [
    {
      key: 'user',
      header: 'Kullanıcı',
      mobile: 'primary',
      cell: (u) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-primary-solid text-xs font-bold text-on-primary">
            {initials(u.fullName)}
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold text-fg">{u.fullName}</div>
            <div className="truncate text-xs text-fg-muted">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Telefon',
      mobile: 'meta',
      cell: (u) => <span className="tnum text-fg-muted">{u.phone ?? '—'}</span>,
    },
    {
      key: 'role',
      header: 'Rol',
      cell: (u) => <StatusBadge map={USER_ROLE} value={u.role} />,
    },
    {
      key: 'createdAt',
      header: 'Kayıt Tarihi',
      cell: (u) => <span className="text-fg-muted">{formatDate(u.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Durum',
      cell: (u) => <Badge tone={u.isActive ? 'success' : 'error'}>{u.isActive ? 'Aktif' : 'Pasif'}</Badge>,
    },
    {
      key: 'actions',
      header: 'İşlem',
      align: 'right',
      mobile: false,
      cell: (u) => <div className="flex justify-end">{rowActions(u)}</div>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Kullanıcı Yönetimi"
        subtitle={`${totalCount} kullanıcı`}
        actions={
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            Yenile
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <Input
          icon={Search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="İsim, e-posta veya telefon ara…"
          aria-label="Kullanıcı ara"
        />
        <Tabs<Filter>
          ariaLabel="Rol filtresi"
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'ALL', label: 'Tümü' },
            { value: 'CUSTOMER', label: 'Müşteriler' },
            { value: 'SALON_OWNER', label: 'Salon Sahipleri' },
          ]}
        />
      </div>

      {error ? <ErrorState message={error} onRetry={fetchUsers} /> : null}

      <DataTable<ApiUser>
        rows={filtered}
        columns={columns}
        rowKey={(u) => u.id}
        loading={loading}
        actions={rowActions}
        minWidthClass="min-w-[42rem]"
        emptyTitle="Kullanıcı bulunamadı"
        emptyDescription="Arama veya rol filtresini değiştirin."
      />

      <Pagination page={currentPage} totalPages={totalPages} onPage={setCurrentPage} />
    </>
  );
}
