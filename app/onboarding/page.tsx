'use client';

import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import type { AgentTemplate, OnboardingState } from '@/lib/github-app/agent-types';

const mockRepositories = [
  { fullName: 'miyabi/core', private: false, defaultBranch: 'main' },
  { fullName: 'miyabi/dashboard', private: true, defaultBranch: 'main' },
  { fullName: 'miyabi/sdk', private: false, defaultBranch: 'develop' },
  { fullName: 'miyabi/docs', private: false, defaultBranch: 'main' },
  { fullName: 'miyabi/cli', private: true, defaultBranch: 'main' },
];

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
];

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = async (state: OnboardingState) => {
    console.log('Onboarding complete:', state);
    router.push('/dashboard');
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <OnboardingWizard
      repositories={mockRepositories}
      agentTemplates={agentTemplates}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
