/**
 * Page Node Component
 *
 * Visual representation of a page in the funnel builder.
 * Shows page type, name, and analytics metrics.
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PageNodeData } from './types';
import {
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Gift,
  CheckCircle,
  Users,
  LayoutDashboard,
} from 'lucide-react';
import { PageType } from '@/types';
import clsx from 'clsx';

const PAGE_TYPE_ICONS: Record<PageType, React.ReactNode> = {
  Landing: <FileText className="w-4 h-4" />,
  Sales: <DollarSign className="w-4 h-4" />,
  Checkout: <CheckCircle className="w-4 h-4" />,
  Upsell: <TrendingUp className="w-4 h-4" />,
  Downsell: <TrendingDown className="w-4 h-4" />,
  ThankYou: <Gift className="w-4 h-4" />,
  Webinar: <Users className="w-4 h-4" />,
  Membership: <LayoutDashboard className="w-4 h-4" />,
  Custom: <FileText className="w-4 h-4" />,
};

const PAGE_TYPE_COLORS: Record<PageType, string> = {
  Landing: 'bg-blue-500',
  Sales: 'bg-green-500',
  Checkout: 'bg-yellow-500',
  Upsell: 'bg-purple-500',
  Downsell: 'bg-orange-500',
  ThankYou: 'bg-pink-500',
  Webinar: 'bg-indigo-500',
  Membership: 'bg-teal-500',
  Custom: 'bg-gray-500',
};

export const PageNode: React.FC<NodeProps<PageNodeData>> = ({ data, selected }) => {
  const colorClass = PAGE_TYPE_COLORS[data.pageType];
  const icon = PAGE_TYPE_ICONS[data.pageType];

  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow-md border-2 min-w-[200px]',
        selected ? 'border-blue-500' : 'border-gray-200',
        'hover:shadow-lg transition-shadow'
      )}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      {/* Header */}
      <div className={clsx('px-4 py-2 rounded-t-lg text-white flex items-center gap-2', colorClass)}>
        {icon}
        <span className="font-medium text-sm">{data.pageType}</span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{data.name}</h3>
        <p className="text-xs text-gray-500 mb-3">{data.title}</p>

        {/* Stats */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Visits:</span>
            <span className="font-medium">{data.visits.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Conversions:</span>
            <span className="font-medium">{data.conversions.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Rate:</span>
            <span className="font-medium text-green-600">{data.conversionRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-3">
          <span
            className={clsx(
              'inline-block px-2 py-1 text-xs rounded-full',
              data.status === 'Published'
                ? 'bg-green-100 text-green-800'
                : data.status === 'Draft'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            )}
          >
            {data.status}
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};
