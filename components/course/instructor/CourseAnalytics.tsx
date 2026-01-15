/**
 * Course Analytics Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Star,
  Eye,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Target,
  Award,
  MessageSquare,
  BookOpen,
  PieChart,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { LoadingSpinner } from '../shared/LoadingComponents';

interface CourseAnalyticsProps {
  instructorId: string;
  courseId?: string; // If specified, show analytics for specific course
  className?: string;
}

interface AnalyticsMetric {
  id: string;
  label: string;
  value: string | number;
  change: number;
  period: string;
  icon: React.ReactNode;
  color: string;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
  }>;
}

interface CoursePerformance {
  id: string;
  title: string;
  enrollments: number;
  revenue: number;
  avgProgress: number;
  completionRate: number;
  rating: number;
  reviews: number;
  trend: 'up' | 'down' | 'stable';
}

type TimeRange = '7d' | '30d' | '90d' | '1y';
type MetricType = 'enrollments' | 'revenue' | 'engagement' | 'completion';

export function CourseAnalytics({ instructorId, courseId, className = '' }: CourseAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('enrollments');
  const [isLoading, setIsLoading] = useState(false);

  // Mock analytics data
  const metrics: AnalyticsMetric[] = [
    {
      id: 'revenue',
      label: 'Total Revenue',
      value: '$45,680',
      change: 15.3,
      period: 'vs last month',
      icon: <DollarSign size={20} />,
      color: 'miyabi-green',
    },
    {
      id: 'enrollments',
      label: 'New Enrollments',
      value: 234,
      change: 8.7,
      period: 'vs last month',
      icon: <Users size={20} />,
      color: 'miyabi-blue',
    },
    {
      id: 'completion',
      label: 'Avg Completion Rate',
      value: '87%',
      change: -2.1,
      period: 'vs last month',
      icon: <Target size={20} />,
      color: 'miyabi-purple',
    },
    {
      id: 'rating',
      label: 'Average Rating',
      value: '4.7',
      change: 0.3,
      period: 'vs last month',
      icon: <Star size={20} />,
      color: 'orange-500',
    },
    {
      id: 'engagement',
      label: 'Engagement Score',
      value: '92%',
      change: 5.2,
      period: 'vs last month',
      icon: <Activity size={20} />,
      color: 'miyabi-blue',
    },
    {
      id: 'watch_time',
      label: 'Total Watch Time',
      value: '2,450h',
      change: 12.8,
      period: 'vs last month',
      icon: <Clock size={20} />,
      color: 'miyabi-purple',
    },
  ];

  // Mock course performance data
  const coursePerformance: CoursePerformance[] = [
    {
      id: '1',
      title: 'Advanced React Patterns',
      enrollments: 456,
      revenue: 18240,
      avgProgress: 78,
      completionRate: 87,
      rating: 4.8,
      reviews: 142,
      trend: 'up',
    },
    {
      id: '2',
      title: 'TypeScript Fundamentals',
      enrollments: 323,
      revenue: 12920,
      avgProgress: 85,
      completionRate: 92,
      rating: 4.9,
      reviews: 98,
      trend: 'up',
    },
    {
      id: '3',
      title: 'Node.js Backend Development',
      enrollments: 289,
      revenue: 11560,
      avgProgress: 68,
      completionRate: 78,
      rating: 4.6,
      reviews: 87,
      trend: 'down',
    },
  ];

  // Mock chart data
  const enrollmentChartData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Enrollments',
        data: [45, 67, 89, 123, 156, 234],
        color: 'miyabi-blue',
      },
    ],
  };

  const revenueChartData: ChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Revenue',
        data: [3200, 4100, 3800, 4900],
        color: 'miyabi-green',
      },
    ],
  };

  // Mock student demographics
  const demographics = {
    locations: [
      { country: 'United States', percentage: 35, count: 425 },
      { country: 'India', percentage: 22, count: 267 },
      { country: 'United Kingdom', percentage: 15, count: 182 },
      { country: 'Canada', percentage: 12, count: 146 },
      { country: 'Germany', percentage: 8, count: 97 },
      { country: 'Others', percentage: 8, count: 97 },
    ],
    devices: [
      { type: 'Desktop', percentage: 65, count: 789 },
      { type: 'Mobile', percentage: 28, count: 340 },
      { type: 'Tablet', percentage: 7, count: 85 },
    ],
    experience: [
      { level: 'Beginner', percentage: 45, count: 546 },
      { level: 'Intermediate', percentage: 38, count: 462 },
      { level: 'Advanced', percentage: 17, count: 206 },
    ],
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);

  const getTrendIcon = (change: number) => {
    if (change > 0) {return <TrendingUp className="text-miyabi-green" size={16} />;}
    if (change < 0) {return <TrendingDown className="text-red-400" size={16} />;}
    return <Activity className="text-gray-400" size={16} />;
  };

  const getPerformanceTrend = (trend: CoursePerformance['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="text-miyabi-green" size={16} />;
      case 'down':
        return <TrendingDown className="text-red-400" size={16} />;
      default:
        return <Activity className="text-gray-400" size={16} />;
    }
  };

  const refreshData = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const MetricCard = ({ metric }: { metric: AnalyticsMetric }) => (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-${metric.color}/20 rounded-lg flex items-center justify-center`}>
          <div className={`text-${metric.color}`}>
            {metric.icon}
          </div>
        </div>
        {getTrendIcon(metric.change)}
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-white">{metric.value}</h3>
        <p className="text-sm text-gray-400">{metric.label}</p>
        <div className="flex items-center gap-1 text-sm">
          <span className={metric.change >= 0 ? 'text-miyabi-green' : 'text-red-400'}>
            {metric.change >= 0 ? '+' : ''}{metric.change}%
          </span>
          <span className="text-gray-500">{metric.period}</span>
        </div>
      </div>
    </div>
  );

  const ChartPlaceholder = ({ title, height = 'h-80' }: { title: string; height?: string }) => (
    <div className={`${height} bg-gray-900/50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600`}>
      <div className="text-center">
        <BarChart3 className="mx-auto text-gray-500 mb-2" size={32} />
        <p className="text-gray-400 font-medium">{title}</p>
        <p className="text-sm text-gray-500">Chart integration needed</p>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {courseId ? 'Course Analytics' : 'Performance Analytics'}
          </h1>
          <p className="text-gray-400">
            Track performance metrics and student engagement across your courses
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={isLoading ? 'animate-spin' : ''} size={16} />
            Refresh
          </button>

          {/* Export Button */}
          <button className="flex items-center gap-2 bg-miyabi-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Revenue Trends</h3>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded px-3 py-1 focus:ring-2 focus:ring-miyabi-blue"
            >
              <option value="revenue">Revenue</option>
              <option value="enrollments">Enrollments</option>
              <option value="engagement">Engagement</option>
              <option value="completion">Completion Rate</option>
            </select>
          </div>
          <ChartPlaceholder title="Revenue Over Time" />
        </div>

        {/* Enrollment Growth */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Student Enrollment</h3>
          <ChartPlaceholder title="Enrollment Growth" />
        </div>
      </div>

      {/* Course Performance Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Course Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Course</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase">Enrollments</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase">Revenue</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase">Avg Progress</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase">Completion</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase">Rating</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase">Trend</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {coursePerformance.map((course) => (
                <tr key={course.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{course.title}</div>
                    <div className="text-sm text-gray-400">{course.reviews} reviews</div>
                  </td>
                  <td className="px-6 py-4 text-center text-white">{course.enrollments}</td>
                  <td className="px-6 py-4 text-center text-white">{formatCurrency(course.revenue)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-12 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-miyabi-blue h-2 rounded-full"
                          style={{ width: `${course.avgProgress}%` }}
                        />
                      </div>
                      <span className="text-white text-sm">{course.avgProgress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-white">{course.completionRate}%</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="text-yellow-400 fill-current" size={16} />
                      <span className="text-white">{course.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getPerformanceTrend(course.trend)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Demographics */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Student Demographics</h3>

          {/* Top Locations */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Top Locations</h4>
            <div className="space-y-2">
              {demographics.locations.slice(0, 5).map((location) => (
                <div key={location.country} className="flex items-center justify-between">
                  <span className="text-sm text-white">{location.country}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-miyabi-blue h-2 rounded-full"
                        style={{ width: `${location.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8">{location.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Types */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Device Usage</h4>
            <div className="space-y-2">
              {demographics.devices.map((device) => (
                <div key={device.type} className="flex items-center justify-between">
                  <span className="text-sm text-white">{device.type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-miyabi-green h-2 rounded-full"
                        style={{ width: `${device.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8">{device.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Engagement Metrics</h3>

          <div className="space-y-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="text-miyabi-blue" size={16} />
                <span className="text-sm font-medium text-white">Average Watch Time</span>
              </div>
              <div className="text-lg font-bold text-white">45 minutes</div>
              <div className="text-xs text-gray-400">per session</div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="text-miyabi-green" size={16} />
                <span className="text-sm font-medium text-white">Discussion Activity</span>
              </div>
              <div className="text-lg font-bold text-white">156</div>
              <div className="text-xs text-gray-400">posts this month</div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="text-miyabi-purple" size={16} />
                <span className="text-sm font-medium text-white">Resource Downloads</span>
              </div>
              <div className="text-lg font-bold text-white">892</div>
              <div className="text-xs text-gray-400">this month</div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Award className="text-orange-500" size={16} />
                <span className="text-sm font-medium text-white">Quiz Completion</span>
              </div>
              <div className="text-lg font-bold text-white">78%</div>
              <div className="text-xs text-gray-400">average rate</div>
            </div>
          </div>
        </div>

        {/* Performance Alerts */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Alerts</h3>

          <div className="space-y-3">
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-orange-400 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-sm font-medium text-white">Low Completion Rate</h4>
                  <p className="text-xs text-gray-300">Node.js course has 78% completion rate</p>
                  <p className="text-xs text-gray-400 mt-1">Consider adding more engaging content</p>
                </div>
              </div>
            </div>

            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <TrendingDown className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-sm font-medium text-white">Declining Enrollments</h4>
                  <p className="text-xs text-gray-300">15% decrease in new enrollments</p>
                  <p className="text-xs text-gray-400 mt-1">Review pricing and marketing strategy</p>
                </div>
              </div>
            </div>

            <div className="bg-miyabi-green/20 border border-miyabi-green/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <TrendingUp className="text-miyabi-green flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-sm font-medium text-white">High Engagement</h4>
                  <p className="text-xs text-gray-300">TypeScript course has 95% engagement</p>
                  <p className="text-xs text-gray-400 mt-1">Great job! Consider similar content</p>
                </div>
              </div>
            </div>

            <div className="bg-miyabi-blue/20 border border-miyabi-blue/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Star className="text-miyabi-blue flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-sm font-medium text-white">Excellent Reviews</h4>
                  <p className="text-xs text-gray-300">Average rating increased to 4.7</p>
                  <p className="text-xs text-gray-400 mt-1">Student satisfaction is high</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Funnel */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Student Journey Funnel</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: 'Course Views', value: '2,450', percentage: 100 },
            { label: 'Enrollments', value: '1,068', percentage: 44 },
            { label: 'Started Learning', value: '892', percentage: 84 },
            { label: 'Completed 50%', value: '534', percentage: 60 },
            { label: 'Course Completed', value: '423', percentage: 79 },
          ].map((stage, index) => (
            <div key={stage.label} className="text-center">
              <div className={`w-full h-16 rounded-lg flex items-center justify-center mb-2 ${
                index === 0 ? 'bg-miyabi-blue/20 border border-miyabi-blue/30' :
                  index === 1 ? 'bg-miyabi-green/20 border border-miyabi-green/30' :
                    index === 2 ? 'bg-miyabi-purple/20 border border-miyabi-purple/30' :
                      index === 3 ? 'bg-orange-500/20 border border-orange-500/30' :
                        'bg-yellow-500/20 border border-yellow-500/30'
              }`}>
                <span className={`text-lg font-bold ${
                  index === 0 ? 'text-miyabi-blue' :
                    index === 1 ? 'text-miyabi-green' :
                      index === 2 ? 'text-miyabi-purple' :
                        index === 3 ? 'text-orange-500' :
                          'text-yellow-500'
                }`}>
                  {stage.value}
                </span>
              </div>
              <div className="text-sm font-medium text-white">{stage.label}</div>
              <div className="text-xs text-gray-400">
                {index > 0 && `${stage.percentage}% conversion`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CourseAnalytics;
