/**
 * AI Agent Metadata System
 *
 * This module provides metadata attributes for AI agents (ChatGPT, GPT-4, etc.)
 * to understand and interact with the UI autonomously.
 *
 * All data-ai-* attributes are invisible to human users but provide
 * structured context for AI-driven web automation.
 */

/**
 * AI-readable role types for UI elements
 */
export type AIRole =
  | 'button'
  | 'input'
  | 'link'
  | 'navigation'
  | 'card'
  | 'modal'
  | 'form'
  | 'list'
  | 'list-item'
  | 'badge'
  | 'avatar'
  | 'icon'
  | 'divider'
  | 'breadcrumb'
  | 'header'
  | 'footer'
  | 'container'
  | 'section';

/**
 * AI-executable actions
 */
export type AIAction =
  | 'click'
  | 'type'
  | 'submit'
  | 'navigate'
  | 'select'
  | 'toggle'
  | 'expand'
  | 'collapse'
  | 'confirm'
  | 'cancel'
  | 'scroll'
  | 'focus'
  | 'hover'
  | 'mock-login'
  | 'none';

/**
 * Expected results after action execution
 */
export type AIExpectedResult =
  | 'redirect'
  | 'show-modal'
  | 'hide-modal'
  | 'update-state'
  | 'submit-form'
  | 'navigate-to-page'
  | 'open-external'
  | 'trigger-api'
  | 'show-toast'
  | 'refresh-data'
  | 'none';

/**
 * AI Metadata attributes for a single element (EXTENDED for Full Autonomous Control)
 */
export interface AIMetadata {
  /** Role of this element (e.g., 'button', 'input') */
  role: AIRole;

  /** Primary action this element performs */
  action?: AIAction;

  /** Unique identifier for this element (for AI targeting) */
  target: string;

  /** Human-readable description of what this element does */
  description: string;

  /** Context: where this element lives (e.g., 'login-page', 'dashboard') */
  context: string;

  /** Expected result after action execution */
  expectedResult?: AIExpectedResult;

  /** Is this field required? */
  required?: boolean;

  /** Validation rules (for input fields) */
  validation?: string;

  /** Current state (e.g., 'active', 'disabled', 'selected') */
  state?: string;

  /** Navigation target (for links/buttons that navigate) */
  navigationTarget?: string;

  /** API endpoint (if this triggers an API call) */
  apiEndpoint?: string;

  /** Related elements (IDs of related elements) */
  relatedElements?: string[];

  // ===== EXTENDED FOR FULL AUTONOMOUS CONTROL =====

  /** Step-by-step instructions for AI agent to execute this action */
  instructions?: string;

  /** Prerequisites before executing this action (e.g., "must be logged in") */
  prerequisites?: string;

  /** Next possible actions after this action completes */
  nextActions?: string;

  /** Dependencies (element IDs that must exist or be in certain state) */
  dependencies?: string[];

  /** Wait condition (e.g., "wait-for-redirect", "wait-for-modal-close") */
  waitCondition?: string;

  /** Success criteria (how to verify action succeeded) */
  successCriteria?: string;

  /** Error handling instructions */
  errorHandling?: string;

  /** Retry policy (e.g., "retry-3-times-with-1s-delay") */
  retryPolicy?: string;

  /** Selector for AI to find this element (CSS selector) */
  selector?: string;

  /** Priority level for AI agent (1=highest, 5=lowest) */
  priority?: number;

  /** Workflow ID (if this element is part of a multi-step workflow) */
  workflowId?: string;

  /** Workflow step number (e.g., "1", "2", "3") */
  workflowStep?: number;
}

/**
 * Convert AIMetadata to HTML data-* attributes
 *
 * @example
 * const attrs = toDataAttributes({
 *   role: 'button',
 *   action: 'click',
 *   target: 'github-login-button',
 *   description: 'Sign in with GitHub OAuth',
 *   context: 'login-page',
 *   expectedResult: 'redirect',
 * });
 *
 * <button {...attrs}>Sign in</button>
 */
