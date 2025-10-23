'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toDataAttributes } from '@/lib/ai-metadata';
import {
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  lastRun?: Date;
  successRate: number;
  executionCount: number;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Auto Issue Triage',
      description: 'Automatically analyze and label new issues',
      status: 'active',
      lastRun: new Date('2025-01-15T10:30:00'),
      successRate: 98,
      executionCount: 142,
    },
    {
      id: '2',
      name: 'Code Review Automation',
      description: 'Run CodeGenAgent on PRs and provide review comments',
      status: 'active',
      lastRun: new Date('2025-01-15T09:15:00'),
      successRate: 95,
      executionCount: 87,
    },
    {
      id: '3',
      name: 'Daily Report Generator',
      description: 'Generate daily execution reports and send notifications',
      status: 'inactive',
      lastRun: new Date('2025-01-14T18:00:00'),
      successRate: 100,
      executionCount: 30,
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        {...toDataAttributes({
          role: 'header',
          target: 'workflows-page-header',
          description: 'Workflows management page header with title and description',
          context: 'workflows-page',
        })}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-5xl font-semibold tracking-tight text-gray-900 mb-3">
              Workflows
            </h2>
            <p className="text-lg text-gray-600">
              自動化ワークフローを作成・管理してAgent実行を最適化
            </p>
          </div>
          <Button
            size="lg"
            className="bg-gray-900 hover:bg-gray-800 text-white transition-colors"
            {...toDataAttributes({
              role: 'button',
              action: 'click',
              target: 'workflow-create-button',
              description: 'Create new workflow to automate agent execution',
              context: 'workflows-page-header',
              expectedResult: 'navigate-to-page',
              navigationTarget: '/dashboard/workflows/create',
              instructions: 'STEP 1: Click this button to navigate to workflow creation page. STEP 2: Define workflow name, description, and trigger conditions. STEP 3: Add agent execution steps. STEP 4: Save workflow.',
              nextActions: 'After creation, workflow appears in list and can be activated to start automation',
            })}
          >
            <Plus className="h-5 w-5 mr-2" />
            新規作成
          </Button>
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.length === 0 ? (
          <Card
            {...toDataAttributes({
              role: 'card',
              target: 'workflows-empty-state',
              description: 'Empty state card when no workflows exist',
              context: 'workflows-list',
            })}
          >
            <CardContent className="p-12 text-center">
              <p className="text-lg text-gray-600 font-light">
                ワークフローがありません
              </p>
              <p className="mt-3 text-base text-gray-500">
                新規作成ボタンから最初のワークフローを作成してください
              </p>
            </CardContent>
          </Card>
        ) : (
          workflows.map((workflow) => (
            <Card
              key={workflow.id}
              className="border border-gray-200 hover:bg-gray-50 transition-colors"
              {...toDataAttributes({
                role: 'card',
                target: `workflow-card-${workflow.id}`,
                description: `Workflow: ${workflow.name}, Status: ${workflow.status}`,
                context: 'workflows-list',
                state: workflow.status,
              })}
            >
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {workflow.name}
                      </h3>
                      <Badge
                        variant={workflow.status === 'active' ? 'default' : 'secondary'}
                        className={
                          workflow.status === 'active'
                            ? 'bg-gray-50 text-gray-900 border border-gray-300 hover:bg-gray-100 font-medium'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300 font-medium'
                        }
                        {...toDataAttributes({
                          role: 'badge',
                          target: `workflow-status-${workflow.id}`,
                          description: `Workflow status: ${workflow.status}`,
                          context: 'workflow-card',
                          state: workflow.status,
                        })}
                      >
                        {workflow.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-base text-gray-600 mb-4">{workflow.description}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        最終実行:{' '}
                        {workflow.lastRun
                          ? new Date(workflow.lastRun).toLocaleString('ja-JP')
                          : 'なし'}
                      </span>
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        成功率: {workflow.successRate}%
                      </span>
                      <span className="flex items-center gap-2">
                        実行回数: {workflow.executionCount}回
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      {...toDataAttributes({
                        role: 'button',
                        action: 'click',
                        target: `workflow-toggle-${workflow.id}`,
                        description: `${workflow.status === 'active' ? 'Pause' : 'Activate'} workflow ${workflow.name}`,
                        context: 'workflow-card',
                        expectedResult: 'update-state',
                        state: workflow.status,
                      })}
                    >
                      {workflow.status === 'active' ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          停止
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          有効化
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      {...toDataAttributes({
                        role: 'button',
                        action: 'click',
                        target: `workflow-edit-${workflow.id}`,
                        description: `Edit workflow ${workflow.name}`,
                        context: 'workflow-card',
                        expectedResult: 'navigate-to-page',
                        navigationTarget: `/dashboard/workflows/${workflow.id}/edit`,
                      })}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      編集
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                      {...toDataAttributes({
                        role: 'button',
                        action: 'click',
                        target: `workflow-delete-${workflow.id}`,
                        description: `Delete workflow ${workflow.name}`,
                        context: 'workflow-card',
                        expectedResult: 'show-modal',
                      })}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      削除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <div
        className="text-center text-sm text-gray-500"
        {...toDataAttributes({
          role: 'section',
          target: 'workflows-summary',
          description: `Workflows summary: ${workflows.length} total, ${workflows.filter((w) => w.status === 'active').length} active`,
          context: 'workflows-page',
        })}
      >
        {workflows.length} 件のワークフロー（
        {workflows.filter((w) => w.status === 'active').length} 件が有効）
      </div>
    </div>
  );
}
