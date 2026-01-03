/**
 * Performance Monitoring Dashboard
 * Comprehensive performance metrics visualization and monitoring
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  Activity, Database, Zap, Clock, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Server, Globe, HardDrive
} from 'lucide-react';

interface PerformanceMetrics {
  cache: {
    hitRate: number;
    totalHits: number;
    totalMisses: number;
    l1Stats: {
      hits: number;
      misses: number;
      size: number;
      memoryUsage: number;
    };
    l2Stats: {
      hits: number;
      misses: number;
      connectionCount: number;
    };
  };
  database: {
    totalQueries: number;
    averageDuration: number;
    slowQueries: Array<{
      query: string;
      duration: number;
      timestamp: number;
    }>;
    poolStats: {
      totalConnections: number;
      idleConnections: number;
      activeConnections: number;
      waitingClients: number;
    };
  };
  api: {
    hitRate: number;
    routes: Array<{
      route: string;
      hits: number;
      misses: number;
      hitRate: number;
    }>;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
  frontend: {
    renderCount: Record<string, number>;
    componentPerformance: Array<{
      component: string;
      renderTime: number;
      renderCount: number;
    }>;
  };
}

interface PerformanceDashboardProps {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export function PerformanceDashboard({
  refreshInterval = 30000,
  autoRefresh = true
}: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [historicalData, setHistoricalData] = useState<Array<{
    timestamp: number;
    cacheHitRate: number;
    avgResponseTime: number;
    memoryUsage: number;
  }>>([]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/performance/metrics');
      const data = await response.json();

      setMetrics(data);
      setLastUpdate(new Date());

      // Add to historical data
      setHistoricalData(prev => {
        const newData = [...prev, {
          timestamp: Date.now(),
          cacheHitRate: data.cache.hitRate * 100,
          avgResponseTime: data.database.averageDuration,
          memoryUsage: data.system.memoryUsage
        }];

        // Keep only last 50 data points
        return newData.slice(-50);
      });

    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const performanceScore = useMemo(() => {
    if (!metrics) return 0;

    const cacheScore = metrics.cache.hitRate * 0.3;
    const dbScore = (1 - Math.min(metrics.database.averageDuration / 1000, 1)) * 0.3;
    const apiScore = metrics.api.hitRate * 0.2;
    const systemScore = (1 - Math.max(
      metrics.system.cpuUsage,
      metrics.system.memoryUsage,
      metrics.system.diskUsage
    ) / 100) * 0.2;

    return Math.round((cacheScore + dbScore + apiScore + systemScore) * 100);
  }, [metrics]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p>Failed to load performance metrics</p>
          <Button onClick={fetchMetrics} className="mt-2">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-gray-600">
            Last updated: {lastUpdate?.toLocaleTimeString() || 'Never'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={performanceScore >= 80 ? 'default' : performanceScore >= 60 ? 'secondary' : 'destructive'}>
            Performance Score: {performanceScore}
          </Badge>
          <Button onClick={fetchMetrics} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Cache Hit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.cache.hitRate * 100).toFixed(1)}%</div>
            <Progress value={metrics.cache.hitRate * 100} className="mt-2" />
            <p className="text-xs text-gray-500 mt-1">
              {metrics.cache.totalHits} hits, {metrics.cache.totalMisses} misses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Avg Query Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.database.averageDuration.toFixed(0)}ms</div>
            <Progress
              value={100 - Math.min(metrics.database.averageDuration / 10, 100)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {metrics.database.totalQueries} total queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Server className="h-4 w-4 mr-2" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.system.memoryUsage.toFixed(1)}%</div>
            <Progress value={metrics.system.memoryUsage} className="mt-2" />
            <p className="text-xs text-gray-500 mt-1">
              System memory utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              API Cache Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.api.hitRate * 100).toFixed(1)}%</div>
            <Progress value={metrics.api.hitRate * 100} className="mt-2" />
            <p className="text-xs text-gray-500 mt-1">
              API response caching
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="cache" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cache">Cache Performance</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api">API Performance</TabsTrigger>
          <TabsTrigger value="system">System Resources</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cache Layer Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'L1 Hits', value: metrics.cache.l1Stats.hits, fill: '#10b981' },
                        { name: 'L2 Hits', value: metrics.cache.l2Stats.hits, fill: '#3b82f6' },
                        { name: 'Misses', value: metrics.cache.totalMisses, fill: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'L1 Hits', value: metrics.cache.l1Stats.hits, fill: '#10b981' },
                        { name: 'L2 Hits', value: metrics.cache.l2Stats.hits, fill: '#3b82f6' },
                        { name: 'Misses', value: metrics.cache.totalMisses, fill: '#ef4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>L1 Cache Size:</span>
                    <Badge>{metrics.cache.l1Stats.size} items</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>L1 Memory Usage:</span>
                    <Badge>{(metrics.cache.l1Stats.memoryUsage / 1024 / 1024).toFixed(2)} MB</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>L2 Connections:</span>
                    <Badge>{metrics.cache.l2Stats.connectionCount}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Overall Hit Rate:</span>
                    <Badge variant={metrics.cache.hitRate > 0.8 ? 'default' : 'secondary'}>
                      {(metrics.cache.hitRate * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Connection Pool</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    {
                      name: 'Connections',
                      Active: metrics.database.poolStats.activeConnections,
                      Idle: metrics.database.poolStats.idleConnections,
                      Waiting: metrics.database.poolStats.waitingClients
                    }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Active" fill="#10b981" />
                    <Bar dataKey="Idle" fill="#3b82f6" />
                    <Bar dataKey="Waiting" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Slow Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {metrics.database.slowQueries.slice(0, 5).map((query, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex justify-between items-start">
                        <code className="text-xs flex-1 truncate">
                          {query.query.substring(0, 50)}...
                        </code>
                        <Badge variant="destructive" className="ml-2">
                          {query.duration.toFixed(0)}ms
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(query.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  {metrics.database.slowQueries.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      No slow queries detected
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Route Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.api.routes.slice(0, 10).map((route, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <code className="text-sm font-mono">{route.route}</code>
                      <div className="text-xs text-gray-500">
                        {route.hits} hits, {route.misses} misses
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={route.hitRate > 0.8 ? 'default' : route.hitRate > 0.5 ? 'secondary' : 'destructive'}>
                        {(route.hitRate * 100).toFixed(1)}%
                      </Badge>
                      <div className="w-24">
                        <Progress value={route.hitRate * 100} className="mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.system.cpuUsage.toFixed(1)}%</div>
                <Progress value={metrics.system.cpuUsage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.system.memoryUsage.toFixed(1)}%</div>
                <Progress value={metrics.system.memoryUsage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Disk Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.system.diskUsage.toFixed(1)}%</div>
                <Progress value={metrics.system.diskUsage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Network Latency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.system.networkLatency.toFixed(0)}ms</div>
                <Progress value={100 - Math.min(metrics.system.networkLatency / 10, 100)} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value as number).toLocaleTimeString()}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cacheHitRate"
                    stroke="#10b981"
                    name="Cache Hit Rate (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="avgResponseTime"
                    stroke="#3b82f6"
                    name="Avg Response Time (ms)"
                  />
                  <Line
                    type="monotone"
                    dataKey="memoryUsage"
                    stroke="#ef4444"
                    name="Memory Usage (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}