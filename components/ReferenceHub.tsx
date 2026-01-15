'use client';

import { useMemo, useState } from 'react';
import { referenceLinks } from './mock-data';
import type { ReferenceLink } from './types';

type ReferenceCategory = ReferenceLink['category'] | 'all'

const categoryLabels: Record<ReferenceLink['category'], string> = {
  protocol: 'Protocol',
  architecture: 'Architecture',
  workflow: 'Workflow',
  guideline: 'Guideline',
};

export function ReferenceHub() {
  const [selectedCategory, setSelectedCategory] = useState<ReferenceCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = useMemo(
    () =>
      Array.from(
        new Set(referenceLinks.map((link) => link.category)),
      ),
    [],
  );

  const filteredLinks = useMemo(() => referenceLinks
    .filter((link) => (selectedCategory === 'all' ? true : link.category === selectedCategory))
    .filter((link) => {
      if (!searchTerm.trim()) {
        return true;
      }
      const query = searchTerm.toLowerCase();
      return (
        link.title.toLowerCase().includes(query) ||
          link.description.toLowerCase().includes(query) ||
          link.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => a.title.localeCompare(b.title)), [selectedCategory, searchTerm]);

  return (
    <section className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-white">Reference Hub</h2>
          <p className="text-sm text-gray-400">
            ミッション遂行に必要な主要ドキュメントとガイドラインを素早く参照できます。
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <label className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300 focus-within:border-miyabi-blue">
            <span className="text-xs uppercase tracking-wide text-gray-500">Category</span>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value as ReferenceCategory)}
              className="bg-transparent text-sm text-white outline-none"
            >
              <option value="all">All</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {categoryLabels[category]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm focus-within:border-miyabi-blue">
            <svg
              className="h-4 w-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
            </svg>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search references..."
              className="w-48 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
            />
          </label>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredLinks.map((link) => (
          <article
            key={link.id}
            className="flex h-full flex-col justify-between rounded-xl border border-gray-800 bg-gray-950/60 p-4 transition hover:border-gray-700"
          >
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-miyabi-purple">
                  {categoryLabels[link.category]}
                </span>
                <span className="text-xs text-gray-500">#{link.id}</span>
              </div>
              <h3 className="text-lg font-semibold text-white">{link.title}</h3>
              <p className="mt-2 text-sm text-gray-300">{link.description}</p>
              {link.tags?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {link.tags.map((tag) => (
                    <span key={tag} className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-miyabi-blue hover:text-miyabi-purple"
            >
              Open documentation
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10v11h11" />
              </svg>
            </a>
          </article>
        ))}
      </div>

      {filteredLinks.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-gray-700 bg-gray-950/60 p-6 text-center text-sm text-gray-500">
          条件に一致するドキュメントが見つかりません。
        </p>
      ) : null}
    </section>
  );
}
