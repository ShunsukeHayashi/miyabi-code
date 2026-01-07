'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface ActivityItem {
  id: string;
  type: 'issue_analyzed' | 'pr_reviewed' | 'comment_posted' | 'agent_created' | 'task_completed' | 'task_failed';
  agent: {
    id: string;
    name: string;
  };
  repository: string;
  title: string;
  description?: string;
  timestamp: Date;
  metadata?: {
    issueNumber?: number;
    prNumber?: number;
    success?: boolean;
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
  showViewAll?: boolean;
}

const activityIcons: Record<ActivityItem['type'], React.ReactNode> = {
  issue_analyzed: (
    <div className="p-2 rounded-lg bg-miyabi-blue/20 text-miyabi-blue">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    </div>
  ),
  pr_reviewed: (
    <div className="p-2 rounded-lg bg-miyabi-purple/20 text-miyabi-purple">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" />
        <line x1="6" x2="6" y1="9" y2="21" />
      </svg>
    </div>
  ),
  comment_posted: (
    <div className="p-2 rounded-lg bg-miyabi-green/20 text-miyabi-green">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </div>
  ),
  agent_created: (
    <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
      </svg>
    </div>
  ),
  task_completed: (
    <div className="p-2 rounded-lg bg-miyabi-green/20 text-miyabi-green">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    </div>
  ),
  task_failed: (
    <div className="p-2 rounded-lg bg-miyabi-red/20 text-miyabi-red">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" x2="9" y1="9" y2="15" />
        <line x1="9" x2="15" y1="9" y2="15" />
      </svg>
    </div>
  ),
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export function ActivityFeed({ activities, maxItems = 10, showViewAll = true }: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Recent Activity</CardTitle>
        {showViewAll && (
          <a href="/dashboard/activity" className="text-sm text-miyabi-blue hover:underline">
            View all
          </a>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedActivities.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">No recent activity</p>
              <p className="text-xs text-gray-500 mt-1">Activity will appear here when your agents start working</p>
            </div>
          ) : (
            displayedActivities.map((activity, index) => (
              <div
                key={activity.id}
                className={cn(
                  'flex items-start gap-3 pb-4',
                  index < displayedActivities.length - 1 && 'border-b border-gray-800'
                )}
              >
                {activityIcons[activity.type]}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{activity.title}</span>
                    {activity.metadata?.issueNumber && (
                      <Badge variant="outline" size="sm">#{activity.metadata.issueNumber}</Badge>
                    )}
                    {activity.metadata?.prNumber && (
                      <Badge variant="outline" size="sm">PR #{activity.metadata.prNumber}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    by <span className="text-miyabi-blue">{activity.agent.name}</span>
                    {' '}in{' '}
                    <span className="text-gray-300">{activity.repository}</span>
                  </p>
                  {activity.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{activity.description}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
