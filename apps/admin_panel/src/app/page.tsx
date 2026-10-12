'use client';

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Building2, Users, Calendar, Star, TrendingUp, TrendingDown, CheckCircle, Clock, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useDashboard } from '@/providers/DashboardProvider';

// Stat Card Component
function StatCard({
  icon: Icon,
  value,
  label,
  percentage,
  isPositive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  percentage?: number;
  isPositive?: boolean;
}) {
  return (
    <div className="flex-1 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {percentage !== undefined && isPositive !== undefined && (
            <div className="mt-3 flex items-center gap-1">
              {isPositive ? (
                <>
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-xs font-medium text-success">
                    +{percentage}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-medium text-red-500">-{percentage}%</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="rounded-full p-3 bg-secondary">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}

// Star Rating Component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium';
  if (status === 'Onaylı') {
    return (
      <span className={`${baseClasses} bg-green-100 text-green-800`}>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          {status}
        </div>
      </span>
    );
  }
  return (
    <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {status}
      </div>
    </span>
  );
}

// Loading State
function DashboardLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm text-gray-500">Veriler yükleniyor...</p>
      </div>
    </div>
  );
}

// Error State
function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-3">
        <XCircle className="mt-1 h-5 w-5 text-red-500" />
        <div className="flex-1">
          <h3 className="font-medium text-red-800">Veri Yükleme Hatası</h3>
          <p className="mt-1 text-sm text-red-600">{message}</p>
          <button
            onClick={onRetry}
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

export default function Dashboard() {
  const { data, loading, error, refetch } = useDashboard();
  const today = new Date();
  const formattedDate = today.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <DashboardLoading />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <DashboardError message={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <DashboardError message="Veri bulunamadı" onRetry={refetch} />
        </div>
      </div>
    );
  }

  const { stats, appointmentsByStatus, monthlyAppointments, recentReviews } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kontrol Paneli</h1>
            <p className="mt-1 text-sm text-gray-600">{formattedDate}</p>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </button>
        </div>

        {/* Stat Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Building2}
            value={stats.totalSalons.toLocaleString('tr-TR')}
            label="Toplam Salon"
            percentage={12}
            isPositive={true}
          />
          <StatCard
            icon={Users}
            value={stats.totalUsers.toLocaleString('tr-TR')}
            label="Toplam Kullanıcı"
            percentage={8}
            isPositive={true}
          />
          <StatCard
            icon={Calendar}
            value={stats.totalAppointments.toLocaleString('tr-TR')}
            label="Toplam Randevu"
            percentage={5}
            isPositive={true}
          />
          <StatCard
            icon={Star}
            value={`₺${parseFloat(stats.totalRevenue).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
            label="Toplam Gelir"
            percentage={15}
            isPositive={true}
          />
        </div>

        {/* Charts Section */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Monthly Appointments Chart */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Aylık Randevu</h2>
            {monthlyAppointments.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyAppointments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="appointments" fill="#B76E79" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-gray-500">
                Veri yok
              </div>
            )}
          </div>

          {/* Appointment Status Chart */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Randevu Durumları</h2>
            {appointmentsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={appointmentsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} (${value})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {appointmentsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-gray-500">
                Veri yok
              </div>
            )}
          </div>
        </div>

        {/* Stats Summary Row */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Bekleyen Salon</p>
                <p className="text-xl font-bold text-gray-900">{stats.pendingSalons}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tamamlanan Randevu</p>
                <p className="text-xl font-bold text-gray-900">{stats.completedAppointments.toLocaleString('tr-TR')}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Bu Hafta Yeni Kullanıcı</p>
                <p className="text-xl font-bold text-gray-900">{stats.newUsersThisWeek}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Son Yorumlar</h2>
          </div>
          {recentReviews && recentReviews.length > 0 ? (
            <div className="space-y-4 p-6">
              {recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex gap-4 border-b border-gray-100 pb-4 last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.customer?.fullName || 'Bilinmeyen Kullanıcı'}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">{review.salon?.name || 'Bilinmeyen Salon'}</p>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-gray-500">
              Yorum bulunamadı
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
