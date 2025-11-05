import { createBrowserRouter, RouteObject } from 'react-router-dom';
import App from './App';
import DashboardView from './views/DashboardView';
import WorktreesView from './views/WorktreesView';
import AgentsView from './views/AgentsView';
import IssuesView from './views/IssuesView';
import HistoryView from './views/HistoryView';
import { useDashboard } from './hooks/useDashboard';
import UnifiedDashboardView from './views/UnifiedDashboardView';

// Dashboard wrapper component with data fetching
function DashboardRoute() {
  const dashboard = useDashboard();
  return (
    <DashboardView
      data={dashboard.data}
      loading={dashboard.loading}
      error={dashboard.error}
      onNavigate={(view) => {
        // Navigation will be handled by React Router
        window.location.hash = `#/${view}`;
      }}
    />
  );
}

// Placeholder component for unimplemented views
function PlaceholderView({ view, title, description }: { view: string; title: string; description: string }) {
  return (
    <div className="p-6 bg-background-light rounded-lg border border-background-lighter">
      <h3 className="text-lg font-extralight mb-2">{title}</h3>
      <p className="text-sm text-foreground-muted">{description}</p>
      <div className="mt-4 text-xs text-foreground-muted">
        <p>Coming in Sprint {
          view === 'agents' ? '4' :
          view === 'issues' ? '5' :
          view === 'history' ? '6' :
          view === 'settings' ? '7' : 'TBD'
        }</p>
      </div>
    </div>
  );
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <DashboardRoute />,
      },
      {
        path: 'dashboard',
        element: <DashboardRoute />,
      },
      {
        path: 'unified-dashboard',
        element: <UnifiedDashboardView />,
      },
      {
        path: 'worktrees',
        element: <WorktreesView />,
      },
      {
        path: 'agents',
        element: <AgentsView />,
      },
      {
        path: 'issues',
        element: <IssuesView />,
      },
      {
        path: 'history',
        element: <HistoryView />,
      },
      {
        path: 'settings',
        element: (
          <PlaceholderView
            view="settings"
            title="⚙️ Settings"
            description="Adjust preferences, integrations, and themes for Miyabi Desktop."
          />
        ),
      },
    ],
  },
];

export const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});
