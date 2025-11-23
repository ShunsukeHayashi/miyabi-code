"use strict";
/**
 * Performance Optimization System
 * 大規模設計での処理速度最適化
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceOptimizer = void 0;
/**
 * Performance Optimizer
 * パフォーマンス最適化システム
 */
class PerformanceOptimizer {
    constructor(config) {
        this.config = {
            maxConcurrentRequests: 10,
            requestTimeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
            cacheEnabled: true,
            cacheTTL: 300, // 5 minutes
            batchSize: 50,
            enableCompression: true,
            enableCaching: true,
            memoryLimit: 1024 * 1024 * 1024, // 1GB
            cpuLimit: 80, // 80%
            ...config,
        };
        this.cache = new Map();
        this.batchQueue = new Map();
        this.activeRequests = new Set();
        this.requestQueue = [];
        this.metrics = {
            executionTime: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            apiCalls: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: 0,
            warnings: 0,
        };
        this.resourceMonitor = null;
        this.startResourceMonitoring();
        this.startRequestProcessor();
    }
    /**
     * リソース監視の開始
     */
    startResourceMonitoring() {
        this.resourceMonitor = setInterval(() => {
            this.updateResourceUsage();
            this.cleanupCache();
            this.checkResourceLimits();
        }, 5000); // 5秒間隔
    }
    /**
     * リクエスト処理の開始
     */
    startRequestProcessor() {
        setInterval(() => {
            this.processRequestQueue();
        }, 100); // 100ms間隔
    }
    /**
     * リソース使用量の更新
     */
    updateResourceUsage() {
        const usage = process.memoryUsage();
        this.metrics.memoryUsage = usage.heapUsed;
        // CPU使用率の簡易計算（実際の実装ではより精密な測定が必要）
        const startUsage = process.cpuUsage();
        setTimeout(() => {
            const endUsage = process.cpuUsage(startUsage);
            const totalTime = endUsage.user + endUsage.system;
            this.metrics.cpuUsage = (totalTime / 1000000) * 100; // マイクロ秒からパーセントに変換
        }, 100);
    }
    /**
     * キャッシュのクリーンアップ
     */
    cleanupCache() {
        const now = Date.now();
        const expiredKeys = [];
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl * 1000) {
                expiredKeys.push(key);
            }
        }
        expiredKeys.forEach((key) => {
            this.cache.delete(key);
        });
    }
    /**
     * リソース制限のチェック
     */
    checkResourceLimits() {
        const memoryPercentage = (this.metrics.memoryUsage / this.config.memoryLimit) * 100;
        if (memoryPercentage > 90) {
            this.handleMemoryPressure();
        }
        if (this.metrics.cpuUsage > this.config.cpuLimit) {
            this.handleCpuPressure();
        }
    }
    /**
     * メモリ不足時の処理
     */
    handleMemoryPressure() {
        // キャッシュの積極的なクリーンアップ
        const entries = Array.from(this.cache.entries()).sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        const toRemove = Math.ceil(entries.length * 0.3); // 30%を削除
        entries.slice(0, toRemove).forEach(([key]) => {
            this.cache.delete(key);
        });
        // ガベージコレクションの実行
        if (global.gc) {
            global.gc();
        }
    }
    /**
     * CPU負荷時の処理
     */
    handleCpuPressure() {
        // リクエスト処理の一時停止
        this.config.maxConcurrentRequests = Math.max(1, this.config.maxConcurrentRequests - 2);
        // 低優先度のリクエストを遅延
        this.requestQueue = this.requestQueue.filter((item) => {
            if (item.priority < 2) {
                // 低優先度
                return false; // 削除
            }
            return true;
        });
    }
    /**
     * リクエストキューの処理
     */
    processRequestQueue() {
        if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
            return;
        }
        if (this.requestQueue.length === 0) {
            return;
        }
        // 優先度順にソート
        this.requestQueue.sort((a, b) => b.priority - a.priority);
        const request = this.requestQueue.shift();
        if (!request)
            return;
        this.activeRequests.add(request.id);
        this.executeWithRetry(request.operation, request.id).finally(() => {
            this.activeRequests.delete(request.id);
        });
    }
    /**
     * リトライ付き実行
     */
    async executeWithRetry(operation, requestId, attempt = 1) {
        const startTime = Date.now();
        try {
            const result = await Promise.race([
                operation(),
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Request timeout')), this.config.requestTimeout);
                }),
            ]);
            this.metrics.executionTime = Date.now() - startTime;
            this.metrics.apiCalls++;
            return result;
        }
        catch (error) {
            this.metrics.errors++;
            if (attempt < this.config.retryAttempts) {
                await this.delay(this.config.retryDelay * attempt);
                return this.executeWithRetry(operation, requestId, attempt + 1);
            }
            throw error;
        }
    }
    /**
     * 遅延処理
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * キャッシュからの取得
     */
    getFromCache(key) {
        if (!this.config.cacheEnabled) {
            this.metrics.cacheMisses++;
            return null;
        }
        const entry = this.cache.get(key);
        if (!entry) {
            this.metrics.cacheMisses++;
            return null;
        }
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl * 1000) {
            this.cache.delete(key);
            this.metrics.cacheMisses++;
            return null;
        }
        // アクセス統計の更新
        entry.accessCount++;
        entry.lastAccessed = now;
        this.metrics.cacheHits++;
        return entry.value;
    }
    /**
     * キャッシュへの保存
     */
    setCache(key, value, ttl) {
        if (!this.config.cacheEnabled) {
            return;
        }
        const entry = {
            key,
            value,
            timestamp: Date.now(),
            ttl: ttl || this.config.cacheTTL,
            accessCount: 0,
            lastAccessed: Date.now(),
        };
        this.cache.set(key, entry);
    }
    /**
     * バッチ操作の作成
     */
    createBatch(items, operation, priority = 'medium') {
        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const batch = {
            id: batchId,
            items,
            priority,
            status: 'pending',
        };
        this.batchQueue.set(batchId, batch);
        // バッチサイズに応じて分割
        const chunks = this.chunkArray(items, this.config.batchSize);
        chunks.forEach((chunk, index) => {
            const chunkId = `${batchId}_chunk_${index}`;
            this.requestQueue.push({
                id: chunkId,
                operation: () => operation(chunk),
                priority: this.getPriorityValue(priority),
                timestamp: Date.now(),
            });
        });
        return batchId;
    }
    /**
     * 配列の分割
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    /**
     * 優先度の数値変換
     */
    getPriorityValue(priority) {
        switch (priority) {
            case 'low':
                return 1;
            case 'medium':
                return 2;
            case 'high':
                return 3;
            case 'critical':
                return 4;
            default:
                return 2;
        }
    }
    /**
     * バッチ操作の状態取得
     */
    getBatchStatus(batchId) {
        return this.batchQueue.get(batchId);
    }
    /**
     * 非同期処理の最適化実行
     */
    async executeOptimized(operation, priority = 'medium') {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                id: requestId,
                operation,
                priority: this.getPriorityValue(priority),
                timestamp: Date.now(),
            });
            // 結果の監視
            const checkResult = setInterval(() => {
                // 実際の実装では、結果を適切に管理する必要があります
                // ここでは簡易的な実装として、直接実行します
                clearInterval(checkResult);
                this.executeWithRetry(operation, requestId).then(resolve).catch(reject);
            }, 100);
        });
    }
    /**
     * 並列処理の最適化
     */
    async executeParallel(operations, maxConcurrency = this.config.maxConcurrentRequests) {
        const results = [];
        const executing = [];
        for (let i = 0; i < operations.length; i++) {
            const operation = operations[i];
            const promise = this.executeOptimized(operation).then((result) => {
                results[i] = result;
            });
            executing.push(promise);
            if (executing.length >= maxConcurrency) {
                await Promise.race(executing);
                executing.splice(executing.findIndex((p) => p === promise), 1);
            }
        }
        await Promise.all(executing);
        return results;
    }
    /**
     * パフォーマンスメトリクスの取得
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * リソース使用量の取得
     */
    getResourceUsage() {
        const usage = process.memoryUsage();
        const os = require('os');
        return {
            memory: {
                used: usage.heapUsed,
                available: usage.heapTotal - usage.heapUsed,
                total: usage.heapTotal,
                percentage: (usage.heapUsed / usage.heapTotal) * 100,
            },
            cpu: {
                usage: this.metrics.cpuUsage,
                cores: os.cpus().length,
                load: os.loadavg()[0],
            },
            network: {
                requestsPerSecond: this.calculateRequestsPerSecond(),
                averageResponseTime: this.metrics.executionTime,
                errorRate: this.calculateErrorRate(),
            },
            disk: {
                readBytes: 0, // 実際の実装では適切に測定
                writeBytes: 0,
                iops: 0,
            },
        };
    }
    /**
     * リクエスト/秒の計算
     */
    calculateRequestsPerSecond() {
        // 実際の実装では、時間窓でのリクエスト数を追跡
        return this.metrics.apiCalls / (this.metrics.executionTime / 1000);
    }
    /**
     * エラー率の計算
     */
    calculateErrorRate() {
        const totalRequests = this.metrics.apiCalls + this.metrics.errors;
        return totalRequests > 0 ? (this.metrics.errors / totalRequests) * 100 : 0;
    }
    /**
     * キャッシュ統計の取得
     */
    getCacheStatistics() {
        const totalAccesses = this.metrics.cacheHits + this.metrics.cacheMisses;
        const hitRate = totalAccesses > 0 ? (this.metrics.cacheHits / totalAccesses) * 100 : 0;
        const missRate = 100 - hitRate;
        const totalAccessCount = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.accessCount, 0);
        const averageAccessCount = this.cache.size > 0 ? totalAccessCount / this.cache.size : 0;
        return {
            size: this.cache.size,
            hitRate,
            missRate,
            totalAccesses,
            averageAccessCount,
        };
    }
    /**
     * 設定の更新
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    /**
     * リソースのクリーンアップ
     */
    cleanup() {
        if (this.resourceMonitor) {
            clearInterval(this.resourceMonitor);
            this.resourceMonitor = null;
        }
        this.cache.clear();
        this.batchQueue.clear();
        this.activeRequests.clear();
        this.requestQueue = [];
    }
    /**
     * パフォーマンスレポートの生成
     */
    generatePerformanceReport() {
        const metrics = this.getMetrics();
        const resourceUsage = this.getResourceUsage();
        const cacheStats = this.getCacheStatistics();
        const recommendations = [];
        // パフォーマンス推奨事項の生成
        if (cacheStats.hitRate < 50) {
            recommendations.push('Consider increasing cache TTL or cache size');
        }
        if (resourceUsage.memory.percentage > 80) {
            recommendations.push('Memory usage is high, consider optimizing memory usage');
        }
        if (resourceUsage.cpu.usage > 80) {
            recommendations.push('CPU usage is high, consider reducing concurrent requests');
        }
        if (resourceUsage.network.errorRate > 5) {
            recommendations.push('High error rate detected, check network connectivity');
        }
        return {
            metrics,
            resourceUsage,
            cacheStats,
            recommendations,
        };
    }
}
exports.PerformanceOptimizer = PerformanceOptimizer;
