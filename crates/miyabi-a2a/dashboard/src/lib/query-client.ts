import { QueryClient } from "@tanstack/react-query";

/**
 * React Query Client - グローバル設定
 *
 * キャッシュ戦略:
 * - staleTime: 30秒 - データが古くなるまでの時間
 * - cacheTime: 5分 - キャッシュが破棄されるまでの時間
 * - refetchOnWindowFocus: true - ウィンドウフォーカス時に再フェッチ
 * - refetchOnReconnect: true - ネットワーク再接続時に再フェッチ
 * - retry: 3回 - 失敗時のリトライ回数
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // キャッシュ戦略
      staleTime: 30 * 1000, // 30秒間はキャッシュを"fresh"と見なす
      gcTime: 5 * 60 * 1000, // 5分後に未使用キャッシュをGC（旧cacheTime）

      // リフェッチ戦略
      refetchOnWindowFocus: true, // ウィンドウフォーカス時に再フェッチ
      refetchOnReconnect: true, // ネットワーク再接続時に再フェッチ
      refetchOnMount: true, // コンポーネントマウント時に再フェッチ

      // リトライ戦略
      retry: 3, // 失敗時に3回リトライ
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 指数バックオフ (max 30秒)

      // エラーハンドリング
      throwOnError: false, // エラーをthrowしない（useQueryのerrorで取得）
    },
    mutations: {
      // ミューテーション設定
      retry: 1, // 1回だけリトライ
      retryDelay: 1000, // 1秒待機
    },
  },
});

/**
 * Query Keys - 型安全なクエリキー管理
 */
export const queryKeys = {
  // System Status
  systemStatus: ["system", "status"] as const,

  // Agents
  agents: {
    all: ["agents"] as const,
    list: () => [...queryKeys.agents.all, "list"] as const,
    detail: (id: string) => [...queryKeys.agents.all, "detail", id] as const,
    byCategory: (category: "coding" | "business") => [...queryKeys.agents.all, "category", category] as const,
    byStatus: (status: string) => [...queryKeys.agents.all, "status", status] as const,
  },

  // Metrics
  metrics: {
    all: ["metrics"] as const,
    history: () => [...queryKeys.metrics.all, "history"] as const,
    realtime: () => [...queryKeys.metrics.all, "realtime"] as const,
  },

  // Errors
  errors: {
    all: ["errors"] as const,
    critical: () => [...queryKeys.errors.all, "critical"] as const,
    warnings: () => [...queryKeys.errors.all, "warnings"] as const,
  },

  // Events
  events: {
    all: ["events"] as const,
    timeline: () => [...queryKeys.events.all, "timeline"] as const,
    recent: (limit: number) => [...queryKeys.events.all, "recent", limit] as const,
  },
} as const;
