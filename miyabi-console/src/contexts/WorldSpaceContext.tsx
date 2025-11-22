/**
 * World Space Context Provider
 * Provides global access to miyabi World Space (W) throughout the application
 *
 * W(t, s, c, r, e) → State
 */

import type { WorldSpace } from '@/types/worldSpace';
import { createDefaultWorldSpace, updateWorldSpaceContext } from '@/types/worldSpace';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// ═══════════════════════════════════════════════════════════════════════
// § 1. Context Definition
// ═══════════════════════════════════════════════════════════════════════

interface WorldSpaceContextType {
  world: WorldSpace;
  updateWorld: (updates: Partial<WorldSpace>) => void;
  updateContext: (updates: {
    currentPage?: string;
    currentTask?: string;
    health?: 'healthy' | 'degraded' | 'critical';
  }) => void;
}

const WorldSpaceContext = createContext<WorldSpaceContextType | undefined>(undefined);

// ═══════════════════════════════════════════════════════════════════════
// § 2. Provider Component
// ═══════════════════════════════════════════════════════════════════════

interface WorldSpaceProviderProps {
  children: ReactNode;
  initialWorld?: WorldSpace;
}

export function WorldSpaceProvider({
  children,
  initialWorld,
}: WorldSpaceProviderProps) {
  const [world, setWorld] = useState<WorldSpace>(
    initialWorld || createDefaultWorldSpace()
  );
  const location = useLocation();

  // Update world context when location changes
  useEffect(() => {
    const pageName = getPageName(location.pathname);
    setWorld((prev) =>
      updateWorldSpaceContext(prev, {
        currentPage: pageName,
      })
    );
  }, [location.pathname]);

  // Update world's temporal dimension every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setWorld((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          last_updated: new Date().toISOString(),
        },
        temporal: {
          ...prev.temporal,
          current_time: new Date().toISOString(),
        },
      }));
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  const updateWorld = (updates: Partial<WorldSpace>) => {
    setWorld((prev) => ({
      ...prev,
      ...updates,
      metadata: {
        ...prev.metadata,
        last_updated: new Date().toISOString(),
      },
    }));
  };

  const updateContext = (updates: {
    currentPage?: string;
    currentTask?: string;
    health?: 'healthy' | 'degraded' | 'critical';
  }) => {
    setWorld((prev) => updateWorldSpaceContext(prev, updates));
  };

  return (
    <WorldSpaceContext.Provider value={{ world, updateWorld, updateContext }}>
      {children}
    </WorldSpaceContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// § 3. Hook to use World Space
// ═══════════════════════════════════════════════════════════════════════

export function useWorldSpace(): WorldSpaceContextType {
  const context = useContext(WorldSpaceContext);
  if (!context) {
    throw new Error('useWorldSpace must be used within WorldSpaceProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════
// § 4. Utility Functions
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get user-friendly page name from pathname
 */
function getPageName(pathname: string): string {
  const pathMap: Record<string, string> = {
    '/': 'Dashboard',
    '/agents': 'Agents',
    '/deployment': 'Deployment Pipeline',
    '/infrastructure': 'Infrastructure Status',
    '/database': 'Database',
    '/dynamic': 'Dynamic UI Generator',
  };

  return pathMap[pathname] || pathname.substring(1).replace(/-/g, ' ');
}

// ═══════════════════════════════════════════════════════════════════════
// § 5. Hooks for specific World dimensions
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get current temporal context
 */
export function useTemporalContext() {
  const { world } = useWorldSpace();
  return world.temporal;
}

/**
 * Get current spatial context
 */
export function useSpatialContext() {
  const { world } = useWorldSpace();
  return world.spatial;
}

/**
 * Get current contextual dimension
 */
export function useContextualDimension() {
  const { world } = useWorldSpace();
  return world.contextual;
}

/**
 * Get current resources
 */
export function useResources() {
  const { world } = useWorldSpace();
  return world.resources;
}

/**
 * Get current environmental state
 */
export function useEnvironmental() {
  const { world } = useWorldSpace();
  return world.environmental;
}

/**
 * Get system state
 */
export function useSystemState() {
  const { world, updateContext } = useWorldSpace();
  return {
    state: world.state,
    updateHealth: (health: 'healthy' | 'degraded' | 'critical') =>
      updateContext({ health }),
  };
}
