'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AgentNodeData, IssueNodeData, ConditionNodeData } from './index';

/**
 * NodeEditDialog - Node編集ダイアログコンポーネント
 *
 * Issue #176: Phase 2.3
 *
 * 機能:
 * - Agent種別選択
 * - Issue番号入力
 * - 説明入力
 * - フォームバリデーション
 *
 * Design: Ive-style (grayscale, minimal)
 */

export interface NodeEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeData: AgentNodeData | IssueNodeData | ConditionNodeData | null;
  nodeType: 'agent' | 'issue' | 'condition' | null;
  onSave: (data: AgentNodeData | IssueNodeData | ConditionNodeData) => void;
}

const agentTypes = [
  { value: 'Coordinator', label: 'Coordinator - タスク統括' },
  { value: 'CodeGen', label: 'CodeGen - コード生成' },
  { value: 'Review', label: 'Review - 品質レビュー' },
  { value: 'Deployment', label: 'Deployment - デプロイ' },
  { value: 'PR', label: 'PR - PR作成' },
  { value: 'Issue', label: 'Issue - Issue分析' },
];

export default function NodeEditDialog({
  open,
  onOpenChange,
  nodeData,
  nodeType,
  onSave,
}: NodeEditDialogProps) {
  // Agent node fields
  const [agentType, setAgentType] = useState<string>('');
  const [agentDescription, setAgentDescription] = useState<string>('');

  // Issue node fields
  const [issueNumber, setIssueNumber] = useState<number>(0);
  const [issueTitle, setIssueTitle] = useState<string>('');

  // Condition node fields
  const [condition, setCondition] = useState<string>('');
  const [trueLabel, setTrueLabel] = useState<string>('True');
  const [falseLabel, setFalseLabel] = useState<string>('False');

  // Initialize form when dialog opens or nodeData changes
  useEffect(() => {
    if (nodeData && nodeType) {
      if (nodeType === 'agent') {
        const data = nodeData as AgentNodeData;
        setAgentType(data.agentType);
        setAgentDescription(data.description || '');
      } else if (nodeType === 'issue') {
        const data = nodeData as IssueNodeData;
        setIssueNumber(data.issueNumber);
        setIssueTitle(data.title);
      } else if (nodeType === 'condition') {
        const data = nodeData as ConditionNodeData;
        setCondition(data.condition);
        setTrueLabel(data.trueLabel);
        setFalseLabel(data.falseLabel);
      }
    }
  }, [nodeData, nodeType]);

  const handleSave = () => {
    if (nodeType === 'agent') {
      if (!agentType) {
        alert('Agent種別を選択してください');
        return;
      }
      onSave({
        agentType: agentType as AgentNodeData['agentType'],
        description: agentDescription,
        status: (nodeData as AgentNodeData)?.status || 'idle',
      } as AgentNodeData);
    } else if (nodeType === 'issue') {
      if (!issueNumber || issueNumber <= 0) {
        alert('有効なIssue番号を入力してください');
        return;
      }
      onSave({
        issueNumber,
        title: issueTitle,
        state: (nodeData as IssueNodeData)?.state || 'open',
      } as IssueNodeData);
    } else if (nodeType === 'condition') {
      if (!condition) {
        alert('条件式を入力してください');
        return;
      }
      onSave({
        condition,
        trueLabel,
        falseLabel,
      } as ConditionNodeData);
    }

    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-ai-component="node-edit-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">
            {nodeType === 'agent' && 'Agent設定'}
            {nodeType === 'issue' && 'Issue設定'}
            {nodeType === 'condition' && '条件分岐設定'}
          </DialogTitle>
          <DialogDescription>
            {nodeType === 'agent' && 'Agent種別と説明を設定してください'}
            {nodeType === 'issue' && 'Issue番号とタイトルを設定してください'}
            {nodeType === 'condition' && '条件式とラベルを設定してください'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Agent Node Fields */}
          {nodeType === 'agent' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="agentType">Agent種別 *</Label>
                <Select value={agentType} onValueChange={setAgentType}>
                  <SelectTrigger id="agentType" data-ai-input="agent-type">
                    <SelectValue placeholder="Agent種別を選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  placeholder="Agentの役割や処理内容を記述..."
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  rows={3}
                  data-ai-input="agent-description"
                />
              </div>
            </>
          )}

          {/* Issue Node Fields */}
          {nodeType === 'issue' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="issueNumber">Issue番号 *</Label>
                <Input
                  id="issueNumber"
                  type="number"
                  placeholder="270"
                  value={issueNumber || ''}
                  onChange={(e) => setIssueNumber(parseInt(e.target.value) || 0)}
                  data-ai-input="issue-number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issueTitle">タイトル</Label>
                <Input
                  id="issueTitle"
                  placeholder="Issueのタイトル..."
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  data-ai-input="issue-title"
                />
              </div>
            </>
          )}

          {/* Condition Node Fields */}
          {nodeType === 'condition' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="condition">条件式 *</Label>
                <Input
                  id="condition"
                  placeholder="例: status === 'success'"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  data-ai-input="condition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="trueLabel">Trueラベル</Label>
                  <Input
                    id="trueLabel"
                    placeholder="True"
                    value={trueLabel}
                    onChange={(e) => setTrueLabel(e.target.value)}
                    data-ai-input="true-label"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="falseLabel">Falseラベル</Label>
                  <Input
                    id="falseLabel"
                    placeholder="False"
                    value={falseLabel}
                    onChange={(e) => setFalseLabel(e.target.value)}
                    data-ai-input="false-label"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            data-ai-action="cancel"
          >
            キャンセル
          </Button>
          <Button onClick={handleSave} data-ai-action="save">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
