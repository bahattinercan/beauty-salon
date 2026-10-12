'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiFetch } from '@/lib/api';

// ==================== TYPES ====================

interface AppointmentStatus {
  name: string;
  value: number;
  color: string;
}

interface MonthlyAppointment {
  name: string;
  appointments: number;
}

interface RecentReview {
  id: string;
  rating: number;
  comment: string;
  customer: { fullName: string };
  salon: { name: string };
  createdAt: string;
}

interface DashboardStats {
  totalUsers: number;
  totalSalons: number;
  totalAppointments: number;
  pendingSalons: number;
  recentAppointments: number;
  newUsersThisWeek: number;
  totalRevenue: string;
  completedAppointments: number;
}

interface DashboardData {
  stats: DashboardStats;
  appointmentsByStatus: AppointmentStatus[];
  monthlyAppointments: MonthlyAppointment[];
  recentReviews: RecentReview[];
}

interface DashboardContextType {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ==================== CONTEXT ====================

const DashboardContext = createContext<DashboardContextType>({
  data: null,
  loading: true,
  error: null,
  refetch: () => {},
});

// ==================== PROVIDER ====================

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);

      const result = await apiFetch<{ success: boolean; data: DashboardData; message?: string }>(
        '/admin/dashboard'
      );

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Bilinmeyen hata');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Veri yüklenirken bir hata oluştu';
      setError(message);
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DashboardContext.Provider value={{ data, loading, error, refetch: fetchData }}>
      {children}
    </DashboardContext.Provider>
  );
}

// ==================== HOOK ====================

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

export default DashboardProvider;
