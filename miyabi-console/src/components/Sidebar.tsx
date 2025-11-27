import { Avatar, Button, Tooltip } from '@heroui/react';
import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Database,
  FolderGit2,
  GitBranch,
  GitPullRequest,
  LayoutDashboard,
  LogOut,
  Moon,
  Network,
  Rocket,
  Server,
  Sparkles,
  Star,
  Sun,
  Terminal,
  Users,
  Wifi,
  WifiOff,
  Gamepad2
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConnectionState, useWebSocket } from '../contexts/WebSocketContext';
import { useTheme } from '../contexts/ThemeContext';

interface NavGroup {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  items: Array<{
    name: string;
    path: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }>;
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Overview: true,
    Studio: true,
    Runtime: true,
    Monitor: true,
  });
  const location = useLocation();
  const { user, logout } = useAuth();
  const connectionState = useConnectionState();
  const { reconnect } = useWebSocket();
  const { tokens, theme, toggleTheme, isDark } = useTheme();

  const connectionConfig = {
    connected: { color: tokens.colors.accent.success, bg: tokens.colors.accent.success, label: 'Live', icon: Wifi },
    connecting: { color: tokens.colors.accent.warning, bg: tokens.colors.accent.warning, label: 'Connecting', icon: Wifi },
    disconnected: { color: tokens.colors.accent.error, bg: tokens.colors.accent.error, label: 'Disconnected', icon: WifiOff },
    offline: { color: tokens.colors.text.tertiary, bg: tokens.colors.text.tertiary, label: 'Offline', icon: WifiOff },
  };

  const navGroups: NavGroup[] = [
    {
      title: 'Overview',
      icon: LayoutDashboard,
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'Notifications', path: '/notifications', icon: Bell },
      ],
    },
    {
      title: 'Studio',
      icon: Sparkles,
      items: [
        { name: 'Agents', path: '/agents', icon: Users },
        { name: 'Agent Gallery', path: '/agent-gallery', icon: Star },
        { name: 'TCG Gallery', path: '/tcg-gallery', icon: Gamepad2 },
        { name: 'Workflows', path: '/workflows', icon: GitBranch },
        { name: 'Task DAG', path: '/task-dag', icon: Network },
        { name: 'Worktrees', path: '/worktrees', icon: FolderGit2 },
        { name: 'AI Assistant', path: '/ai-assistant', icon: Sparkles },
      ],
    },
    {
      title: 'Runtime',
      icon: Rocket,
      items: [
        { name: 'Deployment', path: '/deployment', icon: Rocket },
        { name: 'Infrastructure', path: '/infrastructure', icon: Server },
        { name: 'Database', path: '/database', icon: Database },
        { name: 'Organizations', path: '/organizations', icon: Building2 },
      ],
    },
    {
      title: 'Monitor',
      icon: Terminal,
      items: [
        { name: 'Logs', path: '/logs', icon: Terminal },
        { name: 'Issues', path: '/issues', icon: GitPullRequest },
      ],
    },
  ];

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-50 transition-all duration-200 ease-in-out ${tokens.effects.blur} border-r flex flex-col
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
      style={{
        backgroundColor: tokens.colors.surface.glass,
        borderColor: tokens.colors.surface.cardBorder
      }}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center border-b relative" style={{ borderColor: tokens.colors.surface.cardBorder }}>
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-6 w-full'}`}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: tokens.colors.accent.primary }}>
            <span className="font-semibold text-lg" style={{ color: tokens.colors.text.inverse }}>M</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-lg tracking-wide" style={{ color: tokens.colors.text.primary }}>
              MIYABI
            </span>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 border rounded-full flex items-center justify-center ${tokens.effects.transition}`}
          style={{
            backgroundColor: tokens.colors.background.primary,
            borderColor: tokens.colors.surface.cardBorder,
            color: tokens.colors.text.tertiary
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = tokens.colors.text.primary}
          onMouseLeave={(e) => e.currentTarget.style.color = tokens.colors.text.tertiary}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => {
          const GroupIcon = group.icon;
          const isExpanded = expandedGroups[group.title];
          const hasActiveItem = group.items.some(item => location.pathname === item.path);

          return (
            <div key={group.title} className="space-y-1">
              {/* Group Header */}
              {!isCollapsed && (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold tracking-wide ${tokens.effects.transition} uppercase`}
                  style={{ color: tokens.colors.text.tertiary }}
                  onMouseEnter={(e) => e.currentTarget.style.color = tokens.colors.text.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = tokens.colors.text.tertiary}
                >
                  <GroupIcon size={14} />
                  <span className="flex-1 text-left">{group.title}</span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}

              {/* Group Items */}
              {(isExpanded || isCollapsed) && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                      <Tooltip
                        key={item.path}
                        content={isCollapsed ? item.name : ''}
                        placement="right"
                        isDisabled={!isCollapsed}
                      >
                        <Link to={item.path}>
                          <div
                            className={`
                              flex items-center gap-3 px-3 py-2.5 rounded-xl ${tokens.effects.transition} group
                              ${isCollapsed ? 'justify-center' : ''}
                            `}
                            style={isActive ? {
                              backgroundColor: `${tokens.colors.accent.primary}20`,
                              color: tokens.colors.accent.primary,
                              fontWeight: 600
                            } : {
                              color: tokens.colors.text.tertiary
                            }}
                          >
                            <Icon size={18} style={{ color: isActive ? tokens.colors.accent.primary : undefined }} />
                            {!isCollapsed && (
                              <span className="text-sm font-medium">{item.name}</span>
                            )}

                            {isActive && !isCollapsed && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tokens.colors.accent.primary }} />
                            )}
                          </div>
                        </Link>
                      </Tooltip>
                    );
                  })}
                </div>
              )}

              {/* Collapsed Mode: Show group indicator */}
              {isCollapsed && hasActiveItem && (
                <div className="flex justify-center">
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: tokens.colors.accent.primary }} />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Theme Toggle & Connection Status */}
      <div className="px-3 py-2 border-t space-y-2" style={{ borderColor: tokens.colors.surface.cardBorder }}>
        {/* Theme Toggle Button */}
        <Tooltip content={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} placement="right">
          <button
            onClick={toggleTheme}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg w-full ${tokens.effects.transition}
              cursor-pointer
              ${isCollapsed ? 'justify-center' : ''}
            `}
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tokens.colors.surface.overlay}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {isDark ? (
              <Sun size={16} style={{ color: '#FACC15' }} />
            ) : (
              <Moon size={16} style={{ color: '#6366F1' }} />
            )}
            {!isCollapsed && (
              <span className="text-xs font-medium" style={{ color: tokens.colors.text.secondary }}>
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>
        </Tooltip>

        {/* Connection Status */}
        {(() => {
          const config = connectionConfig[connectionState];
          const ConnectionIcon = config.icon;
          return (
            <Tooltip
              content={connectionState === 'disconnected' || connectionState === 'offline' ? 'Click to reconnect' : config.label}
              placement="right"
            >
              <button
                onClick={connectionState === 'disconnected' || connectionState === 'offline' ? reconnect : undefined}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg w-full ${tokens.effects.transition}
                  ${connectionState === 'disconnected' || connectionState === 'offline' ? 'cursor-pointer' : 'cursor-default'}
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => {
                  if (connectionState === 'disconnected' || connectionState === 'offline') {
                    e.currentTarget.style.backgroundColor = tokens.colors.surface.overlay;
                  }
                }}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="relative">
                  <ConnectionIcon size={16} style={{ color: config.color }} />
                  <span
                    className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${connectionState === 'connecting' ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: config.bg }}
                  />
                </div>
                {!isCollapsed && (
                  <span className="text-xs font-medium" style={{ color: config.color }}>
                    {config.label}
                  </span>
                )}
              </button>
            </Tooltip>
          );
        })()}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t" style={{ borderColor: tokens.colors.surface.cardBorder }}>
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center flex-col' : ''}`}>
          <Avatar
            src={user?.avatar_url}
            name={user?.username?.charAt(0) || 'U'}
            size="sm"
            isBordered
            color="primary"
          />

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: tokens.colors.text.primary }}>
                {user?.username || 'Guest'}
              </p>
              <p className="text-xs truncate" style={{ color: tokens.colors.text.tertiary }}>
                Guardian
              </p>
            </div>
          )}

          <Tooltip content="Logout" placement="right">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onClick={logout}
              className={isCollapsed ? 'mt-2' : ''}
            >
              <LogOut size={18} />
            </Button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
