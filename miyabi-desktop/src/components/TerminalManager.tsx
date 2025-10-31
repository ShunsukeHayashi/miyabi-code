import { useState, useEffect, useRef } from 'react';
import { Terminal } from './Terminal';
import { Plus, X, Palette } from 'lucide-react';
import { colorSchemes, getThemeByName } from '../lib/themes';

interface TerminalTab {
  id: string;
  title: string;
}

export function TerminalManager() {
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: '1', title: 'Terminal 1' }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [fontSize, setFontSize] = useState(13);
  const [colorScheme, setColorScheme] = useState('dark');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const addTab = () => {
    const newId = Date.now().toString(); // より一意なID
    const newTab = {
      id: newId,
      title: `Terminal ${tabs.length + 1}`
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return; // Keep at least one tab

    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);

    // If closing active tab, switch to the first available tab
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const startEditingTab = (tabId: string, currentTitle: string) => {
    setEditingTabId(tabId);
    setEditingTitle(currentTitle);
  };

  const finishEditingTab = () => {
    if (editingTabId && editingTitle.trim()) {
      setTabs(tabs.map(tab =>
        tab.id === editingTabId
          ? { ...tab, title: editingTitle.trim() }
          : tab
      ));
    }
    setEditingTabId(null);
    setEditingTitle('');
  };

  const cancelEditingTab = () => {
    setEditingTabId(null);
    setEditingTitle('');
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 1, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 1, 8));
  };

  const resetFontSize = () => {
    setFontSize(13);
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editingTabId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTabId]);

  // Close theme menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };

    if (showThemeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showThemeMenu]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+T or Ctrl+T: New tab
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        addTab();
      }

      // Cmd+W or Ctrl+W: Close tab
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        if (tabs.length > 1) {
          closeTab(activeTabId);
        }
      }

      // Cmd+[1-9] or Ctrl+[1-9]: Switch to tab N
      if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        if (tabIndex < tabs.length) {
          setActiveTabId(tabs[tabIndex].id);
        }
      }

      // Cmd+[ or Ctrl+[: Previous tab
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        const currentIndex = tabs.findIndex(t => t.id === activeTabId);
        if (currentIndex > 0) {
          setActiveTabId(tabs[currentIndex - 1].id);
        }
      }

      // Cmd+] or Ctrl+]: Next tab
      if ((e.metaKey || e.ctrlKey) && e.key === ']') {
        e.preventDefault();
        const currentIndex = tabs.findIndex(t => t.id === activeTabId);
        if (currentIndex < tabs.length - 1) {
          setActiveTabId(tabs[currentIndex + 1].id);
        }
      }

      // Cmd++ or Ctrl++: Increase font size
      if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        increaseFontSize();
      }

      // Cmd+- or Ctrl+-: Decrease font size
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        decreaseFontSize();
      }

      // Cmd+0 or Ctrl+0: Reset font size
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        resetFontSize();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId]);

  return (
    <div className="h-full flex flex-col">
      {/* Tab Bar */}
      <div className="flex items-center bg-gray-100 border-b border-gray-200 px-4 py-2 space-x-2">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`
              group flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200
              ${activeTabId === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            {editingTabId === tab.id ? (
              <input
                ref={editInputRef}
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={finishEditingTab}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    finishEditingTab();
                  } else if (e.key === 'Escape') {
                    cancelEditingTab();
                  }
                }}
                className="text-sm font-light bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500 w-32"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                onClick={() => setActiveTabId(tab.id)}
                onDoubleClick={() => startEditingTab(tab.id, tab.title)}
                className="text-sm font-light"
                title="ダブルクリックで編集"
              >
                {index + 1}: {tab.title}
              </span>
            )}
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} strokeWidth={1.5} className="text-gray-400 hover:text-gray-900" />
              </button>
            )}
          </div>
        ))}

        {/* Add Tab Button */}
        <button
          onClick={addTab}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
          title="新しいターミナル (Cmd+T)"
        >
          <Plus size={16} strokeWidth={1.5} />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Font Size Controls */}
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <button
            onClick={decreaseFontSize}
            className="px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            title="フォントサイズを小さく (Cmd+-)"
          >
            A-
          </button>
          <span className="w-10 text-center font-mono">{fontSize}px</span>
          <button
            onClick={increaseFontSize}
            className="px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            title="フォントサイズを大きく (Cmd++)"
          >
            A+
          </button>
          <button
            onClick={resetFontSize}
            className="px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            title="リセット (Cmd+0)"
          >
            リセット
          </button>
        </div>

        {/* Color Scheme Selector */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex items-center space-x-1 px-3 py-1 rounded hover:bg-gray-200 transition-colors text-xs text-gray-500"
            title="カラースキーム"
          >
            <Palette size={14} />
            <span>{getThemeByName(colorScheme).displayName}</span>
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {colorSchemes.map((scheme) => (
                <button
                  key={scheme.name}
                  onClick={() => {
                    setColorScheme(scheme.name);
                    setShowThemeMenu(false);
                  }}
                  className={`
                    w-full text-left px-4 py-2 text-sm transition-colors
                    ${colorScheme === scheme.name
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {scheme.displayName}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 bg-gray-900 relative">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`absolute inset-0 ${activeTabId === tab.id ? 'block' : 'hidden'}`}
          >
            <Terminal tabId={tab.id} fontSize={fontSize} colorScheme={colorScheme} />
          </div>
        ))}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-900 border-t border-gray-700 px-4 py-1 flex items-center justify-between text-xs font-light">
        <div className="flex items-center space-x-4 text-gray-400">
          <span>[{tabs.findIndex(t => t.id === activeTabId) + 1}/{tabs.length}]</span>
          <span className="text-gray-600">•</span>
          <span>miyabi-desktop</span>
          <span className="text-gray-600">•</span>
          <span className="text-gray-500">フォント: {fontSize}px</span>
        </div>
        <div className="flex items-center space-x-3 text-gray-500">
          <span>Cmd+T: 新規</span>
          <span className="text-gray-600">•</span>
          <span>Cmd+W: 閉じる</span>
          <span className="text-gray-600">•</span>
          <span>Cmd+[1-9]: 切替</span>
          <span className="text-gray-600">•</span>
          <span>Cmd++/-: フォント</span>
          <span className="text-gray-600">•</span>
          <span>ダブルクリック: 名前変更</span>
        </div>
      </div>
    </div>
  );
}
