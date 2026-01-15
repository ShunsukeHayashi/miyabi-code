/**
 * Database Query Optimization Utilities
 * Advanced query optimization, connection pooling, and performance monitoring
 */

import type { PoolConfig } from 'pg';
import { Pool } from 'pg';
import { createHash } from 'crypto';
import { cacheManager } from '../performance/cache-manager';

interface QueryMetrics {
  query: string;
  duration: number;
  rows: number;
  timestamp: number;
  cached: boolean;
}

interface OptimizedQueryOptions {
  cacheable?: boolean;
  cacheTTL?: number;
  tags?: string[];
  timeout?: number;
  retries?: number;
}

interface ConnectionPoolStats {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingClients: number;
}

export class DatabaseOptimizer {
  private pool: Pool;
  private queryMetrics: QueryMetrics[] = [];
  private slowQueryThreshold = 1000; // 1 second
  private preparedStatements = new Map<string, string>();

  constructor(config?: PoolConfig) {
    this.pool = new Pool({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,

      // Optimized connection pool settings
      max: parseInt(process.env.DATABASE_POOL_MAX || '20'), // Maximum connections
      min: parseInt(process.env.DATABASE_POOL_MIN || '5'),  // Minimum connections
      idleTimeoutMillis: 30000, // 30 seconds
      connectionTimeoutMillis: 5000, // 5 seconds
      maxUses: 7500, // Maximum uses per connection

      // SSL configuration for production
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
      } : false,

      // Additional optimization settings
      statement_timeout: 60000, // 60 seconds
      query_timeout: 30000, // 30 seconds
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,

      ...config,
    });

