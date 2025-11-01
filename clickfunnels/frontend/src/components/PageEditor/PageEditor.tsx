/**
 * Page Editor Component (T031)
 *
 * WYSIWYG page editor using GrapeJS.
 * Allows users to visually build landing pages with drag-and-drop.
 */

import React, { useEffect, useRef, useState } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import gjsPresetWebpage from 'grapesjs-preset-webpage';
import { EditorToolbar } from './EditorToolbar';
import { api } from '@/lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import { DetailedPage } from '@/types';

export const PageEditor: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [page, setPage] = useState<DetailedPage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Initialize GrapeJS editor
  useEffect(() => {
    if (!editorRef.current || editor) return;

    const grapesEditor = grapesjs.init({
      container: editorRef.current,
      height: '100%',
      width: 'auto',
      plugins: [gjsPresetWebpage],
      pluginsOpts: {
        [gjsPresetWebpage]: {
          blocks: ['link-block', 'quote', 'text-basic'],
          modalImportTitle: 'Import Template',
          modalImportLabel: '<div>Paste HTML/CSS</div>',
          modalImportContent: (editor: Editor) => {
            return editor.getHtml() + '<style>' + editor.getCss() + '</style>';
          },
        },
      },
      storageManager: false, // Disable default storage
      canvas: {
        styles: [
          'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
        ],
      },
      blockManager: {
        appendTo: '#blocks',
      },
      styleManager: {
        appendTo: '#styles-container',
        sectors: [
          {
            name: 'Dimension',
            open: false,
            buildProps: ['width', 'min-height', 'padding', 'margin'],
          },
          {
            name: 'Typography',
            open: false,
            buildProps: [
              'font-family',
              'font-size',
              'font-weight',
              'letter-spacing',
              'color',
              'line-height',
              'text-align',
              'text-decoration',
              'text-shadow',
            ],
          },
          {
            name: 'Decorations',
            open: false,
            buildProps: [
              'background-color',
              'border-radius',
              'border',
              'box-shadow',
              'background',
            ],
          },
        ],
      },
      layerManager: {
        appendTo: '#layers-container',
      },
      traitManager: {
        appendTo: '#traits-container',
      },
    });

    setEditor(grapesEditor);

    return () => {
      grapesEditor.destroy();
    };
  }, []);

  // Load page content
  useEffect(() => {
    if (pageId && editor) {
      loadPage(pageId);
    }
  }, [pageId, editor]);

  const loadPage = async (id: string) => {
    try {
      const loadedPage = await api.getPage(id);
      setPage(loadedPage);

      if (editor) {
        // Load HTML and CSS into editor
        editor.setComponents(loadedPage.html_content || '');
        editor.setStyle(loadedPage.css_content || '');
      }
    } catch (error) {
      console.error('Failed to load page:', error);
      alert('Failed to load page. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!editor || !pageId) return;

    setIsSaving(true);
    try {
      const html = editor.getHtml();
      const css = editor.getCss();
      const js = editor.getJs();

      await api.updatePageContent(pageId, {
        html_content: html,
        css_content: css,
        js_content: js || undefined,
      });

      alert('Page saved successfully!');
    } catch (error) {
      console.error('Failed to save page:', error);
      alert('Failed to save page. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!pageId) return;

    // Save first
    await handleSave();

    setIsPublishing(true);
    try {
      await api.publishPage(pageId);
      alert('Page published successfully!');

      // Reload page to get published URL
      if (pageId) {
        await loadPage(pageId);
      }
    } catch (error) {
      console.error('Failed to publish page:', error);
      alert('Failed to publish page. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePreview = () => {
    if (!editor) return;

    const html = editor.getHtml();
    const css = `<style>${editor.getCss()}</style>`;
    const js = editor.getJs() ? `<script>${editor.getJs()}</script>` : '';

    const previewContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${page?.title || 'Preview'}</title>
          ${css}
        </head>
        <body>
          ${html}
          ${js}
        </body>
      </html>
    `;

    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(previewContent);
      previewWindow.document.close();
    }
  };

  const handleExport = () => {
    if (!editor) return;

    const html = editor.getHtml();
    const css = editor.getCss();
    const js = editor.getJs();

    const fullHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page?.title || 'Exported Page'}</title>
    <style>
${css}
    </style>
  </head>
  <body>
${html}
    ${js ? `<script>\n${js}\n    </script>` : ''}
  </body>
</html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page?.slug || 'page'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col">
      <EditorToolbar
        page={page}
        isSaving={isSaving}
        isPublishing={isPublishing}
        onSave={handleSave}
        onPublish={handlePublish}
        onPreview={handlePreview}
        onExport={handleExport}
        onBack={() => navigate(-1)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Blocks */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Blocks</h3>
            <div id="blocks" />
          </div>
        </div>

        {/* Editor Canvas */}
        <div className="flex-1 bg-gray-50">
          <div ref={editorRef} className="h-full" />
        </div>

        {/* Right Sidebar - Layers, Styles, Traits */}
        <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Layers */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Layers</h3>
              <div id="layers-container" />
            </div>

            {/* Styles */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Styles</h3>
              <div id="styles-container" />
            </div>

            {/* Traits */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
              <div id="traits-container" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
