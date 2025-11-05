import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import NotificationToast from './components/NotificationToast';

const enableUnifiedDashboardPreview = true;

export default function App() {
  const [appVersion, setAppVersion] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    window.electron.app
      .getVersion()
      .then((version) => {
        if (mounted) setAppVersion(version);
      })
      .catch(() => {
        if (mounted) setAppVersion('dev');
      });
    return () => {
      mounted = false;
    };
  }, []);

  const navItems = useMemo(() => {
    const core = [
      { key: 'dashboard' as const, label: 'Dashboard', icon: '🏠', path: '/dashboard' },
      { key: 'worktrees' as const, label: 'Worktrees', icon: '🌲', path: '/worktrees' },
      { key: 'agents' as const, label: 'Agents', icon: '🤖', path: '/agents' },
      { key: 'issues' as const, label: 'Issues', icon: '📋', path: '/issues' },
      { key: 'history' as const, label: 'History', icon: '📊', path: '/history' },
      { key: 'settings' as const, label: 'Settings', icon: '⚙️', path: '/settings' },
    ];

    if (!enableUnifiedDashboardPreview) {
      return core;
    }

    return [
      { key: 'unified-preview' as const, label: 'Unified (Preview)', icon: '🧭', path: '/unified-dashboard' },
      ...core,
    ];
  }, []);

  // Determine active navigation item based on current path
  const activeNav = navItems.find((n) => location.pathname === n.path) ?? navItems[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Notification Toast Overlay */}
      <NotificationToast position="top-right" />

      {/* Header - Draggable window region */}
      <header
        className="border-b border-background-lighter"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-extralight">Miyabi Desktop</div>
            <span className="text-xs text-foreground-muted">v{appVersion || 'dev'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex h-[calc(100vh-73px)]" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Sidebar */}
        <aside className="w-64 border-r border-background-lighter bg-background-light">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <NavItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                active={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              />
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-extralight mb-8">{activeNav.label}</h1>
            <Outlet />
          </div>
        </div>
      </main>

      {/* Status Bar */}
      <footer
        className="border-t border-background-lighter bg-background-light"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="flex items-center justify-between px-6 py-2 text-xs text-foreground-muted">
          <div>Ready</div>
          <div className="flex items-center gap-4">
            <span>Miyabi Desktop MVP</span>
            <span>Sprints 0-7 Complete ✅</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

type NavKey =
  | 'unified-preview'
  | 'dashboard'
  | 'worktrees'
  | 'agents'
  | 'issues'
  | 'history'
  | 'settings';

type NavItemProps = {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

function NavItem({ icon, label, active = false, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
        active
          ? 'bg-background-lighter text-foreground'
          : 'text-foreground-muted hover:bg-background-lighter hover:text-foreground'
      }`}
    >
      <span>{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function PlaceholderView({ view }: { view: NavKey }) {
  const descriptions: Record<Exclude<NavKey, 'dashboard' | 'unified-preview'>, string> = {
    worktrees: 'Monitor active branches and worktree health. This view will display active worktrees, orphan detection, and clean-up actions.',
    agents: 'Manage and configure Miyabi agent assignments, parameters, and dependencies.',
    issues: 'Review GitHub issues, track progress, and manage synchronization between worktrees and tasks.',
    history: 'Inspect past runs, outcomes, and audit logs in a timeline with analytics.',
    settings: 'Adjust preferences, integrations, and themes for Miyabi Desktop.',
  };

  if (view === 'dashboard') {
    return null;
  }

  if (view === 'unified-preview') {
    return null;
  }

  const titleMap: Record<Exclude<NavKey, 'dashboard' | 'unified-preview'>, string> = {
    worktrees: '🌲 Worktrees',
    agents: '🤖 Agents',
    issues: '📋 Issues',
    history: '📊 History',
    settings: '⚙️ Settings',
  };

  return (
    <div className="p-6 bg-background-light rounded-lg border border-background-lighter">
      <h3 className="text-lg font-extralight mb-2">{titleMap[view]}</h3>
      <p className="text-sm text-foreground-muted">{descriptions[view]}</p>
    </div>
  );
}
