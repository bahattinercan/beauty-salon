'use client';

import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Store,
  Users,
  CalendarDays,
  Wallet,
  CheckCircle2,
  Clock,
  UserPlus,
  ArrowRight,
  Star,
} from 'lucide-react';
import { useDashboard } from '@/providers/DashboardProvider';
import useChartTheme from '@/lib/chartTheme';
import PageHeader from '@/components/shell/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import { Skeleton, ErrorState, EmptyState } from '@/components/ui/States';

function money(value: string) {
  const n = Number.parseFloat(value || '0');
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );
}

function today() {
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date());
}

export default function DashboardPage() {
  const { data, loading, error, refetch } = useDashboard();
  const chart = useChartTheme();

  if (error) {
    return (
      <>
        <PageHeader title="Panel" subtitle={today()} />
        <ErrorState message={error} onRetry={refetch} />
      </>
    );
  }

  if (loading || !data) {
    return (
      <>
        <PageHeader title="Panel" subtitle={today()} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="mt-4 h-80" />
      </>
    );
  }

  const { stats, appointmentsByStatus, monthlyAppointments, recentReviews } = data;
  const pending = stats.pendingSalons ?? 0;

  return (
    <>
      <PageHeader
        title="Panel"
        subtitle={today()}
        actions={
          <Button variant="outline" size="sm" onClick={refetch}>
            Yenile
          </Button>
        }
      />

      {/* Hero: mobil heroSurface kartının karşılığı. Lime yalnızca CTA dolgusu. */}
      <section className="mb-5 rounded-card bg-hero-surface p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          {pending > 0 ? 'Onay bekliyor' : 'Gündem yok'}
        </p>
        <h2 className="mt-1 max-w-2xl font-display text-xl font-extrabold text-fg sm:text-2xl">
          {pending > 0
            ? `${pending} salon başvurusu onay bekliyor`
            : 'Bekleyen salon başvurusu yok'}
        </h2>
        <p className="mt-1 max-w-xl text-sm text-fg-muted">
          {pending > 0
            ? 'Onaylanan salonlar müşteri uygulamada hemen görünür; sırayı bozmamak için bugünkü başvuruları gözden geçirin.'
            : 'Yeni başvuru geldikçe burada görünecek. Randevu akışını izlemek için randevulara bakabilirsiniz.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={pending > 0 ? '/salons?filter=bekliyor' : '/appointments'}>
            <Button variant="lime" size="sm">
              {pending > 0 ? 'Başvuruları incele' : 'Randevuları gör'}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
          <Link href="/users">
            <Button variant="outline" size="sm">
              Kullanıcılar
            </Button>
          </Link>
        </div>
      </section>

      {/* Ana sayılar — API'de büyüme verisi yok, bu yüzden sahte %12/%8 etiketleri kaldırıldı. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Toplam Salon" value={stats.totalSalons ?? 0} icon={Store} tone="primary" />
        <StatCard label="Toplam Kullanıcı" value={stats.totalUsers ?? 0} icon={Users} tone="info" />
        <StatCard
          label="Toplam Randevu"
          value={stats.totalAppointments ?? 0}
          icon={CalendarDays}
          tone="success"
          hint={`${stats.recentAppointments ?? 0} son 30 gün`}
        />
        <StatCard label="Toplam Gelir" value={money(stats.totalRevenue)} icon={Wallet} tone="warning" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Bekleyen Salon" value={pending} icon={Clock} tone="warning" />
        <StatCard
          label="Tamamlanan Randevu"
          value={stats.completedAppointments ?? 0}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard label="Bu Hafta Yeni Kullanıcı" value={stats.newUsersThisWeek ?? 0} icon={UserPlus} tone="info" />
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Aylık Randevu" description="Son 6 ay" />
          <CardBody>
            <div className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyAppointments} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke={chart.axis}
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: chart.grid }}
                  />
                  <YAxis stroke={chart.axis} fontSize={12} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'color-mix(in srgb, var(--primary) 8%, transparent)' }}
                    contentStyle={chart.tooltip.contentStyle}
                    labelStyle={chart.tooltip.labelStyle}
                    itemStyle={chart.tooltip.itemStyle}
                  />
                  <Bar dataKey="appointments" fill={chart.bar} radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card className="min-w-0">
          <CardHeader title="Randevu Durumları" />
          <CardBody>
            <div className="h-52 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentsByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={82}
                    paddingAngle={2}
                    stroke={chart.pieStroke}
                    strokeWidth={2}
                  >
                    {appointmentsByStatus.map((_, i) => (
                      <Cell key={i} fill={chart.series[i % chart.series.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={chart.tooltip.contentStyle}
                    itemStyle={chart.tooltip.itemStyle}
                    labelStyle={chart.tooltip.labelStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Dış etiketler dar ekranda taşmaya yol açıyordu; liste hâlinde legenda çevrildi. */}
            <ul className="mt-3 space-y-1.5">
              {appointmentsByStatus.map((entry, i) => (
                <li key={entry.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-pill"
                    style={{ background: chart.series[i % chart.series.length] }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-fg-muted">{entry.name}</span>
                  <span className="tnum font-semibold text-fg">{entry.value}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Son Yorumlar"
          action={
            <Link
              href="/reviews"
              className="inline-flex min-h-11 items-center rounded-field px-2 font-semibold text-primary hover:bg-surface-variant hover:underline"
            >
              Tümünü gör
            </Link>
          }
        />
        <CardBody>
          {recentReviews.length === 0 ? (
            <EmptyState title="Henüz yorum yok" description="Onaylanan randevulardan sonra yorumlar burada birikir." />
          ) : (
            <ul className="divide-y divide-border">
              {recentReviews.map((review) => (
                <li key={review.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-primary/12 text-sm font-bold text-primary">
                    {(review.customer?.fullName ?? '?').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-fg">{review.customer?.fullName}</span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-warning tnum">
                        <Star className="h-3.5 w-3.5" aria-hidden />
                        {review.rating}
                      </span>
                    </div>
                    {review.salon?.name ? (
                      <p className="truncate text-sm text-fg-muted">{review.salon.name}</p>
                    ) : null}
                    {review.comment ? (
                      <p className="mt-1 line-clamp-2 text-sm text-fg">{review.comment}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
