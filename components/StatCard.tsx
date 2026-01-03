'use client';

import type { ReactElement } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  accent: string;
}

export function StatCard({ label, value, accent }: StatCardProps): ReactElement {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 transition-all hover:border-gray-700 hover:shadow-lg">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-3 ${accent}`}>{value}</p>
    </div>
  );
}