import { useState, useEffect } from 'react';

export default function App() {
  const [appVersion, setAppVersion] = useState<string>('');
  const [systemInfo, setSystemInfo] = useState<any>(null);

  useEffect(() => {
    // Load app version
    window.electron.app.getVersion().then(setAppVersion);

    // Load system info
    window.electron.system.getInfo().then(setSystemInfo);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-background-lighter">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-extralight">Miyabi Desktop</div>
            <span className="text-xs text-foreground-muted">v{appVersion}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-64 border-r border-background-lighter bg-background-light">
          <nav className="p-4 space-y-2">
            <NavItem icon="🏠" label="Dashboard" active />
            <NavItem icon="🌲" label="Worktrees" />
            <NavItem icon="🤖" label="Agents" />
            <NavItem icon="📋" label="Issues" />
            <NavItem icon="📊" label="History" />
            <NavItem icon="⚙️" label="Settings" />
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-extralight mb-8">Welcome to Miyabi Desktop</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card
                title="🚀 Getting Started"
                description="Open a Miyabi project to get started with autonomous development."
              >
                <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors">
                  Open Project
                </button>
              </Card>

              <Card
                title="📚 Documentation"
                description="Learn more about Miyabi's features and capabilities."
              >
                <button className="px-4 py-2 border border-foreground-muted text-foreground rounded-md hover:bg-background-lighter transition-colors">
                  View Docs
                </button>
              </Card>
            </div>

            {systemInfo && (
              <Card title="💻 System Information">
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-foreground-muted">Platform</dt>
                    <dd className="font-mono">{systemInfo.platform}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground-muted">Architecture</dt>
                    <dd className="font-mono">{systemInfo.arch}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground-muted">CPU Cores</dt>
                    <dd className="font-mono">{systemInfo.cpus}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground-muted">Memory</dt>
                    <dd className="font-mono">
                      {(systemInfo.totalMemory / 1024 / 1024 / 1024).toFixed(1)} GB
                    </dd>
                  </div>
                </dl>
              </Card>
            )}

            <div className="mt-8 p-6 bg-background-lighter rounded-lg border border-background-lighter">
              <h2 className="text-xl font-extralight mb-4">MVP Features (Sprint 0)</h2>
              <ul className="space-y-2 text-sm text-foreground-muted">
                <li>✅ Electron + React + TypeScript setup</li>
                <li>✅ Vite build system with HMR</li>
                <li>✅ IPC communication layer (main ↔ renderer)</li>
                <li>✅ Basic UI layout (sidebar, content area)</li>
                <li>⏳ Project management (Sprint 2)</li>
                <li>⏳ Worktree visualization (Sprint 3)</li>
                <li>⏳ Agent monitoring (Sprint 4)</li>
                <li>⏳ Issue management (Sprint 5)</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Status Bar */}
      <footer className="border-t border-background-lighter bg-background-light">
        <div className="flex items-center justify-between px-6 py-2 text-xs text-foreground-muted">
          <div>Ready</div>
          <div className="flex items-center gap-4">
            <span>Miyabi Desktop MVP</span>
            <span>Sprint 0 - Foundation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) {
  return (
    <button
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

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="p-6 bg-background-light rounded-lg border border-background-lighter">
      <h3 className="text-lg font-extralight mb-2">{title}</h3>
      {description && <p className="text-sm text-foreground-muted mb-4">{description}</p>}
      {children}
    </div>
  );
}
