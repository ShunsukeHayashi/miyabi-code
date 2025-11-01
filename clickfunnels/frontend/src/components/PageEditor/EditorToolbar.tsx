/**
 * Editor Toolbar Component
 *
 * Toolbar for the page editor with save, publish, preview, and export actions.
 */

import React from 'react';
import { ArrowLeft, Save, Eye, Upload, Download } from 'lucide-react';
import { DetailedPage } from '@/types';
import clsx from 'clsx';

interface EditorToolbarProps {
  page: DetailedPage | null;
  isSaving: boolean;
  isPublishing: boolean;
  onSave: () => void;
  onPublish: () => void;
  onPreview: () => void;
  onExport: () => void;
  onBack: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  page,
  isSaving,
  isPublishing,
  onSave,
  onPublish,
  onPreview,
  onExport,
  onBack,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="h-6 w-px bg-gray-300" />

        <div>
          <h2 className="text-lg font-semibold text-gray-900">{page?.name || 'Page Editor'}</h2>
          <p className="text-xs text-gray-500">
            {page?.status === 'Published' ? (
              <span className="text-green-600 font-medium">Published</span>
            ) : (
              <span className="text-yellow-600 font-medium">Draft</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Preview */}
        <button
          onClick={onPreview}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>

        {/* Export */}
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <Download className="w-4 h-4" />
          Export
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className={clsx(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg transition',
            isSaving
              ? 'bg-blue-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        {/* Publish */}
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className={clsx(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg transition',
            isPublishing
              ? 'bg-green-400 text-white cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          )}
        >
          <Upload className="w-4 h-4" />
          {isPublishing ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
};