export function toDataAttributes(metadata: AIMetadata): Record<string, string> {
  const attrs: Record<string, string> = {
    'data-ai-role': metadata.role,
    'data-ai-target': metadata.target,
    'data-ai-description': metadata.description,
    'data-ai-context': metadata.context,
  };

  if (metadata.action) {
    attrs['data-ai-action'] = metadata.action;
  }

  if (metadata.expectedResult) {
    attrs['data-ai-expected-result'] = metadata.expectedResult;
  }

  if (metadata.required !== undefined) {
    attrs['data-ai-required'] = String(metadata.required);
  }

  if (metadata.validation) {
    attrs['data-ai-validation'] = metadata.validation;
  }

  if (metadata.state) {
    attrs['data-ai-state'] = metadata.state;
  }

  if (metadata.navigationTarget) {
    attrs['data-ai-navigation-target'] = metadata.navigationTarget;
  }

  if (metadata.apiEndpoint) {
    attrs['data-ai-api-endpoint'] = metadata.apiEndpoint;
  }

  if (metadata.relatedElements && metadata.relatedElements.length > 0) {
    attrs['data-ai-related-elements'] = metadata.relatedElements.join(',');
  }

  // ===== EXTENDED ATTRIBUTES FOR FULL AUTONOMOUS CONTROL =====

  if (metadata.instructions) {
    attrs['data-ai-instructions'] = metadata.instructions;
  }

  if (metadata.prerequisites) {
    attrs['data-ai-prerequisites'] = metadata.prerequisites;
  }

  if (metadata.nextActions) {
    attrs['data-ai-next-actions'] = metadata.nextActions;
  }

  if (metadata.dependencies && metadata.dependencies.length > 0) {
    attrs['data-ai-dependencies'] = metadata.dependencies.join(',');
  }

  if (metadata.waitCondition) {
    attrs['data-ai-wait-condition'] = metadata.waitCondition;
  }

  if (metadata.successCriteria) {
    attrs['data-ai-success-criteria'] = metadata.successCriteria;
  }

  if (metadata.errorHandling) {
    attrs['data-ai-error-handling'] = metadata.errorHandling;
  }

  if (metadata.retryPolicy) {
    attrs['data-ai-retry-policy'] = metadata.retryPolicy;
  }

  if (metadata.selector) {
    attrs['data-ai-selector'] = metadata.selector;
  }

  if (metadata.priority !== undefined) {
    attrs['data-ai-priority'] = String(metadata.priority);
  }

  if (metadata.workflowId) {
    attrs['data-ai-workflow-id'] = metadata.workflowId;
  }

  if (metadata.workflowStep !== undefined) {
    attrs['data-ai-workflow-step'] = String(metadata.workflowStep);
  }

  return attrs;
}

/**
 * Predefined metadata for common UI patterns
 */
