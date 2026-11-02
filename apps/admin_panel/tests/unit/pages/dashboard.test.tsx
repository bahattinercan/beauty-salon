/**
 * AP-011 — `app/page.tsx` (Panel / Dashboard)
 *
 * Kapsam: Panel sayfasının `today(locale)` (`Intl.DateTimeFormat`) ve
 * `money(value, locale)` (`Intl.NumberFormat`) yardımcıları aktif `locale` ile
 * çalışır:
 *  - `initialMode="tr"` iken Türkçe başlık, Türkçe uzun tarih ve `₺12.500`,
 *  - `initialMode="en"` iken İngilizce başlık, İngilizce uzun tarih ve `TRY 12,500`.
 */
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

const { useDashboardMock } = vi.hoisted(() => ({ useDashboardMock: vi.fn() }));

vi.mock('@/providers/DashboardProvider', () => ({ useDashboard: useDashboardMock }));
// Recharts ResponsiveContainer jsdom'da ölçü hesaplamaz; grafik kabukları hafif
// sarmalayıcılarla stub'lanır ki test yalnız sayfa metin/biçimlendirmesini ölçsün.
vi.mock('recharts', () => {
  const Box = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Box,
    BarChart: Box,
    PieChart: Box,
    Pie: Box,
    Bar: () => null,
    Cell: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null,
  };
});

import DashboardPage from '@/app/page';
import type { DashboardData } from '@/providers/DashboardProvider';
import LocaleProvider from '@/providers/LocaleProvider';
import ThemeProvider from '@/providers/ThemeProvider';

// Fixture, API sözleşmesine (`GET /admin/dashboard`) bağlıdır: tip uyuşmazlığı
// `tsc --noEmit` ile yakalanır (#14).
const dashboardFixture: DashboardData = {
  stats: {
    totalUsers: 120,
    totalSalons: 15,
    totalAppointments: 340,
    pendingSalons: 2,
    recentAppointments: 28,
    newUsersThisWeek: 9,
    totalRevenue: 12500,
    completedAppointments: 290,
  },
  appointmentsByStatus: [{ name: 'COMPLETED', value: 290, color: '#2F6B4F' }],
  monthlyAppointments: [{ name: 'Eki', appointments: 48 }],
  recentReviews: [],
};

describe('DashboardPage i18n ve tarih/para biçimlendirmesi', () => {
  // #14 — API `totalRevenue` alanını number döndürür; istemci tipi de number olmalı.
  test('sözleşme: totalRevenue number tipinde olmalı (#14)', () => {
    const revenue: number = dashboardFixture.stats.totalRevenue;
    expect(typeof revenue).toBe('number');
    expect(Number.isFinite(revenue)).toBe(true);
  });

  test('tr modunda Türkçe başlık, bugünün Türkçe tarihi ve ₺ biçimli gelir basılır', () => {
    useDashboardMock.mockReturnValue({
      data: dashboardFixture,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <LocaleProvider initialMode="tr">
        <ThemeProvider>
          <DashboardPage />
        </ThemeProvider>
      </LocaleProvider>
    );

    const trToday = new Intl.DateTimeFormat('tr', { dateStyle: 'long' }).format(new Date());
    const trMoney = new Intl.NumberFormat('tr', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(12500);

    expect(screen.getByRole('heading', { name: 'Panel' })).toBeTruthy();
    expect(screen.getByText(trToday)).toBeTruthy();
    expect(screen.getByText('Toplam Gelir')).toBeTruthy();
    expect(screen.getByText(trMoney)).toBeTruthy();
  });

  test('en modunda İngilizce başlık, bugünün İngilizce tarihi ve TRY biçimli gelir basılır', () => {
    useDashboardMock.mockReturnValue({
      data: dashboardFixture,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <LocaleProvider initialMode="en">
        <ThemeProvider>
          <DashboardPage />
        </ThemeProvider>
      </LocaleProvider>
    );

    const enToday = new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date());
    const trToday = new Intl.DateTimeFormat('tr', { dateStyle: 'long' }).format(new Date());
    const enMoney = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(12500);
    const trMoney = new Intl.NumberFormat('tr', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(12500);

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy();
    expect(screen.getByText(enToday)).toBeTruthy();
    expect(enToday).not.toBe(trToday);
    expect(screen.getByText('Total revenue')).toBeTruthy();
    expect(screen.getByText(enMoney, { collapseWhitespace: false })).toBeTruthy();
    expect(screen.queryByText(trMoney, { collapseWhitespace: false })).toBeNull();
  });
});
