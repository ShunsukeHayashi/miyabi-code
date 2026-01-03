import type { MetadataRoute } from 'next';

/**
 * Miyabi Mission Control - Web App Manifest
 * Issue #1267: Comprehensive SEO optimization for better discoverability
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Miyabi Mission Control - 自律AIエージェント オーケストレーション プラットフォーム',
    short_name: 'Miyabi Control',
    description: '自律AIエージェントオーケストレーションのためのリアルタイムコントロールパネル',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a', // gray-950
    theme_color: '#667eea', // miyabi-blue
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'ja',
    categories: ['productivity', 'developer', 'utilities'],

    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'favicon',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'apple-touch-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any',
      },
    ],

    screenshots: [
      {
        src: '/assets/miyabi-dashboard-desktop.jpg',
        sizes: '1280x720',
        type: 'image/jpeg',
        form_factor: 'wide',
        label: 'Miyabi Mission Control Dashboard - Desktop View',
      },
      {
        src: '/assets/miyabi-dashboard-mobile.jpg',
        sizes: '390x844',
        type: 'image/jpeg',
        form_factor: 'narrow',
        label: 'Miyabi Mission Control Dashboard - Mobile View',
      },
    ],

    related_applications: [],
    prefer_related_applications: false,

    // PWA specific features
    edge_side_includes: 'none',
    iarc_rating_id: '',

    // Developer info
    shortcuts: [
      {
        name: 'Agent Dashboard',
        short_name: 'Agents',
        description: 'View and manage AI agents',
        url: '/#agents',
        icons: [
          {
            src: '/icons/agents.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'Task Monitor',
        short_name: 'Tasks',
        description: 'Monitor active tasks and progress',
        url: '/#tasks',
        icons: [
          {
            src: '/icons/tasks.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
    ],
  };
}
