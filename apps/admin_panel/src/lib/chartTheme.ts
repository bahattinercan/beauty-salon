'use client';

import { useMemo } from 'react';
import { useTheme } from '@/providers/ThemeProvider';

/**
 * Recharts SVG üretir; `fill="var(--x)"` presentation attribute olarak
 * güvenilir değildir. Bu yüzden çözülen temaya göre doğrudan hex döneriz.
 */
export interface ChartTheme {
  grid: string;
  axis: string;
  tooltip: {
    contentStyle: {
      background: string;
      border: string;
      borderRadius: number;
      color: string;
    };
    labelStyle: { color: string };
    itemStyle: { color: string };
  };
  bar: string;
  pieStroke: string;
}

const LIGHT: Omit<ChartTheme, 'tooltip'> & { tooltip: ChartTheme['tooltip'] } = {
  grid: '#E5E7EB',
  axis: '#9CA3AF',
  tooltip: {
    contentStyle: {
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: 8,
      color: '#2D2D2D',
    },
    labelStyle: { color: '#2D2D2D' },
    itemStyle: { color: '#6B7280' },
  },
  bar: '#B76E79',
  pieStroke: '#FFFFFF',
};

const DARK: ChartTheme = {
  grid: '#2F282C',
  axis: '#8D8388',
  tooltip: {
    contentStyle: {
      background: '#262023',
      border: '1px solid #3A3135',
      borderRadius: 8,
      color: '#F0ECEE',
    },
    labelStyle: { color: '#F0ECEE' },
    itemStyle: { color: '#B0A6AB' },
  },
  bar: '#D9959F',
  pieStroke: '#1C181B',
};

export function useChartTheme(): ChartTheme {
  const { resolved } = useTheme();
  return useMemo(() => (resolved === 'dark' ? DARK : LIGHT), [resolved]);
}

export default useChartTheme;
