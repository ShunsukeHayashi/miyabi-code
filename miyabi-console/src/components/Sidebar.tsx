import { Avatar, Button, Tooltip } from '@heroui/react';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Database,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Rocket,
  Server,
  Users,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConnectionState, useWebSocket } from '../contexts/WebSocketContext';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const connectionState = useConnectionState();
  const { reconnect } = useWebSocket();

  const connectionConfig = {
    connected: { color: 'text-green-400', bg: 'bg-green-500', label: 'Live', icon: Wifi },
    connecting: { color: 'text-yellow-400', bg: 'bg-yellow-500 animate-pulse', label: 'Connecting', icon: Wifi },
    disconnected: { color: 'text-red-400', bg: 'bg-red-500', label: 'Disconnected', icon: WifiOff },
    offline: { color: 'text-gray-400', bg: 'bg-gray-500', label: 'Offline', icon: WifiOff },
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Agents', path: '/agents', icon: Users },
    { name: 'Workflows', path: '/workflows', icon: GitBranch },
    { name: 'Organizations', path: '/organizations', icon: Building2 },
    { name: 'Deployment', path: '/deployment', icon: Rocket },
    { name: 'Infrastructure', path: '/infrastructure', icon: Server },
    { name: 'Database', path: '/database', icon: Database },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-50 transition-all duration-300 ease-in-out glass-panel border-r border-white/10 flex flex-col
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center border-b border-white/5 relative">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-6 w-full'}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg tracking-wide text-white">
              MIYABI
            </span>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#0f0f16] border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
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
                <div className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}>
                  <Icon size={20} className={isActive ? 'text-cyan-400' : 'group-hover:text-white'} />
                  {!isCollapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}

                  {isActive && !isCollapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                  )}
                </div>
              </Link>
            </Tooltip>
          );
        })}
      </nav>

      {/* Connection Status */}
      <div className="px-3 py-2 border-t border-white/5">
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
                  flex items-center gap-2 px-3 py-2 rounded-lg w-full transition-all duration-200
                  ${connectionState === 'disconnected' || connectionState === 'offline' ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'}
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <div className="relative">
                  <ConnectionIcon size={16} className={config.color} />
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${config.bg}`} />
                </div>
                {!isCollapsed && (
                  <span className={`text-xs font-medium ${config.color}`}>
                    {config.label}
                  </span>
                )}
              </button>
            </Tooltip>
          );
        })()}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center flex-col' : ''}`}>
          <Avatar
            src={user?.avatar_url}
            name={user?.username?.charAt(0) || 'U'}
            size="sm"
            isBordered
            color="secondary"
          />

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username || 'Guest'}</p>
              <p className="text-xs text-gray-500 truncate">Guardian</p>
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
