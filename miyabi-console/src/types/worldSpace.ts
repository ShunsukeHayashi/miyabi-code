/**
 * World Space (W) Type Definitions
 * Based on miyabi_def/variables/world_definition.yaml
 *
 * W(t, s, c, r, e) → State
 *
 * Parameters:
 *   t: Temporal (時間) - current_time, horizon, constraints
 *   s: Spatial (空間) - physical, digital, abstract
 *   c: Contextual (文脈) - domain, user, system
 *   r: Resources (リソース) - compute, human, info
 *   e: Environmental (環境) - load, dependencies, constraints
 */

// ═══════════════════════════════════════════════════════════════════════
// § 1. Temporal Dimension - t (時間次元)
// ═══════════════════════════════════════════════════════════════════════

export interface TemporalDimension {
  current_time: string; // ISO 8601
  timezone: string; // e.g., "Asia/Tokyo (UTC+9)"
  horizon: {
    project_duration: string;
    sprint_duration: string;
    task_timeout: string;
  };
  constraints: {
    business_hours: string;
    maintenance_window: string;
    deployment_window: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════
// § 2. Spatial Dimension - s (空間次元)
// ═══════════════════════════════════════════════════════════════════════

export interface SpatialDimension {
  physical: {
    location: string;
    datacenter: string;
  };
  digital: {
    repository: string;
    deployment: string;
    api: string;
  };
  abstract: {
    conceptual_layers: string[];
  };
}

// ═══════════════════════════════════════════════════════════════════════
// § 3. Contextual Dimension - c (文脈次元)
// ═══════════════════════════════════════════════════════════════════════

export interface ContextualDimension {
  domain: string; // e.g., "Software Development"
  user: {
    primary_role: string;
    preferences: string[];
    current_page?: string; // Added for UI context
    current_task?: string; // Added for UI context
  };
  system: {
    platform: string;
    architecture: string;
    tech_stack: {
      backend: {
        primary: string;
        frameworks: string[];
      };
      frontend: {
        primary: string;
        frameworks: string[];
      };
    };
  };
}

// ═══════════════════════════════════════════════════════════════════════
// § 4. Resources Dimension - r (リソース次元)
// ═══════════════════════════════════════════════════════════════════════

export interface ResourcesDimension {
  compute: {
    local: {
      device: string;
      cpu: string;
      ram: string;
      storage: string;
    };
    cloud: Record<string, any>;
    limits: {
      max_parallel_agents: number;
      max_worktrees: number;
    };
  };
  human: {
    team_size: number;
    ai_assistants: Array<{
      name: string;
      role: string;
      availability: string;
    }>;
  };
  information: {
    documentation: {
      internal: string;
      external: string;
    };
    knowledge_base: {
      vector_db: string;
      embeddings: string;
    };
  };
}

// ═══════════════════════════════════════════════════════════════════════
// § 5. Environmental Dimension - e (環境次元)
// ═══════════════════════════════════════════════════════════════════════

export interface EnvironmentalDimension {
  load: {
    current: {
      cpu_usage: string;
      ram_usage: string;
      disk_usage: string;
    };
    thresholds: {
      cpu_alert: string;
      ram_alert: string;
      disk_alert: string;
    };
  };
  dependencies: {
    rust_crates: string;
    npm_packages: string;
    system_dependencies: string[];
  };
  constraints: {
    technical: Record<string, string>;
    business: Record<string, any>;
    security: Record<string, any>;
  };
}

// ═══════════════════════════════════════════════════════════════════════
// § 6. Complete World Space
// ═══════════════════════════════════════════════════════════════════════

export interface WorldSpace {
  metadata: {
    world_id: string;
    world_name: string;
    world_version: string;
    last_updated: string;
  };
  temporal: TemporalDimension;
  spatial: SpatialDimension;
  contextual: ContextualDimension;
  resources: ResourcesDimension;
  environmental: EnvironmentalDimension;
  state: {
    project: {
      phase: string;
      progress: string;
      next_milestone: string;
    };
    system: {
      health: 'healthy' | 'degraded' | 'critical';
      last_build: string;
      last_deploy: string;
    };
  };
}

// ═══════════════════════════════════════════════════════════════════════
// § 7. World Space Utilities
// ═══════════════════════════════════════════════════════════════════════

/**
 * Create default World Space for Miyabi Console
 */
export function createDefaultWorldSpace(): WorldSpace {
  return {
    metadata: {
      world_id: 'miyabi-console',
      world_name: 'Miyabi Console World Space',
      world_version: '0.1.0',
      last_updated: new Date().toISOString(),
    },
    temporal: {
      current_time: new Date().toISOString(),
      timezone: 'Asia/Tokyo (UTC+9)',
      horizon: {
        project_duration: '6 months',
        sprint_duration: '2 weeks',
        task_timeout: '2 hours',
      },
      constraints: {
        business_hours: '09:00-18:00 JST',
        maintenance_window: '03:00-05:00 JST',
        deployment_window: '22:00-23:00 JST',
      },
    },
    spatial: {
      physical: {
        location: 'Japan',
        datacenter: 'GCP asia-northeast1 (Tokyo)',
      },
      digital: {
        repository: 'https://github.com/ShunsukeHayashi/Miyabi',
        deployment: 'https://miyabi.run',
        api: 'https://api.miyabi.run',
      },
      abstract: {
        conceptual_layers: [
          'miyabi_def/',
          'crates/',
          'docs/',
          'miyabi-console/',
        ],
      },
    },
    contextual: {
      domain: 'Software Development',
      user: {
        primary_role: 'AI-first developer',
        preferences: ['automation-first', 'quality-focus', 'dynamic-ui'],
      },
      system: {
        platform: 'Web (Browser)',
        architecture: 'Agent-based autonomous framework',
        tech_stack: {
          backend: {
            primary: 'Rust 2021 Edition',
            frameworks: ['Tokio', 'Axum'],
          },
          frontend: {
            primary: 'TypeScript + React',
            frameworks: ['HeroUI', 'TailwindCSS', 'Recharts'],
          },
        },
      },
    },
    resources: {
      compute: {
        local: {
          device: 'Browser Environment',
          cpu: 'Variable',
          ram: 'Variable',
          storage: 'LocalStorage + IndexedDB',
        },
        cloud: {},
        limits: {
          max_parallel_agents: 10,
          max_worktrees: 50,
        },
      },
      human: {
        team_size: 1,
        ai_assistants: [
          {
            name: 'Gemini 2.5 Flash',
            role: 'Dynamic UI Generator',
            availability: '24/7',
          },
        ],
      },
      information: {
        documentation: {
          internal: 'docs/',
          external: 'README.md, CLAUDE.md',
        },
        knowledge_base: {
          vector_db: 'Qdrant',
          embeddings: 'text-embedding-3-small',
        },
      },
    },
    environmental: {
      load: {
        current: {
          cpu_usage: '20-40%',
          ram_usage: 'Normal',
          disk_usage: 'Normal',
        },
        thresholds: {
          cpu_alert: '80%',
          ram_alert: '90%',
          disk_alert: '85%',
        },
      },
      dependencies: {
        rust_crates: '150+',
        npm_packages: '200+',
        system_dependencies: ['Node.js 20+', 'pnpm 9+'],
      },
      constraints: {
        technical: {
          node_version: '>=20.0.0',
          typescript_version: '>=5.6.0',
        },
        business: {
          license: 'Apache-2.0',
        },
        security: {
          vulnerability_scanning: 'npm audit',
        },
      },
    },
    state: {
      project: {
        phase: 'Phase 11 - Console Development',
        progress: '85%',
        next_milestone: 'Dynamic UI Integration',
      },
      system: {
        health: 'healthy',
        last_build: new Date().toISOString(),
        last_deploy: new Date().toISOString(),
      },
    },
  };
}

/**
 * Update World Space with current context
 */
export function updateWorldSpaceContext(
  world: WorldSpace,
  updates: {
    currentPage?: string;
    currentTask?: string;
    health?: 'healthy' | 'degraded' | 'critical';
  }
): WorldSpace {
  return {
    ...world,
    metadata: {
      ...world.metadata,
      last_updated: new Date().toISOString(),
    },
    temporal: {
      ...world.temporal,
      current_time: new Date().toISOString(),
    },
    contextual: {
      ...world.contextual,
      user: {
        ...world.contextual.user,
        current_page: updates.currentPage,
        current_task: updates.currentTask,
      },
    },
    state: {
      ...world.state,
      system: {
        ...world.state.system,
        health: updates.health || world.state.system.health,
      },
    },
  };
}
