'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(' ');
}

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon: React.ReactNode;
  iconColor?: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
  description?: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon,
  iconColor = 'blue',
  description,
}: StatsCardProps) {
  const iconColors = {
    blue: 'bg-miyabi-blue/20 text-miyabi-blue',
    green: 'bg-miyabi-green/20 text-miyabi-green',
    purple: 'bg-miyabi-purple/20 text-miyabi-purple',
    red: 'bg-miyabi-red/20 text-miyabi-red',
    yellow: 'bg-yellow-500/20 text-yellow-400',
  };

  const changeColors = {
    increase: 'text-miyabi-green',
    decrease: 'text-miyabi-red',
    neutral: 'text-gray-400',
  };

  return (
    <Card variant="glass" hover>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{value}</span>
              {change && (
                <span className={cn('text-sm font-medium flex items-center gap-1', changeColors[change.type])}>
                  {change.type === 'increase' && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m18 15-6-6-6 6" />
                    </svg>
                  )}
                  {change.type === 'decrease' && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  )}
                  {change.value > 0 ? '+' : ''}{change.value}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', iconColors[iconColor])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
