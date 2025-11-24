/**
 * Performance Optimization System
 * 大規模設計での処理速度最適化
 */
export interface PerformanceMetrics {
    executionTime: number;
    memoryUsage: number;
    cpuUsage: number;
    apiCalls: number;
    cacheHits: number;
    cacheMisses: number;
    errors: number;
    warnings: number;
}
export interface OptimizationConfig {
    maxConcurrentRequests: number;
    requestTimeout: number;
    retryAttempts: number;
    retryDelay: number;
    cacheEnabled: boolean;
    cacheTTL: number;
    batchSize: number;
    enableCompression: boolean;
    enableCaching: boolean;
    memoryLimit: number;
    cpuLimit: number;
}
export interface BatchOperation<T> {
    id: string;
    items: T[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    startTime?: Date;
    endTime?: Date;
    result?: any;
    error?: string;
}
export interface CacheEntry<T> {
    key: string;
    value: T;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccessed: number;
}
export interface ResourceUsage {
    memory: {
        used: number;
        available: number;
        total: number;
        percentage: number;
    };
    cpu: {
        usage: number;
        cores: number;
        load: number;
    };
    network: {
        requestsPerSecond: number;
        averageResponseTime: number;
        errorRate: number;
    };
    disk: {
        readBytes: number;
        writeBytes: number;
        iops: number;
    };
}
/**
 * Performance Optimizer
 * パフォーマンス最適化システム
 */
export declare class PerformanceOptimizer {
    private config;
    private cache;
    private batchQueue;
    private activeRequests;
    private metrics;
    private resourceMonitor;
    private requestQueue;
    constructor(config?: Partial<OptimizationConfig>);
    /**
     * リソース監視の開始
     */
    private startResourceMonitoring;
    /**
     * リクエスト処理の開始
     */
    private startRequestProcessor;
    /**
     * リソース使用量の更新
     */
    private updateResourceUsage;
    /**
     * キャッシュのクリーンアップ
     */
    private cleanupCache;
    /**
     * リソース制限のチェック
     */
    private checkResourceLimits;
    /**
     * メモリ不足時の処理
     */
    private handleMemoryPressure;
    /**
     * CPU負荷時の処理
     */
    private handleCpuPressure;
    /**
     * リクエストキューの処理
     */
    private processRequestQueue;
    /**
     * リトライ付き実行
     */
    private executeWithRetry;
    /**
     * 遅延処理
     */
    private delay;
    /**
     * キャッシュからの取得
     */
    getFromCache<T>(key: string): T | null;
    /**
     * キャッシュへの保存
     */
    setCache<T>(key: string, value: T, ttl?: number): void;
    /**
     * バッチ操作の作成
     */
    createBatch<T>(items: T[], operation: (batch: T[]) => Promise<any>, priority?: 'low' | 'medium' | 'high' | 'critical'): string;
    /**
     * 配列の分割
     */
    private chunkArray;
    /**
     * 優先度の数値変換
     */
    private getPriorityValue;
    /**
     * バッチ操作の状態取得
     */
    getBatchStatus(batchId: string): BatchOperation<any> | undefined;
    /**
     * 非同期処理の最適化実行
     */
    executeOptimized<T>(operation: () => Promise<T>, priority?: 'low' | 'medium' | 'high' | 'critical'): Promise<T>;
    /**
     * 並列処理の最適化
     */
    executeParallel<T>(operations: Array<() => Promise<T>>, maxConcurrency?: number): Promise<T[]>;
    /**
     * パフォーマンスメトリクスの取得
     */
    getMetrics(): PerformanceMetrics;
    /**
     * リソース使用量の取得
     */
    getResourceUsage(): ResourceUsage;
    /**
     * リクエスト/秒の計算
     */
    private calculateRequestsPerSecond;
    /**
     * エラー率の計算
     */
    private calculateErrorRate;
    /**
     * キャッシュ統計の取得
     */
    getCacheStatistics(): {
        size: number;
        hitRate: number;
        missRate: number;
        totalAccesses: number;
        averageAccessCount: number;
    };
    /**
     * 設定の更新
     */
    updateConfig(newConfig: Partial<OptimizationConfig>): void;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): void;
    /**
     * パフォーマンスレポートの生成
     */
    generatePerformanceReport(): {
        metrics: PerformanceMetrics;
        resourceUsage: ResourceUsage;
        cacheStats: ReturnType<PerformanceOptimizer['getCacheStatistics']>;
        recommendations: string[];
    };
}
