/**
 * useCodeGen Hook
 *
 * React hook for code generation using Claudable (frontend) or GPT-OSS-20B (backend).
 * Provides automatic frontend/backend detection based on task description keywords.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export type LlmProvider = 'claude' | 'gpt-4' | 'gpt-oss' | 'groq';

export interface GenerateCodeRequest {
  taskDescription: string;
  outputDir?: string;
  priority?: number;
  llmProvider?: LlmProvider;
}

export interface GenerateCodeResponse {
  id: string;
  taskDescription: string;
  isFrontend: boolean;
  engine: 'claudable' | 'gpt-oss-20b';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface GenerationHistoryItem {
  id: string;
  taskDescription: string;
  isFrontend: boolean;
  engine: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  filesGenerated?: number;
  linesGenerated?: number;
}

/**
 * Hook for generating code
 */
export function useGenerateCode() {
  const queryClient = useQueryClient();

  return useMutation<GenerateCodeResponse, Error, GenerateCodeRequest>({
    mutationFn: async (request) => {
      const response = await apiClient.post<GenerateCodeResponse>(
        '/api/codegen/generate',
        request
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate history query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['codegen', 'history'] });
    },
  });
}

/**
 * Hook for fetching generation history
 */
export function useCodeGenHistory(limit = 50, offset = 0) {
  return useQuery<GenerationHistoryItem[]>({
    queryKey: ['codegen', 'history', { limit, offset }],
    queryFn: async () => {
      const response = await apiClient.get<GenerationHistoryItem[]>(
        `/api/codegen/history?limit=${limit}&offset=${offset}`
      );
      return response.data;
    },
  });
}

/**
 * Hook for fetching specific generation detail
 */
export function useCodeGenDetail(id: string | null) {
  return useQuery<GenerationHistoryItem>({
    queryKey: ['codegen', 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('No ID provided');
      const response = await apiClient.get<GenerationHistoryItem>(
        `/api/codegen/history/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Frontend detection keywords (same as backend)
 */
const FRONTEND_KEYWORDS = [
  // UI/Frontend
  'ui', 'dashboard', 'frontend', 'web app', 'webapp',
  // Frameworks
  'next.js', 'nextjs', 'react', 'vue', 'svelte',
  // Pages
  'landing page', 'lp', 'homepage', 'page',
  // Components
  'form', 'chart', 'graph', 'table', 'component', 'button', 'modal', 'dialog',
  // Styling
  'tailwind', 'css', 'style', 'design', 'layout',
  // UI Libraries
  'shadcn', 'mui', 'chakra', 'ant design',
];

/**
 * Detect if a task description is frontend-related (client-side validation)
 *
 * @param description - Task description
 * @returns true if frontend-related
 */
export function isFrontendTask(description: string): boolean {
  const descLower = description.toLowerCase();
  return FRONTEND_KEYWORDS.some(keyword => descLower.includes(keyword));
}

/**
 * Get suggested engine for a task description
 *
 * @param description - Task description
 * @returns 'claudable' for frontend, 'gpt-oss-20b' for backend
 */
export function getSuggestedEngine(description: string): 'claudable' | 'gpt-oss-20b' {
  return isFrontendTask(description) ? 'claudable' : 'gpt-oss-20b';
}

/**
 * Get LLM provider display information
 */
export function getProviderInfo(provider: LlmProvider) {
  switch (provider) {
    case 'claude':
      return {
        name: 'Anthropic Claude',
        description: 'Claude 3.5 Sonnet - 直接API統合',
        color: '#8B5CF6',
        icon: '🧠',
      };
    case 'gpt-4':
      return {
        name: 'OpenAI GPT-4',
        description: 'GPT-4 Turbo - OpenAI API',
        color: '#10B981',
        icon: '🤖',
      };
    case 'gpt-oss':
      return {
        name: 'GPT-OSS-20B',
        description: 'Ollama経由のOSS LLM（デフォルト）',
        color: '#3B82F6',
        icon: '⚡',
      };
    case 'groq':
      return {
        name: 'Groq',
        description: 'Llama 3 - 超高速推論',
        color: '#F59E0B',
        icon: '🚀',
      };
  }
}
