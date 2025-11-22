import { Card, CardBody, CardHeader, Chip, Divider } from '@heroui/react';
import { useEffect, useState } from 'react';
import { activityTypeIcons, heroUIColorMapping } from '../design-system/colors';

interface Activity {
  id: string;
  type: 'agent' | 'deployment' | 'system' | 'user';
  action: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  user?: {
    name: string;
    avatar?: string;
  };
}

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    type: 'agent',
    action: 'Agent Started',
    description: 'Marketing Agent began campaign analysis task',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: 'info',
    user: { name: 'System' }
  },
  {
    id: '2',
    type: 'deployment',
    action: 'Deployment Complete',
    description: 'Successfully deployed version 1.2.3 to production',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'success',
    user: { name: 'CI/CD Pipeline' }
  },
  {
    id: '3',
    type: 'agent',
    action: 'Task Completed',
    description: 'Coding Agent completed feature implementation',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'success',
    user: { name: 'System' }
  },
  {
    id: '4',
    type: 'system',
    action: 'System Alert',
    description: 'High memory usage detected on worker node 2',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'warning',
    user: { name: 'Monitoring' }
  },
  {
    id: '5',
    type: 'user',
    action: 'User Login',
    description: 'New user session started',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: 'info',
    user: { name: 'You' }
  }
];

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate fetching activities from API
    // In production, this would fetch from apiClient.get('/activities')
    const fetchActivities = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // const response = await apiClient.get('/activities');
        // setActivities(response.data);

        // For now, use mock data
        setActivities(MOCK_ACTIVITIES);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    // Set up polling for updates every 10 seconds
    const interval = setInterval(fetchActivities, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return heroUIColorMapping.success;
      case 'warning':
        return heroUIColorMapping.warning;
      case 'error':
        return heroUIColorMapping.error;
      default:
        return heroUIColorMapping.info;
    }
  };

  const getTypeIcon = (type: 'agent' | 'deployment' | 'system' | 'user') => {
    return activityTypeIcons[type] || '📋';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex gap-3">
        <div className="flex flex-col">
          <p className="text-md font-semibold">Activity Feed</p>
          <p className="text-small text-default-500">Real-time system updates</p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="gap-3 max-h-[600px] overflow-y-auto">
        {loading && activities.length === 0 ? (
          <div className="text-center py-8 text-default-400">
            Loading activities...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-default-400">
            No recent activity
          </div>
        ) : (
          activities.map((activity, index) => (
            <div key={activity.id}>
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="text-2xl">{getTypeIcon(activity.type)}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{activity.action}</p>
                    {activity.status && (
                      <Chip
                        size="sm"
                        color={getStatusColor(activity.status)}
                        variant="flat"
                      >
                        {activity.status}
                      </Chip>
                    )}
                  </div>
                  <p className="text-sm text-default-600 mb-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-default-400">
                    {activity.user && (
                      <>
                        <span>{activity.user.name}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>{formatTimestamp(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
              {index < activities.length - 1 && <Divider className="my-3" />}
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
