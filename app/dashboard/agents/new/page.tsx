'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import type { AgentTemplate, AgentTrigger } from '@/lib/github-app/agent-types';

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(' ');
}

const agentTemplates: AgentTemplate[] = [
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Automatically reviews pull requests for code quality, best practices, and potential bugs',
    role: 'code-reviewer',
    icon: 'code',
    defaultTriggers: ['pr_opened', 'pr_review_requested'],
    defaultPrompt: 'Review this code for quality, security issues, and best practices. Provide actionable feedback.',
    capabilities: ['Code analysis', 'Security scanning', 'Best practice checks', 'Inline comments'],
    recommended: true,
  },
  {
    id: 'issue-analyzer',
    name: 'Issue Analyzer',
    description: 'Analyzes new issues, categorizes them, and suggests solutions or relevant documentation',
    role: 'issue-analyzer',
    icon: 'search',
    defaultTriggers: ['issue_opened'],
    defaultPrompt: 'Analyze this issue, categorize it, and provide initial guidance or solutions.',
    capabilities: ['Issue categorization', 'Solution suggestions', 'Documentation linking', 'Priority assessment'],
    recommended: true,
  },
  {
    id: 'pr-assistant',
    name: 'PR Assistant',
    description: 'Helps with pull request management, including description generation and merge readiness checks',
    role: 'pr-assistant',
    icon: 'git-pull-request',
    defaultTriggers: ['pr_opened'],
    defaultPrompt: 'Analyze this PR, generate a comprehensive description, and check merge readiness.',
    capabilities: ['Description generation', 'Merge checks', 'Conflict detection', 'Changelog updates'],
    recommended: false,
  },
  {
    id: 'documentation',
    name: 'Documentation Bot',
    description: 'Automatically generates and updates documentation based on code changes',
    role: 'documentation',
    icon: 'file-text',
    defaultTriggers: ['push'],
    defaultPrompt: 'Analyze code changes and update relevant documentation.',
    capabilities: ['README updates', 'API docs', 'Code comments', 'Changelog entries'],
    recommended: false,
  },
  {
    id: 'testing',
    name: 'Test Generator',
    description: 'Generates test cases for new code and suggests improvements for existing tests',
    role: 'testing',
    icon: 'check-circle',
    defaultTriggers: ['pr_opened'],
    defaultPrompt: 'Analyze the code and generate comprehensive test cases.',
    capabilities: ['Unit tests', 'Integration tests', 'Edge case detection', 'Coverage analysis'],
    recommended: false,
  },
  {
    id: 'security-auditor',
    name: 'Security Auditor',
    description: 'Scans code for security vulnerabilities and suggests fixes',
    role: 'security-auditor',
    icon: 'shield',
    defaultTriggers: ['pr_opened', 'push'],
    defaultPrompt: 'Scan this code for security vulnerabilities and provide remediation steps.',
    capabilities: ['Vulnerability scanning', 'Dependency audit', 'Secret detection', 'Compliance checks'],
    recommended: true,
  },
];

const mockRepositories = [
  { fullName: 'miyabi/core', private: false, defaultBranch: 'main' },
  { fullName: 'miyabi/dashboard', private: true, defaultBranch: 'main' },
  { fullName: 'miyabi/sdk', private: false, defaultBranch: 'develop' },
  { fullName: 'miyabi/docs', private: false, defaultBranch: 'main' },
  { fullName: 'miyabi/cli', private: true, defaultBranch: 'main' },
];

const triggerOptions = [
  { value: 'issue_opened', label: 'Issue Opened' },
  { value: 'issue_labeled', label: 'Issue Labeled' },
  { value: 'pr_opened', label: 'PR Opened' },
  { value: 'pr_review_requested', label: 'PR Review Requested' },
  { value: 'push', label: 'Push' },
  { value: 'schedule', label: 'Scheduled' },
  { value: 'manual', label: 'Manual Trigger' },
];

type WizardStep = 'template' | 'configure' | 'repositories' | 'review';

