'use client';

import type { ReactElement } from 'react';

interface DashboardHeaderProps {
  issueNumber: string;
  title: string;
  description: string;
}

export function DashboardHeader({ issueNumber, title, description }: DashboardHeaderProps): ReactElement {
  return (
    <header className="space-y-3">
      <p className="text-sm text-gray-500 font-mono">Issue {issueNumber} · Mission Control Dashboard</p>
      <h1 className="text-5xl font-bold bg-gradient-to-r from-miyabi-blue to-miyabi-purple bg-clip-text text-transparent">
        {title}
      </h1>
      <p className="text-gray-400 text-lg">
        {description}
      </p>
    </header>
  );
}