export const CommonMetadata = {
  /**
   * GitHub OAuth login button (FULL AUTONOMOUS CONTROL)
   */
  githubLoginButton: (): AIMetadata => ({
    role: 'button',
    action: 'click',
    target: 'github-login-button',
    description: 'Initiate GitHub OAuth authentication flow',
    context: 'login-page',
    expectedResult: 'redirect',
    navigationTarget: '/api/v1/auth/github',
    // Full autonomous control metadata
    instructions: 'STEP 1: Click this button to initiate GitHub OAuth. STEP 2: Wait for redirect to GitHub login page. STEP 3: Complete GitHub authentication. STEP 4: Wait for callback redirect with token parameter.',
    prerequisites: 'User must be on login page and not already authenticated',
    nextActions: 'After redirect completes, check URL for ?token= parameter. If token exists, store in localStorage as miyabi_token and navigate to /dashboard',
    dependencies: [],
    waitCondition: 'wait-for-redirect-to-github-oauth',
    successCriteria: 'URL changes from /login to GitHub OAuth page (github.com/login/oauth/authorize)',
    errorHandling: 'If redirect fails after 5 seconds, retry click. If redirect fails 3 times, show error toast and remain on login page',
    retryPolicy: 'retry-3-times-with-2s-delay',
    selector: '[data-ai-target="github-login-button"]',
    priority: 1,
    workflowId: 'github-oauth-login',
    workflowStep: 1,
  }),

  /**
   * Logout button (desktop)
   */
  logoutButtonDesktop: (): AIMetadata => ({
    role: 'button',
    action: 'click',
    target: 'logout-button-desktop',
    description: 'Show logout confirmation dialog',
    context: 'header-desktop',
    expectedResult: 'show-modal',
    relatedElements: ['logout-confirm-dialog'],
  }),

  /**
   * Logout button (mobile)
   */
  logoutButtonMobile: (): AIMetadata => ({
    role: 'button',
    action: 'click',
    target: 'logout-button-mobile',
    description: 'Show logout confirmation dialog',
    context: 'header-mobile',
    expectedResult: 'show-modal',
    relatedElements: ['logout-confirm-dialog-mobile'],
  }),

  /**
   * Logout confirmation dialog - Confirm button
   */
  logoutConfirmButton: (): AIMetadata => ({
    role: 'button',
    action: 'click',
    target: 'logout-confirm-action',
    description: 'Confirm logout and redirect to login page',
    context: 'logout-dialog',
    expectedResult: 'redirect',
    navigationTarget: '/login',
  }),

  /**
   * Logout confirmation dialog - Cancel button
   */
  logoutCancelButton: (): AIMetadata => ({
    role: 'button',
    action: 'click',
    target: 'logout-cancel-action',
    description: 'Cancel logout and close dialog',
    context: 'logout-dialog',
    expectedResult: 'hide-modal',
  }),

  /**
   * Navigation link (generic)
   */
  navigationLink: (label: string, href: string, context: string): AIMetadata => ({
    role: 'link',
    action: 'navigate',
    target: `nav-link-${label.toLowerCase().replace(/\s+/g, '-')}`,
    description: `Navigate to ${label} page`,
    context,
    expectedResult: 'navigate-to-page',
    navigationTarget: href,
  }),

  /**
   * Repository connection button
   */
  connectRepositoryButton: (): AIMetadata => ({
    role: 'button',
    action: 'click',
    target: 'connect-repository-button',
    description: 'Navigate to repositories page to connect a GitHub repository',
    context: 'dashboard',
    expectedResult: 'navigate-to-page',
    navigationTarget: '/dashboard/repositories',
  }),

  /**
   * Agent execution button
   */
  agentExecuteButton: (issueNumber: number): AIMetadata => ({
    role: 'button',
    action: 'click',
    target: `agent-execute-button-issue-${issueNumber}`,
    description: `Show agent execution confirmation dialog for Issue #${issueNumber}`,
    context: 'issues-list',
    expectedResult: 'show-modal',
    relatedElements: [`agent-execute-dialog-${issueNumber}`],
  }),

  /**
   * Agent execution confirmation - Execute button
   */
  agentExecuteConfirmButton: (issueNumber: number): AIMetadata => ({
    role: 'button',
    action: 'click',
    target: `agent-execute-confirm-${issueNumber}`,
    description: `Confirm agent execution for Issue #${issueNumber} and trigger API`,
    context: 'agent-execute-dialog',
    expectedResult: 'trigger-api',
    apiEndpoint: '/agents/execute',
  }),

  /**
   * Issue state filter button
   */
  issueFilterButton: (state: 'open' | 'closed' | 'all'): AIMetadata => ({
    role: 'button',
    action: 'click',
    target: `issue-filter-${state}`,
    description: `Filter issues to show ${state} issues only`,
    context: 'issues-filters',
    expectedResult: 'refresh-data',
  }),

  /**
   * Issue title link (clickable to detail page)
   */
  issueTitleLink: (issueNumber: number, repositoryId: string): AIMetadata => ({
    role: 'link',
    action: 'navigate',
    target: `issue-title-link-${issueNumber}`,
    description: `Navigate to Issue #${issueNumber} detail page`,
    context: 'issues-list',
    expectedResult: 'navigate-to-page',
    navigationTarget: `/dashboard/repositories/${repositoryId}/issues/${issueNumber}`,
  }),

  /**
   * Search input field
   */
  searchInput: (context: string, placeholder: string): AIMetadata => ({
    role: 'input',
    action: 'type',
    target: `search-input-${context}`,
    description: `Search input: ${placeholder}`,
    context,
    expectedResult: 'refresh-data',
    validation: 'string, min-length: 0',
  }),

  /**
   * Breadcrumb link
   */
  breadcrumbLink: (label: string, href: string): AIMetadata => ({
    role: 'breadcrumb',
    action: 'navigate',
    target: `breadcrumb-${label.toLowerCase().replace(/\s+/g, '-')}`,
    description: `Navigate back to ${label} page`,
    context: 'breadcrumb',
    expectedResult: 'navigate-to-page',
    navigationTarget: href,
  }),

  /**
   * Mobile menu toggle button
   */
  mobileMenuToggle: (): AIMetadata => ({
    role: 'button',
    action: 'toggle',
    target: 'mobile-menu-toggle',
    description: 'Open mobile navigation menu',
    context: 'header-mobile',
    expectedResult: 'show-modal',
  }),

  /**
   * Summary card (Dashboard)
   */
  summaryCard: (title: string, context: string): AIMetadata => ({
    role: 'card',
    action: 'none',
    target: `summary-card-${title.toLowerCase().replace(/\s+/g, '-')}`,
    description: `Summary card displaying ${title} statistics`,
    context,
    expectedResult: 'none',
  }),

  /**
   * Quick action card (clickable)
   */
  quickActionCard: (title: string, description: string): AIMetadata => ({
    role: 'card',
    action: 'click',
    target: `quick-action-${title.toLowerCase().replace(/\s+/g, '-')}`,
    description: `Quick action: ${description}`,
    context: 'dashboard-quick-actions',
    expectedResult: 'navigate-to-page',
  }),
};

/**
 * Example usage:
 *
 * import { toDataAttributes, CommonMetadata } from '@/lib/ai-metadata';
 *
 * // In a component:
 * <button {...toDataAttributes(CommonMetadata.githubLoginButton())}>
 *   Sign in with GitHub
 * </button>
 */
