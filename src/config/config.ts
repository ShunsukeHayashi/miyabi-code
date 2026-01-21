/**
 * Configuration Management
 * miyabicode.json schema validation and loading
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { MiyabiCodeConfig } from '../types.js';
import { ErrorCode, MiyabiCodeError } from '../utils/errors.js';

// ============================================
// Schema Definition
// ============================================

const LLMConfigSchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'google', 'local']),
  model: z.string(),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  maxTokens: z.number().int().positive().optional().default(4096),
  temperature: z.number().min(0).max(2).optional().default(0.7),
});

const MCPConfigSchema = z.object({
  enabled: z.array(z.string()).default([]),
  progressiveDisclosure: z.boolean().optional().default(true),
});

const TmuxConfigSchema = z.object({
  session: z.string().default('miyabi'),
  target: z.string().default('agents.0'),
  permanentPaneId: z.string().optional(),
});

const GitHubConfigSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  token: z.string().optional(),
});

const WorkflowConfigSchema = z.object({
  branchNaming: z.enum(['conventional', 'custom']).default('conventional'),
  commitFormat: z.enum(['conventional', 'custom']).default('conventional'),
  prTemplate: z.string().optional(),
});

export const MiyabiCodeConfigSchema = z.object({
  name: z.string().min(1),
  version: z.string().optional(),
  llm: LLMConfigSchema,
  mcp: MCPConfigSchema,
  tmux: TmuxConfigSchema.optional(),
  github: GitHubConfigSchema.optional(),
  workflow: WorkflowConfigSchema.optional(),
});

// ============================================
// Config Loader
// ============================================

export interface ConfigLoaderOptions {
  cwd?: string;
  configPath?: string;
}

export async function loadConfig(
  options: ConfigLoaderOptions = {}
): Promise<MiyabiCodeConfig> {
  const { cwd = process.cwd(), configPath } = options;

  const path = configPath
    ? resolve(cwd, configPath)
    : resolve(cwd, 'miyabicode.json');

  try {
    const content = await readFile(path, 'utf-8');
    const raw = JSON.parse(content);

    const validated = MiyabiCodeConfigSchema.parse(raw);

    // Environment variable overrides
    if (process.env.ANTHROPIC_API_KEY && validated.llm.provider === 'anthropic') {
      validated.llm.apiKey = process.env.ANTHROPIC_API_KEY;
    }
    if (process.env.OPENAI_API_KEY && validated.llm.provider === 'openai') {
      validated.llm.apiKey = process.env.OPENAI_API_KEY;
    }
    if (process.env.GITHUB_TOKEN && validated.github) {
      validated.github.token = process.env.GITHUB_TOKEN;
    }

    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new MiyabiCodeError(
        `Configuration validation failed: ${error.errors.map(e => e.message).join(', ')}`,
        ErrorCode.CONFIG_INVALID,
        { errors: error.errors }
      );
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new MiyabiCodeError(
        `Configuration file not found: ${path}`,
        ErrorCode.CONFIG_NOT_FOUND,
        { path }
      );
    }

    throw error;
  }
}

// ============================================
// Config Validator
// ============================================

export async function validateConfig(
  config: unknown
): Promise<MiyabiCodeConfig> {
  return MiyabiCodeConfigSchema.parse(config);
}

// ============================================
// Default Config Generator
// ============================================

export function generateDefaultConfig(projectName: string): MiyabiCodeConfig {
  return {
    name: projectName,
    version: '0.1.0',
    llm: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      maxTokens: 4096,
      temperature: 0.7,
    },
    mcp: {
      enabled: ['miyabi-mcp-bundle'],
      progressiveDisclosure: true,
    },
    tmux: {
      session: 'miyabi',
      target: 'agents.0',
    },
    workflow: {
      branchNaming: 'conventional',
      commitFormat: 'conventional',
    },
  };
}
