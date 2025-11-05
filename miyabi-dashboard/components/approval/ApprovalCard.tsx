/**
 * Approval Card Component
 */

'use client';

import React, { useState } from 'react';

export interface Approval {
  approval_id: string;
  workflow_id: string;
  gate_id: string;
  required_approvers: string[];
  responses: ApprovalResponse[];
  status: string;
  timeout_seconds: number;
  created_at: string;
  completed_at?: string;
}

export interface ApprovalResponse {
  approver: string;
  approved: boolean;
  comment?: string;
  responded_at: string;
}

interface ApprovalCardProps {
  approval: Approval;
  onApprove?: (approvalId: string, approver: string, comment?: string) => Promise<void>;
  onReject?: (approvalId: string, approver: string, reason?: string) => Promise<void>;
  currentUser?: string;
}

export function ApprovalCard({ approval, onApprove, onReject, currentUser }: ApprovalCardProps) {
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    if (!onApprove || !currentUser) return;
    setIsLoading(true);
    try {
      await onApprove(approval.approval_id, currentUser, comment || undefined);
      setComment('');
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || !currentUser) return;
    const reason = comment || 'No reason provided';
    setIsLoading(true);
    try {
      await onReject(approval.approval_id, currentUser, reason);
      setComment('');
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const approvalCount = approval.responses.filter(r => r.approved).length;
  const requiredCount = approval.required_approvers.length;
  const hasResponded = currentUser && approval.responses.some(r => r.approver === currentUser);
  const canRespond = currentUser && approval.required_approvers.includes(currentUser) && !hasResponded;

  const statusColor = approval.status === 'Pending' ? 'text-yellow-600'
    : approval.status === 'Approved' ? 'text-green-600'
    : approval.status === 'Rejected' ? 'text-red-600'
    : 'text-gray-600';

  return (
    <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{approval.workflow_id}</h3>
          <p className="text-sm text-gray-500">Gate: {approval.gate_id}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor} bg-gray-100`}>
          {approval.status}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">Progress:</span>
          <span className="text-sm">{approvalCount}/{requiredCount} approvals</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(approvalCount / requiredCount) * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Required Approvers:</h4>
        <div className="flex flex-wrap gap-2">
          {approval.required_approvers.map((approver) => {
            const response = approval.responses.find(r => r.approver === approver);
            return (
              <span
                key={approver}
                className={`px-2 py-1 rounded text-xs ${
                  response?.approved ? 'bg-green-100 text-green-800'
                  : response ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
                }`}
              >
                {approver} {response?.approved ? '✓' : response ? '✗' : '○'}
              </span>
            );
          })}
        </div>
      </div>

      {approval.responses.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Responses:</h4>
          <div className="space-y-2">
            {approval.responses.map((response, idx) => (
              <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                <span className="font-medium">{response.approver}</span>
                <span className={response.approved ? 'text-green-600' : 'text-red-600'}>
                  {' '}{response.approved ? 'approved' : 'rejected'}
                </span>
                {response.comment && (
                  <p className="text-gray-600 mt-1">"{response.comment}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {canRespond && approval.status === 'Pending' && (
        <div className="mt-4 space-y-3">
          <textarea
            className="w-full border rounded p-2 text-sm"
            placeholder="Add comment or reason..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              ✓ Approve
            </button>
            <button
              onClick={handleReject}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              ✗ Reject
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        Created: {new Date(approval.created_at).toLocaleString()}
        {approval.completed_at && (
          <> • Completed: {new Date(approval.completed_at).toLocaleString()}</>
        )}
      </div>
    </div>
  );
}
