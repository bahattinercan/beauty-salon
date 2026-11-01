'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import type { Locale } from '@/lib/i18n';
import { useI18n } from '@/providers/LocaleProvider';

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

function formatDate(dateString: string, locale: Locale = 'tr'): string {
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const ROLE_LABEL_KEYS: Record<UserRole, string> = {
  ADMIN: 'pages.users.roles.admin',
  SALON_OWNER: 'pages.users.roles.salonOwner',
  CUSTOMER: 'pages.users.roles.customer',
};

type Filter = 'ALL' | 'CUSTOMER' | 'SALON_OWNER';

export default function UsersPage() {
  const { locale, t } = useI18n();
  // Rol etiketleri paylaşılan `USER_ROLE` map'inden gelir; renk tonu orada
  // kalır, yalnız etiket aktif dile çevrilir (Badge bileşeni değişmez).
  const roleMap = useMemo(
    () => ({
      ADMIN: { ...USER_ROLE.ADMIN, label: t(ROLE_LABEL_KEYS.ADMIN) },
      SALON_OWNER: { ...USER_ROLE.SALON_OWNER, label: t(ROLE_LABEL_KEYS.SALON_OWNER) },
      CUSTOMER: { ...USER_ROLE.CUSTOMER, label: t(ROLE_LABEL_KEYS.CUSTOMER) },
    }),
    [t]
  );
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
      setError(err instanceof Error ? err.message : t('pages.users.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (userId: string) => {
    try {
      setTogglingId(userId);
      await apiFetch(`/users/${userId}/toggle-active`, { method: 'PATCH' });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t('pages.users.errorToggle'));
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
      {user.isActive ? t('pages.users.deactivate') : t('pages.users.activate')}
    </Button>
  );

  const columns: Column<ApiUser>[] = [
    {
      key: 'user',
      header: t('pages.users.columns.user'),
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
      header: t('pages.users.columns.phone'),
      mobile: 'meta',
      cell: (u) => <span className="tnum text-fg-muted">{u.phone ?? '—'}</span>,
    },
    {
      key: 'role',
      header: t('pages.users.columns.role'),
      cell: (u) => <StatusBadge map={roleMap} value={u.role} />,
    },
    {
      key: 'createdAt',
      header: t('pages.users.columns.createdAt'),
      cell: (u) => <span className="text-fg-muted">{formatDate(u.createdAt, locale)}</span>,
    },
    {
      key: 'status',
      header: t('pages.users.columns.status'),
      cell: (u) => (
        <Badge tone={u.isActive ? 'success' : 'error'}>
          {u.isActive ? t('pages.users.statusActive') : t('pages.users.statusInactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('pages.users.columns.actions'),
      align: 'right',
      mobile: false,
      cell: (u) => <div className="flex justify-end">{rowActions(u)}</div>,
    },
  ];

  return (
    <>
      <PageHeader
        title={t('pages.users.title')}
        subtitle={t('pages.users.subtitle', { count: totalCount })}
        actions={
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            {t('pages.users.refresh')}
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <Input
          icon={Search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('pages.users.searchPlaceholder')}
          aria-label={t('pages.users.searchAriaLabel')}
        />
        <Tabs<Filter>
          ariaLabel={t('pages.users.filterAriaLabel')}
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'ALL', label: t('pages.users.filterAll') },
            { value: 'CUSTOMER', label: t('pages.users.filterCustomers') },
            { value: 'SALON_OWNER', label: t('pages.users.filterSalonOwners') },
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
        emptyTitle={t('pages.users.emptyTitle')}
        emptyDescription={t('pages.users.emptyDescription')}
      />

      <Pagination page={currentPage} totalPages={totalPages} onPage={setCurrentPage} />
    </>
  );
}
