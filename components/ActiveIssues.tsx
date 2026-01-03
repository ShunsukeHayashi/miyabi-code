'use client';

import { type ReactElement } from 'react';
import { IssueCard } from './IssueCard';
import type { IssueSummary } from './dashboardData';

interface ActiveIssuesSectionProps {
  issues: IssueSummary[];
}

export function ActiveIssuesSection({ issues }: ActiveIssuesSectionProps): ReactElement {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-3xl font-bold text-white">Active Issues</h2>
        <p className="text-sm text-gray-400">Key threads monitored alongside Mission Control.</p>
      </header>
      <div className="space-y-3">
        {issues.map((issue) => (
          <IssueCard key={issue.number} issue={issue} />
        ))}
      </div>
    </section>
  );
}
