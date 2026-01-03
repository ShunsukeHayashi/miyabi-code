import type { MetadataRoute } from 'next';

/**
 * Miyabi Mission Control - Dynamic Sitemap Generation
 * Issue #1267: Comprehensive SEO optimization for better discoverability
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://miyabi-dashboard.vercel.app';

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/api/health`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    },
  ];

  // Future dynamic pages can be added here
  // For example: agent details, task pages, etc.

  return staticPages;
}