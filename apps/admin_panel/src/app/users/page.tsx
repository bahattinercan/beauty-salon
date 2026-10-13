'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ToggleRight,
  ToggleLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

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
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'CUSTOMER' | 'SALON_OWNER'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<ApiResponse>(
        `/users?page=${currentPage}&limit=${ITEMS_PER_PAGE}`
      );
      if (res.success && res.data) {
        setUsers(res.data.data || []);
      } else {
        setUsers([]);
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
      await apiFetch(`/users/${userId}/toggle-active`, {
        method: 'PATCH',
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Durum güncellenemedi');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery));

    const matchesFilter = filter === 'ALL' || user.role === filter;

    return matchesSearch && matchesFilter;
  });

  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (fullName[0] || '?').toUpperCase();
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case 'CUSTOMER':
        return 'bg-blue-100 text-blue-800';
      case 'SALON_OWNER':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
          <p className="text-gray-600 mt-1">Salon müşteri ve sahibi hesaplarını yönetin</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="İsim, e-posta veya telefon ile ara..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-3 font-medium transition-colors ${
              filter === 'ALL'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilter('CUSTOMER')}
            className={`px-4 py-3 font-medium transition-colors ${
              filter === 'CUSTOMER'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Müşteriler
          </button>
          <button
            onClick={() => setFilter('SALON_OWNER')}
            className={`px-4 py-3 font-medium transition-colors ${
              filter === 'SALON_OWNER'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Salon Sahipleri
          </button>
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
                    Kullanıcı
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Telefon
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Rol
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Kayıt Tarihi
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Durum
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
                            {getInitials(user.fullName)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.fullName}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700">{user.phone || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {user.role === 'CUSTOMER'
                            ? 'Müşteri'
                            : user.role === 'SALON_OWNER'
                            ? 'Salon Sahibi'
                            : 'Admin'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700">{formatDate(user.createdAt)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              user.isActive ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              user.isActive ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {user.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            disabled={togglingId === user.id}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                            title={user.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                          >
                            {togglingId === user.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : user.isActive ? (
                              <ToggleRight className="w-5 h-5 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Hiçbir kullanıcı bulunamadı
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
              disabled={users.length < ITEMS_PER_PAGE || loading}
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