    // Connection pool event listeners for monitoring
    this.pool.on('connect', () => {
      console.debug('Database connection established');
    });

    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });

    this.pool.on('remove', () => {
      console.debug('Database connection removed from pool');
    });
  }

  /**
   * Execute optimized query with caching and metrics
   */
  async query<T = any>(
    text: string,
    params?: any[],
    options: OptimizedQueryOptions = {},
  ): Promise<{ rows: T[]; rowCount: number; metrics: QueryMetrics }> {
    const startTime = Date.now();
    const queryHash = this.generateQueryHash(text, params);

    // Check cache first if cacheable
    if (options.cacheable) {
      const cacheKey = `query:${queryHash}`;
      const cached = await cacheManager.get<{ rows: T[]; rowCount: number }>(
        cacheKey,
        { tier: 'l2' },
      );

      if (cached) {
        const metrics: QueryMetrics = {
          query: text,
          duration: Date.now() - startTime,
          rows: cached.rowCount,
          timestamp: Date.now(),
          cached: true,
        };

        this.recordMetrics(metrics);
        return { ...cached, metrics };
      }
    }

    let result;
    let retries = options.retries || 0;

    while (retries >= 0) {
      try {
        const client = await this.pool.connect();

        try {
          // Set query timeout
          if (options.timeout) {
            await client.query(`SET statement_timeout = ${options.timeout}`);
          }

          // Execute query
          result = await client.query(text, params);
          break;

        } finally {
          client.release();
        }

      } catch (error) {
        if (retries > 0) {
          retries--;
          await this.delay(100 * (options.retries! - retries)); // Exponential backoff
          continue;
        }
        throw error;
      }
    }

    const duration = Date.now() - startTime;
    const metrics: QueryMetrics = {
      query: text,
      duration,
      rows: result.rowCount || 0,
      timestamp: Date.now(),
      cached: false,
    };

    this.recordMetrics(metrics);

    // Cache result if cacheable
    if (options.cacheable && result) {
      const cacheKey = `query:${queryHash}`;
      await cacheManager.set(
        cacheKey,
        { rows: result.rows, rowCount: result.rowCount },
        {
          ttl: options.cacheTTL || 300,
          tags: options.tags,
          tier: 'l2',
        },
      );
    }

    return { rows: result.rows, rowCount: result.rowCount, metrics };
  }

  /**
   * Prepared statement execution for frequently used queries
   */
  async preparedQuery<T = any>(
    name: string,
    text: string,
    params?: any[],
  ): Promise<{ rows: T[]; rowCount: number }> {
    const client = await this.pool.connect();

    try {
      // Prepare statement if not already prepared
      if (!this.preparedStatements.has(name)) {
        await client.query(`PREPARE ${name} AS ${text}`);
        this.preparedStatements.set(name, text);
      }

      const result = await client.query(`EXECUTE ${name}${params ? ` (${params.map(() => `$${  params.indexOf(params[0]) + 1}`).join(', ')})` : ''}`, params);
      return { rows: result.rows, rowCount: result.rowCount };

    } finally {
      client.release();
    }
  }

  /**
   * Transaction with automatic retry and rollback
   */
  async transaction<T>(
    callback: (query: (text: string, params?: any[]) => Promise<any>) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const transactionQuery = async (text: string, params?: any[]) => client.query(text, params);

      const result = await callback(transactionQuery);
      await client.query('COMMIT');

      return result;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Batch operations for bulk data processing
   */
  async batchInsert(
    table: string,
    columns: string[],
    data: any[][],
    options: { batchSize?: number; onConflict?: string } = {},
  ): Promise<void> {
    const batchSize = options.batchSize || 1000;
    const batches = this.chunkArray(data, batchSize);

    for (const batch of batches) {
      const placeholders = batch.map((_, i) =>
        `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`,
      ).join(', ');

      const values = batch.flat();
      const onConflictClause = options.onConflict || 'DO NOTHING';

      const query = `
        INSERT INTO ${table} (${columns.join(', ')})
        VALUES ${placeholders}
        ON CONFLICT ${onConflictClause}
      `;

      await this.query(query, values);
    }
  }

  /**
   * Query analysis and optimization suggestions
   */
  async analyzeQuery(query: string): Promise<{
    executionPlan: any;
    suggestions: string[];
    estimatedCost: number;
  }> {
    const explainResult = await this.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`);
    const plan = explainResult.rows[0]['QUERY PLAN'][0];

    const suggestions = this.generateOptimizationSuggestions(plan);
    const estimatedCost = plan['Total Cost'] || 0;

    return {
      executionPlan: plan,
      suggestions,
      estimatedCost,
    };
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats(): ConnectionPoolStats {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      activeConnections: this.pool.totalCount - this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
    };
  }

  /**
   * Get query performance metrics
   */
  getQueryMetrics(): {
    totalQueries: number;
    averageDuration: number;
    slowQueries: QueryMetrics[];
    cacheHitRate: number;
    } {
    const totalQueries = this.queryMetrics.length;
    const averageDuration = totalQueries > 0
      ? this.queryMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries
      : 0;

    const slowQueries = this.queryMetrics.filter(m => m.duration > this.slowQueryThreshold);
    const cachedQueries = this.queryMetrics.filter(m => m.cached).length;
    const cacheHitRate = totalQueries > 0 ? cachedQueries / totalQueries : 0;

    return {
      totalQueries,
      averageDuration,
      slowQueries,
      cacheHitRate,
    };
  }

  /**
   * Optimize database configuration
   */
  async optimizeDatabase(): Promise<void> {
    const optimizations = [
      // Enable query planner statistics
      'SET track_counts = on',
      'SET track_functions = all',

      // Optimize memory settings
      "SET shared_preload_libraries = 'pg_stat_statements'",

      // Enable automatic vacuum optimization
      'SET autovacuum = on',
      'SET autovacuum_vacuum_scale_factor = 0.1',
      'SET autovacuum_analyze_scale_factor = 0.05',
    ];

    for (const sql of optimizations) {
      try {
        await this.query(sql);
      } catch (error) {
        console.warn(`Optimization query failed: ${sql}`, error);
      }
    }
  }

  // Private helper methods

  private generateQueryHash(text: string, params?: any[]): string {
    const queryString = text + JSON.stringify(params || []);
    return createHash('md5').update(queryString).digest('hex');
  }

  private recordMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }

    // Log slow queries in development
    if (process.env.NODE_ENV === 'development' && metrics.duration > this.slowQueryThreshold) {
      console.warn(`Slow query detected (${metrics.duration}ms):`, metrics.query.substring(0, 100));
    }
  }

  private generateOptimizationSuggestions(plan: any): string[] {
    const suggestions: string[] = [];

    if (plan['Total Cost'] > 1000) {
      suggestions.push('Consider adding indexes for high-cost operations');
    }

    if (plan['Execution Time'] > 1000) {
      suggestions.push('Query execution time is high, consider query optimization');
    }

    // Recursive analysis of plan nodes
    this.analyzePlanNode(plan.Plan, suggestions);

    return suggestions;
  }

  private analyzePlanNode(node: any, suggestions: string[]): void {
    if (node['Node Type'] === 'Seq Scan') {
      suggestions.push(`Consider adding index on table: ${node['Relation Name']}`);
    }

    if (node['Node Type'] === 'Sort' && node['Sort Method'] === 'external sort') {
      suggestions.push('Sort operation is using external disk, consider increasing work_mem');
    }

    if (node.Plans) {
      node.Plans.forEach((child: any) => this.analyzePlanNode(child, suggestions));
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Pre-configured query builders for common operations
export class QueryBuilder {
  private static optimizer = new DatabaseOptimizer();

  /**
   * Optimized course queries
   */
  static async getCourses(filters: {
    category?: string;
    difficulty?: string;
    instructor?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(filters.category);
    }

    if (filters.difficulty) {
      conditions.push(`difficulty = $${paramIndex++}`);
      params.push(filters.difficulty);
    }

    if (filters.instructor) {
      conditions.push(`instructor_id = $${paramIndex++}`);
      params.push(filters.instructor);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitClause = filters.limit ? `LIMIT $${paramIndex++}` : '';
    const offsetClause = filters.offset ? `OFFSET $${paramIndex++}` : '';

    if (filters.limit) {params.push(filters.limit);}
    if (filters.offset) {params.push(filters.offset);}

    const query = `
      SELECT
        c.*,
        u.name as instructor_name,
        COUNT(e.id) as enrollment_count,
        AVG(r.rating) as average_rating
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN reviews r ON c.id = r.course_id
      ${whereClause}
      GROUP BY c.id, u.name
      ORDER BY c.created_at DESC
      ${limitClause} ${offsetClause}
    `;

    return this.optimizer.query(query, params, {
      cacheable: true,
      cacheTTL: 300,
      tags: ['courses', 'enrollments'],
    });
  }

  /**
   * Optimized user progress queries
   */
  static async getUserProgress(userId: string, courseId?: string) {
    const query = courseId
      ? `
        SELECT
          p.*,
          l.title as lesson_title,
          c.title as course_title
        FROM progress p
        JOIN lessons l ON p.lesson_id = l.id
        JOIN courses c ON l.course_id = c.id
        WHERE p.user_id = $1 AND c.id = $2
        ORDER BY p.updated_at DESC
      `
      : `
        SELECT
          c.id as course_id,
          c.title as course_title,
          COUNT(l.id) as total_lessons,
          COUNT(p.id) as completed_lessons,
          ROUND(
            (COUNT(p.id)::decimal / COUNT(l.id)) * 100, 2
          ) as progress_percentage
        FROM courses c
        LEFT JOIN lessons l ON c.id = l.course_id
        LEFT JOIN progress p ON l.id = p.lesson_id AND p.user_id = $1 AND p.completed = true
        WHERE EXISTS (
          SELECT 1 FROM enrollments e
          WHERE e.course_id = c.id AND e.user_id = $1
        )
        GROUP BY c.id, c.title
        ORDER BY progress_percentage DESC
      `;

    const params = courseId ? [userId, courseId] : [userId];

    return this.optimizer.query(query, params, {
      cacheable: true,
      cacheTTL: 60,
      tags: [`user:${userId}`, 'progress'],
    });
  }
}

// Singleton instance
export const dbOptimizer = new DatabaseOptimizer();

// Utility functions
export const withDbTransaction = <T>(
  callback: (query: (text: string, params?: any[]) => Promise<any>) => Promise<T>,
): Promise<T> => dbOptimizer.transaction(callback);

export const batchInsert = (
  table: string,
  columns: string[],
  data: any[][],
  options?: { batchSize?: number; onConflict?: string },
): Promise<void> => dbOptimizer.batchInsert(table, columns, data, options);
