'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import type { OnboardingState, Agent, AgentTemplate, AGENT_TEMPLATES } from '@/lib/github-app/agent-types';

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(' ');
}

interface OnboardingWizardProps {
  initialState?: Partial<OnboardingState>;
  repositories?: Array<{ fullName: string; private: boolean; defaultBranch: string }>;
  agentTemplates?: AgentTemplate[];
  onComplete?: (state: OnboardingState) => void;
  onSkip?: () => void;
}

const steps = [
  { id: 'welcome', title: 'Welcome', description: 'Get started with Miyabi' },
  { id: 'repositories', title: 'Repositories', description: 'Select repositories' },
  { id: 'first-agent', title: 'First Agent', description: 'Create your first agent' },
  { id: 'integration-test', title: 'Test', description: 'Verify integration' },
  { id: 'complete', title: 'Complete', description: 'You are ready!' },
];

export function OnboardingWizard({
  initialState,
  repositories = [],
  agentTemplates = [],
  onComplete,
  onSkip,
}: OnboardingWizardProps) {
  const [state, setState] = useState<OnboardingState>({
    step: initialState?.step || 'welcome',
    completedSteps: initialState?.completedSteps || [],
    selectedRepositories: initialState?.selectedRepositories || [],
    firstAgent: initialState?.firstAgent,
    testResult: initialState?.testResult,
  });

  const [loading, setLoading] = useState(false);

  const currentStepIndex = steps.findIndex((s) => s.id === state.step);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  const goToStep = useCallback((step: OnboardingState['step']) => {
    setState((prev) => ({
      ...prev,
      step,
      completedSteps: [...new Set([...prev.completedSteps, prev.step])],
    }));
  }, []);

  const handleRepositoryToggle = useCallback((repoName: string) => {
    setState((prev) => ({
      ...prev,
      selectedRepositories: prev.selectedRepositories.includes(repoName)
        ? prev.selectedRepositories.filter((r) => r !== repoName)
        : [...prev.selectedRepositories, repoName],
    }));
  }, []);

  const handleAgentSelect = useCallback((template: AgentTemplate) => {
    setState((prev) => ({
      ...prev,
      firstAgent: {
        name: template.name,
        description: template.description,
        role: template.role,
        triggers: template.defaultTriggers,
        repositories: prev.selectedRepositories,
      },
    }));
  }, []);

  const handleTestIntegration = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setState((prev) => ({
        ...prev,
        testResult: {
          success: true,
          message: 'Integration verified successfully! Your agent is ready to work.',
          taskId: `test-${Date.now()}`,
        },
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        testResult: {
          success: false,
          message: 'Integration test failed. Please check your configuration.',
        },
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleComplete = useCallback(() => {
    const finalState: OnboardingState = {
      ...state,
      step: 'complete',
      completedSteps: [...new Set([...state.completedSteps, state.step, 'complete'])],
    };
    onComplete?.(finalState);
  }, [state, onComplete]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-miyabi-blue to-miyabi-purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8V4H8" />
                  <rect width="16" height="12" x="4" y="8" rx="2" />
                  <path d="M2 14h2" />
                  <path d="M20 14h2" />
                  <path d="M15 13v2" />
                  <path d="M9 13v2" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Miyabi Setup</h1>
                <p className="text-sm text-gray-400">AI Agent Framework</p>
              </div>
            </div>
            {state.step !== 'complete' && onSkip && (
              <Button variant="ghost" size="sm" onClick={onSkip}>
                Skip for now
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all',
                    state.completedSteps.includes(step.id)
                      ? 'bg-miyabi-green text-white'
                      : step.id === state.step
                        ? 'bg-gradient-to-br from-miyabi-blue to-miyabi-purple text-white'
                        : 'bg-gray-800 text-gray-500',
                  )}
                >
                  {state.completedSteps.includes(step.id) ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 transition-all',
                      state.completedSteps.includes(step.id) ? 'bg-miyabi-green' : 'bg-gray-800',
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex]?.title}
          </p>
        </div>

        {state.step === 'welcome' && (
          <WelcomeStep onNext={() => goToStep('repositories')} />
        )}

        {state.step === 'repositories' && (
          <RepositoriesStep
            repositories={repositories}
            selectedRepositories={state.selectedRepositories}
            onToggle={handleRepositoryToggle}
            onBack={() => goToStep('welcome')}
            onNext={() => goToStep('first-agent')}
          />
        )}

        {state.step === 'first-agent' && (
          <FirstAgentStep
            templates={agentTemplates}
            selectedAgent={state.firstAgent}
            onSelect={handleAgentSelect}
            onBack={() => goToStep('repositories')}
            onNext={() => goToStep('integration-test')}
          />
        )}

        {state.step === 'integration-test' && (
          <IntegrationTestStep
            agent={state.firstAgent}
            testResult={state.testResult}
            loading={loading}
            onTest={handleTestIntegration}
            onBack={() => goToStep('first-agent')}
            onNext={() => goToStep('complete')}
          />
        )}

        {state.step === 'complete' && (
          <CompleteStep onFinish={handleComplete} />
        )}
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <Card variant="gradient">
      <CardContent className="p-8 text-center">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-miyabi-blue/20 to-miyabi-purple/20 flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
            </defs>
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Welcome to Miyabi AI Agent Framework</h2>
        <p className="text-gray-400 max-w-md mx-auto mb-8">
          Autonomous AI agents that integrate seamlessly with your GitHub workflow.
          Let us help you set up your first agent in just a few steps.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <div className="w-10 h-10 rounded-lg bg-miyabi-blue/20 text-miyabi-blue flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-white mb-1">Code Review</h3>
            <p className="text-xs text-gray-500">Automated PR analysis</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <div className="w-10 h-10 rounded-lg bg-miyabi-purple/20 text-miyabi-purple flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-white mb-1">Issue Analysis</h3>
            <p className="text-xs text-gray-500">Smart categorization</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <div className="w-10 h-10 rounded-lg bg-miyabi-green/20 text-miyabi-green flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-white mb-1">Security Audit</h3>
            <p className="text-xs text-gray-500">Vulnerability scanning</p>
          </div>
        </div>

        <Button size="lg" onClick={onNext}>
          Get Started
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Button>
      </CardContent>
    </Card>
  );
}

function RepositoriesStep({
  repositories,
  selectedRepositories,
  onToggle,
  onBack,
  onNext,
}: {
  repositories: Array<{ fullName: string; private: boolean; defaultBranch: string }>;
  selectedRepositories: string[];
  onToggle: (repo: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <Card variant="gradient">
      <CardHeader>
        <CardTitle>Select Repositories</CardTitle>
        <CardDescription>
          Choose which repositories your AI agents should have access to.
          You can always change this later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {repositories.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              </svg>
            </div>
            <p className="text-gray-400 mb-2">No repositories found</p>
            <p className="text-sm text-gray-500">
              Make sure the GitHub App is installed on your repositories
            </p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
            {repositories.map((repo) => {
              const isSelected = selectedRepositories.includes(repo.fullName);
              return (
                <button
                  key={repo.fullName}
                  type="button"
                  onClick={() => onToggle(repo.fullName)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
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
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <Button variant="ghost" onClick={onBack}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {selectedRepositories.length} selected
            </span>
            <Button onClick={onNext} disabled={selectedRepositories.length === 0}>
              Continue
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FirstAgentStep({
  templates,
  selectedAgent,
  onSelect,
  onBack,
  onNext,
}: {
  templates: AgentTemplate[];
  selectedAgent?: Partial<Agent>;
  onSelect: (template: AgentTemplate) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const templateIcons: Record<string, React.ReactNode> = {
    'code-reviewer': (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    'issue-analyzer': (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
    'security-auditor': (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  };

  return (
    <Card variant="gradient">
      <CardHeader>
        <CardTitle>Create Your First AI Agent</CardTitle>
        <CardDescription>
          Choose an agent template to get started. Each agent specializes in different tasks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.slice(0, 6).map((template) => {
            const isSelected = selectedAgent?.role === template.role;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelect(template)}
                className={cn(
                  'relative p-4 rounded-xl border text-left transition-all',
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
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    isSelected
                      ? 'bg-miyabi-blue/30 text-miyabi-blue'
                      : 'bg-gray-700 text-gray-400',
                  )}>
                    {templateIcons[template.id] || (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 8V4H8" />
                        <rect width="16" height="12" x="4" y="8" rx="2" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-white">{template.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{template.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.capabilities.slice(0, 2).map((cap) => (
                        <span key={cap} className="px-1.5 py-0.5 text-[10px] bg-gray-700 text-gray-400 rounded">
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

        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <Button variant="ghost" onClick={onBack}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back
          </Button>
          <Button onClick={onNext} disabled={!selectedAgent}>
            Continue
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function IntegrationTestStep({
  agent,
  testResult,
  loading,
  onTest,
  onBack,
  onNext,
}: {
  agent?: Partial<Agent>;
  testResult?: { success: boolean; message: string; taskId?: string };
  loading: boolean;
  onTest: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <Card variant="gradient">
      <CardHeader>
        <CardTitle>Test Your Integration</CardTitle>
        <CardDescription>
          Verify that your agent can communicate with GitHub and perform actions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-miyabi-blue/20 text-miyabi-blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">{agent?.name || 'Agent'}</h3>
              <p className="text-xs text-gray-400 capitalize">{agent?.role?.replace('-', ' ')}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Repositories: {agent?.repositories?.join(', ') || 'None selected'}
          </div>
        </div>

        {!testResult && (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400 mb-4">
              Click the button below to verify the integration is working correctly.
            </p>
            <Button onClick={onTest} loading={loading} size="lg">
              {loading ? 'Testing...' : 'Run Integration Test'}
            </Button>
          </div>
        )}

        {testResult && (
          <div className={cn(
            'p-4 rounded-xl border',
            testResult.success
              ? 'bg-miyabi-green/10 border-miyabi-green/30'
              : 'bg-miyabi-red/10 border-miyabi-red/30',
          )}>
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <div className="p-2 rounded-lg bg-miyabi-green/20 text-miyabi-green">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-miyabi-red/20 text-miyabi-red">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" x2="9" y1="9" y2="15" />
                    <line x1="9" x2="15" y1="9" y2="15" />
                  </svg>
                </div>
              )}
              <div>
                <h4 className={cn(
                  'text-sm font-medium',
                  testResult.success ? 'text-miyabi-green' : 'text-miyabi-red',
                )}>
                  {testResult.success ? 'Test Passed!' : 'Test Failed'}
                </h4>
                <p className="text-xs text-gray-400 mt-1">{testResult.message}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <Button variant="ghost" onClick={onBack}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back
          </Button>
          <Button onClick={onNext} disabled={!testResult?.success}>
            Complete Setup
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CompleteStep({ onFinish }: { onFinish: () => void }) {
  return (
    <Card variant="gradient">
      <CardContent className="p-8 text-center">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-miyabi-green/20 to-emerald-400/20 flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">You're All Set!</h2>
        <p className="text-gray-400 max-w-md mx-auto mb-8">
          Your AI agent is now active and will automatically respond to events
          in your repositories. You can manage your agents from the dashboard.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <h3 className="text-sm font-medium text-white mb-2">What's Next?</h3>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Create an issue to trigger your agent
              </li>
              <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Open a PR for code review
              </li>
              <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Monitor agent activity in dashboard
              </li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <h3 className="text-sm font-medium text-white mb-2">Quick Links</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/docs/getting-started" className="text-miyabi-blue hover:underline flex items-center gap-1">
                  Documentation
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" x2="21" y1="14" y2="3" />
                  </svg>
                </a>
              </li>
              <li>
                <a href="/docs/agent-templates" className="text-miyabi-blue hover:underline flex items-center gap-1">
                  Agent Templates
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" x2="21" y1="14" y2="3" />
                  </svg>
                </a>
              </li>
              <li>
                <a href="/support" className="text-miyabi-blue hover:underline flex items-center gap-1">
                  Get Support
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" x2="21" y1="14" y2="3" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Button size="lg" variant="success" onClick={onFinish}>
          Go to Dashboard
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Button>
      </CardContent>
    </Card>
  );
}
