'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as Sentry from '@sentry/nextjs';

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  type: 'navigation' | 'resource' | 'paint' | 'layout' | 'custom'
}

interface PerformanceMonitorProps {
  enableWebVitals?: boolean
  enableResourceTiming?: boolean
  enableNavigationTiming?: boolean
  enableCustomMetrics?: boolean
  onMetricCapture?: (metric: PerformanceMetric) => void
}

// パフォーマンス監視のメイン関数
export function usePerformanceMonitor(props: PerformanceMonitorProps = {}) {
  const {
    enableWebVitals = true,
    enableResourceTiming = true,
    enableNavigationTiming = true,
    enableCustomMetrics = true,
    onMetricCapture,
  } = props;

  const metricsRef = useRef<PerformanceMetric[]>([]);

  // メトリクス記録関数
  const recordMetric = useCallback(
    (metric: PerformanceMetric) => {
      metricsRef.current.push(metric);
      onMetricCapture?.(metric);

      // Sentryにパフォーマンスメトリクスを送信
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${metric.name}: ${metric.value}ms`,
        level: 'info',
        data: {
          type: metric.type,
          value: metric.value,
          timestamp: metric.timestamp,
        },
      });

      // 重要なパフォーマンス指標の場合は独立したイベントとして送信
      if (
        metric.name === 'largest-contentful-paint' ||
        metric.name === 'first-input-delay' ||
        metric.name === 'cumulative-layout-shift'
      ) {
        Sentry.setMeasurement(metric.name, metric.value, 'millisecond');
      }
    },
    [onMetricCapture],
  );

  // Web Vitalsの監視
  useEffect(() => {
    if (!enableWebVitals || typeof window === 'undefined') {return;}

    // CLS (Cumulative Layout Shift) 監視
    const observeLayoutShift = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            recordMetric({
              name: 'cumulative-layout-shift',
              value: entry.value,
              timestamp: entry.startTime,
              type: 'layout',
            });
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      return observer;
    };

    // LCP (Largest Contentful Paint) 監視
    const observeLCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          recordMetric({
            name: 'largest-contentful-paint',
            value: lastEntry.startTime,
            timestamp: performance.now(),
            type: 'paint',
          });
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      return observer;
    };

    // FID (First Input Delay) 監視
    const observeFID = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          recordMetric({
            name: 'first-input-delay',
            value: entry.processingStart - entry.startTime,
            timestamp: entry.startTime,
            type: 'custom',
          });
        }
      });

      observer.observe({ entryTypes: ['first-input'] });
      return observer;
    };

    // Paint Timing 監視
    const observePaintTiming = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          recordMetric({
            name: entry.name,
            value: entry.startTime,
            timestamp: performance.now(),
            type: 'paint',
          });
        }
      });

      observer.observe({ entryTypes: ['paint'] });
      return observer;
    };

    const observers = [
      observeLayoutShift(),
      observeLCP(),
      observeFID(),
      observePaintTiming(),
    ];

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [enableWebVitals, recordMetric]);

  // Navigation Timing 監視
  useEffect(() => {
    if (!enableNavigationTiming || typeof window === 'undefined') {return;}

    const recordNavigationTimings = () => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (!navEntry) {return;}

      const timings = [
        { name: 'dns-lookup', value: navEntry.domainLookupEnd - navEntry.domainLookupStart },
        { name: 'tcp-connect', value: navEntry.connectEnd - navEntry.connectStart },
        { name: 'ssl-negotiation', value: navEntry.secureConnectionStart ? navEntry.connectEnd - navEntry.secureConnectionStart : 0 },
        { name: 'request-response', value: navEntry.responseEnd - navEntry.requestStart },
        { name: 'dom-content-loaded', value: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart },
        { name: 'dom-complete', value: navEntry.domComplete - navEntry.navigationStart },
        { name: 'page-load', value: navEntry.loadEventEnd - navEntry.loadEventStart },
      ];

      timings.forEach((timing) => {
        if (timing.value > 0) {
          recordMetric({
            name: timing.name,
            value: timing.value,
            timestamp: performance.now(),
            type: 'navigation',
          });
        }
      });
    };

    // ページロード完了後に記録
    if (document.readyState === 'complete') {
      recordNavigationTimings();
    } else {
      window.addEventListener('load', recordNavigationTimings);
    }

    return () => {
      window.removeEventListener('load', recordNavigationTimings);
    };
  }, [enableNavigationTiming, recordMetric]);

  // Resource Timing 監視
  useEffect(() => {
    if (!enableResourceTiming || typeof window === 'undefined') {return;}

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming;

        // 大きなリソースや遅いリソースのみ記録
        const duration = resourceEntry.responseEnd - resourceEntry.startTime;
        const size = resourceEntry.transferSize || 0;

        if (duration > 1000 || size > 100000) { // 1秒以上または100KB以上
          recordMetric({
            name: `resource-${entry.name.split('/').pop()?.split('.')[0] || 'unknown'}`,
            value: duration,
            timestamp: entry.startTime,
            type: 'resource',
          });
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => {
      observer.disconnect();
    };
  }, [enableResourceTiming, recordMetric]);

  // カスタムメトリクス記録関数
  const recordCustomMetric = useCallback(
    (name: string, value: number, type: 'custom' = 'custom') => {
      recordMetric({
        name,
        value,
        timestamp: performance.now(),
        type,
      });
    },
    [recordMetric],
  );

  // パフォーマンス情報の取得
  const getPerformanceReport = useCallback(() => ({
    metrics: [...metricsRef.current],
    summary: {
      totalMetrics: metricsRef.current.length,
      navigationMetrics: metricsRef.current.filter(m => m.type === 'navigation').length,
      paintMetrics: metricsRef.current.filter(m => m.type === 'paint').length,
      resourceMetrics: metricsRef.current.filter(m => m.type === 'resource').length,
      customMetrics: metricsRef.current.filter(m => m.type === 'custom').length,
    },
    memoryInfo: (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
    } : null,
  }), []);

  return {
    recordCustomMetric,
    getPerformanceReport,
    metricsCount: metricsRef.current.length,
  };
}

// パフォーマンス監視コンポーネント
export function PerformanceMonitor(props: PerformanceMonitorProps) {
  const { recordCustomMetric, getPerformanceReport } = usePerformanceMonitor(props);

  // 開発環境でのパフォーマンス情報表示
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const logPerformance = () => {
        console.group('[Performance Monitor] Current Report');
        console.table(getPerformanceReport());
        console.groupEnd();
      };

      // 5秒ごとにパフォーマンス情報をログ出力
      const interval = setInterval(logPerformance, 5000);
      return () => clearInterval(interval);
    }
  }, [getPerformanceReport]);

  // React のレンダリング時間を測定
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      recordCustomMetric('react-render-time', endTime - startTime);
    };
  });

  return null; // このコンポーネントは何もレンダリングしない
}

export default PerformanceMonitor;
