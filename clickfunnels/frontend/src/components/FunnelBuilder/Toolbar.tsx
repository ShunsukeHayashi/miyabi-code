/**
 * Funnel Builder Toolbar
 *
 * Contains controls for adding pages and saving the funnel.
 */

import React from 'react';
import { Plus, Save } from 'lucide-react';
import { PageType } from '@/types';

interface ToolbarProps {
  onAddPage: (pageType: PageType) => void;
  onSave: () => void;
  isSaving: boolean;
}

const PAGE_TYPES: { value: PageType; label: string }[] = [
  { value: PageType.Landing, label: 'Landing Page' },
  { value: PageType.Sales, label: 'Sales Page' },
  { value: PageType.Checkout, label: 'Checkout' },
  { value: PageType.Upsell, label: 'Upsell' },
  { value: PageType.Downsell, label: 'Downsell' },
  { value: PageType.ThankYou, label: 'Thank You' },
  { value: PageType.Webinar, label: 'Webinar' },
  { value: PageType.Membership, label: 'Membership' },
];

export const Toolbar: React.FC<ToolbarProps> = ({ onAddPage, onSave, isSaving }) => {
  const [showPageMenu, setShowPageMenu] = React.useState(false);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Funnel Builder</h2>

        {/* Add Page Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPageMenu(!showPageMenu)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Page
          </button>

          {showPageMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowPageMenu(false)}
              />
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                {PAGE_TYPES.map((pageType) => (
                  <button
                    key={pageType.value}
                    onClick={() => {
                      onAddPage(pageType.value);
                      setShowPageMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    {pageType.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={isSaving}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        {isSaving ? 'Saving...' : 'Save Funnel'}
      </button>
    </div>
  );
};
