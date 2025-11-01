/**
 * Properties Panel Component
 *
 * Sidebar panel for editing page properties.
 */

import React from 'react';
import { Node } from 'reactflow';
import { PageNodeData } from './types';
import { X, Trash2 } from 'lucide-react';
import { PageType, PageStatus } from '@/types';

interface PropertiesPanelProps {
  node: Node<PageNodeData>;
  onUpdate: (updates: Partial<PageNodeData>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  node,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const { data } = node;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Page Properties</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Page Name
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Page Title
          </label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Page Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Page Type
          </label>
          <select
            value={data.pageType}
            onChange={(e) => onUpdate({ pageType: e.target.value as PageType })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Landing">Landing Page</option>
            <option value="Sales">Sales Page</option>
            <option value="Checkout">Checkout</option>
            <option value="Upsell">Upsell</option>
            <option value="Downsell">Downsell</option>
            <option value="ThankYou">Thank You</option>
            <option value="Webinar">Webinar</option>
            <option value="Membership">Membership</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={data.status}
            onChange={(e) => onUpdate({ status: e.target.value as PageStatus })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        {/* Analytics (Read-only) */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Analytics</h4>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Visits</span>
              <span className="font-medium">{data.visits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Conversions</span>
              <span className="font-medium">{data.conversions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Conversion Rate</span>
              <span className="font-medium text-green-600">
                {data.conversionRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this page?')) {
              onDelete();
            }
          }}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <Trash2 className="w-4 h-4" />
          Delete Page
        </button>
      </div>
    </div>
  );
};
