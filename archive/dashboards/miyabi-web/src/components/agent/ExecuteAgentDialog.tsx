/**
 * Execute Agent Dialog Component
 *
 * TODO: Implement the following features:
 * 1. Issue selection dropdown (fetch from /api/v1/repositories/:id/issues)
 * 2. Agent type selection (Coordinator, CodeGen, Review, PR, Deployment)
 * 3. Execution options:
 *    - Use Worktree checkbox
 *    - Auto PR checkbox
 *    - Slack notification checkbox
 * 4. Form validation
 * 5. Execute button with loading state
 * 6. Error handling and display
 * 7. Redirect to /executions/:id after successful execution
 *
 * API Endpoint: POST /api/v1/agents/execute
 * Request: { repository_id, issue_number, agent_type, options }
 * Response: { id, ... }
 */

'use client';

import { useState } from 'react';

interface ExecuteAgentDialogProps {
  repositoryId: string;
  onClose: () => void;
  onSuccess?: (executionId: string) => void;
}

export default function ExecuteAgentDialog({
  repositoryId,
  onClose,
  onSuccess,
}: ExecuteAgentDialogProps) {
  const [issueNumber, setIssueNumber] = useState<number | null>(null);
  const [agentType, setAgentType] = useState<string>('coordinator');
  const [useWorktree, setUseWorktree] = useState(false);
  const [autoPR, setAutoPR] = useState(false);
  const [slackNotify, setSlackNotify] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    // TODO: Implement agent execution
    console.log('TODO: Execute agent', {
      repositoryId,
      issueNumber,
      agentType,
      options: { useWorktree, autoPR, slackNotify },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Execute Agent</h2>

        {/* TODO: Add form fields */}
        <div className="space-y-4">
          <p className="text-gray-600">
            Component under construction. See code comments for implementation details.
          </p>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={isLoading || !issueNumber}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Executing...' : 'Execute'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