const templateIcons: Record<string, React.ReactNode> = {
  'code-reviewer': (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  'issue-analyzer': (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  'pr-assistant': (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <line x1="6" x2="6" y1="9" y2="21" />
    </svg>
  ),
  'documentation': (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  'testing': (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  'security-auditor': (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
};

export default function NewAgentPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>('template');
  const [loading, setLoading] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<AgentTrigger[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([]);
  const [autoApprove, setAutoApprove] = useState(false);

  const steps: WizardStep[] = ['template', 'configure', 'repositories', 'review'];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleTemplateSelect = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setAgentName(template.name);
    setAgentDescription(template.description);
    setSelectedTriggers(template.defaultTriggers);
    setCustomPrompt(template.defaultPrompt);
  };

  const handleTriggerToggle = (trigger: AgentTrigger) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger)
        ? prev.filter((t) => t !== trigger)
        : [...prev, trigger],
    );
  };

  const handleRepositoryToggle = (repo: string) => {
    setSelectedRepositories((prev) =>
      prev.includes(repo)
        ? prev.filter((r) => r !== repo)
        : [...prev, repo],
    );
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push('/dashboard/agents');
    } catch (error) {
      console.error('Failed to create agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'template':
        return selectedTemplate !== null;
      case 'configure':
        return agentName.trim() !== '' && selectedTriggers.length > 0;
      case 'repositories':
        return selectedRepositories.length > 0;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/agents">
            <Button variant="ghost" size="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Create New Agent</h1>
            <p className="text-gray-400 mt-1">Set up a new AI agent for your repositories</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Step {currentStepIndex + 1} of {steps.length}</span>
            <span className="text-white font-medium capitalize">{step.replace('-', ' ')}</span>
          </div>
          <Progress value={progress} variant="default" animated={false} />
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div
                key={s}
                className={cn(
                  'flex items-center gap-2 text-sm',
                  i <= currentStepIndex ? 'text-white' : 'text-gray-500',
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  i < currentStepIndex
                    ? 'bg-miyabi-green text-white'
                    : i === currentStepIndex
                      ? 'bg-miyabi-blue text-white'
                      : 'bg-gray-700 text-gray-400',
                )}>
                  {i < currentStepIndex ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="hidden md:inline capitalize">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {step === 'template' && (
          <Card variant="gradient">
            <CardHeader>
              <CardTitle>Choose an Agent Template</CardTitle>
              <CardDescription>
                Select a template that matches your needs. You can customize it in the next step.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agentTemplates.map((template) => {
                  const isSelected = selectedTemplate?.id === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleTemplateSelect(template)}
                      className={cn(
                        'relative p-5 rounded-xl border text-left transition-all',
                        isSelected
                          ? 'bg-gradient-to-br from-miyabi-blue/20 to-miyabi-purple/20 border-miyabi-blue/50 ring-2 ring-miyabi-blue/30'
                          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800',
                      )}
                    >
                      {template.recommended && (
                        <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-medium bg-miyabi-green text-white rounded-full">
                          Recommended
                        </span>
                      )}
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'p-3 rounded-xl shrink-0',
                          isSelected
                            ? 'bg-miyabi-blue/30 text-miyabi-blue'
                            : 'bg-gray-700 text-gray-400',
                        )}>
                          {templateIcons[template.id]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-medium text-white">{template.name}</h3>
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{template.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {template.capabilities.map((cap) => (
                              <span key={cap} className="px-2 py-0.5 text-xs bg-gray-700/50 text-gray-400 rounded-full">
                                {cap}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'configure' && (
          <Card variant="gradient">
            <CardHeader>
              <CardTitle>Configure Your Agent</CardTitle>
              <CardDescription>
                Customize the agent name, triggers, and behavior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Agent Name</label>
                  <Input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="My Code Reviewer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                    placeholder="Describe what this agent does..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-miyabi-blue/50 focus:border-miyabi-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Triggers</label>
                <p className="text-xs text-gray-500 mb-3">Select when this agent should be activated</p>
                <div className="flex flex-wrap gap-2">
                  {triggerOptions.map((trigger) => {
                    const isSelected = selectedTriggers.includes(trigger.value as AgentTrigger);
                    return (
                      <button
                        key={trigger.value}
                        type="button"
                        onClick={() => handleTriggerToggle(trigger.value as AgentTrigger)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                          isSelected
                            ? 'bg-miyabi-blue/20 text-miyabi-blue border border-miyabi-blue/50'
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600',
                        )}
                      >
                        {trigger.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Custom Prompt (Optional)</label>
                <p className="text-xs text-gray-500 mb-2">Override the default prompt for this agent</p>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter custom instructions for the agent..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-miyabi-blue/50 focus:border-miyabi-blue font-mono"
                />
              </div>

              <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-white">Auto-approve Actions</h4>
                    <p className="text-xs text-gray-500 mt-1">Allow agent to take actions without manual approval</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoApprove(!autoApprove)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors',
                      autoApprove ? 'bg-miyabi-blue' : 'bg-gray-600',
                    )}
                  >
                    <div className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                      autoApprove ? 'translate-x-7' : 'translate-x-1',
                    )} />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'repositories' && (
          <Card variant="gradient">
            <CardHeader>
              <CardTitle>Select Repositories</CardTitle>
              <CardDescription>
                Choose which repositories this agent should monitor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockRepositories.map((repo) => {
                  const isSelected = selectedRepositories.includes(repo.fullName);
                  return (
                    <button
                      key={repo.fullName}
                      type="button"
                      onClick={() => handleRepositoryToggle(repo.fullName)}
                      className={cn(
                        'w-full flex items-center gap-3 p-4 rounded-xl border transition-all',
                        isSelected
                          ? 'bg-miyabi-blue/10 border-miyabi-blue/50 ring-1 ring-miyabi-blue/30'
                          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600',
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                        isSelected
                          ? 'bg-miyabi-blue border-miyabi-blue'
                          : 'border-gray-600',
                      )}>
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-white">{repo.fullName}</p>
                        <p className="text-xs text-gray-500">
                          {repo.private ? 'Private' : 'Public'} - {repo.defaultBranch}
                        </p>
                      </div>
                      {repo.private && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                {selectedRepositories.length} of {mockRepositories.length} repositories selected
              </p>
            </CardContent>
          </Card>
        )}

        {step === 'review' && (
          <Card variant="gradient">
            <CardHeader>
              <CardTitle>Review and Create</CardTitle>
              <CardDescription>
                Review your agent configuration before creating it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-5 rounded-xl bg-gray-800/50 border border-gray-700">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-miyabi-blue/20 to-miyabi-purple/20 text-miyabi-blue">
                    {selectedTemplate && templateIcons[selectedTemplate.id]}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{agentName}</h3>
                    <p className="text-sm text-gray-400 mt-1">{agentDescription}</p>
                    <Badge variant="primary" className="mt-2">
                      {selectedTemplate?.role.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Triggers</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTriggers.map((trigger) => (
                      <Badge key={trigger} variant="secondary">
                        {trigger.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Settings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Auto-approve</span>
                      <span className="text-white">{autoApprove ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">Repositories ({selectedRepositories.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRepositories.map((repo) => (
                    <Badge key={repo} variant="outline">
                      {repo}
                    </Badge>
                  ))}
                </div>
              </div>

              {customPrompt && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Custom Prompt</h4>
                  <div className="p-3 rounded-lg bg-gray-900 border border-gray-700">
                    <p className="text-sm text-gray-400 font-mono">{customPrompt}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(steps[currentStepIndex - 1])}
            disabled={currentStepIndex === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back
          </Button>
          {step === 'review' ? (
            <Button onClick={handleCreate} loading={loading}>
              Create Agent
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </Button>
          ) : (
            <Button
              onClick={() => setStep(steps[currentStepIndex + 1])}
              disabled={!canProceed()}
            >
              Continue
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
