/**
 * Funnel Card Component
 *
 * Displays a funnel with key metrics.
 */

import React from 'react';
import { Funnel } from '@/types';
import { Eye, TrendingUp, DollarSign } from 'lucide-react';
import clsx from 'clsx';

interface FunnelCardProps {
  funnel: Funnel;
  onClick: () => void;
}

export const FunnelCard: React.FC<FunnelCardProps> = ({ funnel, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition border border-gray-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{funnel.name}</h3>
          {funnel.description && (
            <p className="text-sm text-gray-600 line-clamp-1">{funnel.description}</p>
          )}
        </div>
        <span
          className={clsx(
            'px-2 py-1 text-xs rounded-full',
            funnel.status === 'Published'
              ? 'bg-green-100 text-green-800'
              : funnel.status === 'Draft'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          )}
        >
          {funnel.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Eye className="w-4 h-4" />
          <span>{funnel.total_visits.toLocaleString()} visits</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>{funnel.conversion_rate.toFixed(1)}% conv.</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <DollarSign className="w-4 h-4" />
          <span>${(funnel.total_revenue / 100).toFixed(0)}</span>
        </div>
      </div>
    </button>
  );
};
