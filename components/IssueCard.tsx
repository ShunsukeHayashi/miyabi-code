'use client';

import type { ReactElement } from 'react';
import type { IssueSummary } from '@/components/dashboardData';

interface IssueCardProps {
  issue: IssueSummary;
}

export function IssueCard({ issue }: IssueCardProps): ReactElement {
  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-mono text-sm">#{issue.number}</span>
            <span className="px-2 py-1 rounded text-xs font-medium bg-miyabi-green/20 text-miyabi-green">
              {issue.state}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white">{issue.title}</h3>
          <div className="flex flex-wrap gap-2">
            {issue.labels.map((label) => (
              <span key={label} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                {label}
              </span>
            ))}
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </div>
    </a>
  );
}
