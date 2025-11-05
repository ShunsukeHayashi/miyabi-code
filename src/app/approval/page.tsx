/**
 * Approval Dashboard Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { ApprovalCard, type Approval } from '@/components/approval/ApprovalCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ApprovalDashboard() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');

  useEffect(() => {
    // Load current user from localStorage or authentication
    const user = localStorage.getItem('miyabi_user') || 'anonymous';
    setCurrentUser(user);

    // Fetch pending approvals
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/approvals?status=pending`);
      if (!response.ok) {
        throw new Error(`Failed to fetch approvals: ${response.statusText}`);
      }
      const data = await response.json();
      setApprovals(data);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string, approver: string, comment?: string) => {
    const response = await fetch(`${API_URL}/api/approval/${approvalId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ approver, comment }),
    });

    if (!response.ok) {
      throw new Error(`Failed to approve: ${response.statusText}`);
    }

    // Refresh approvals
    await fetchApprovals();
  };

  const handleReject = async (approvalId: string, approver: string, reason?: string) => {
    const response = await fetch(`${API_URL}/api/approval/${approvalId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ approver, reason }),
    });

    if (!response.ok) {
      throw new Error(`Failed to reject: ${response.statusText}`);
    }

    // Refresh approvals
    await fetchApprovals();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Approval Dashboard</h1>
        <p className="text-gray-600">Review and approve pending workflow requests</p>
        {currentUser && (
          <p className="text-sm text-gray-500 mt-1">Logged in as: {currentUser}</p>
        )}
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading approvals...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={fetchApprovals}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && approvals.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No pending approvals</p>
          <p className="text-gray-500 text-sm mt-2">All workflows are up to date!</p>
        </div>
      )}

      {!loading && approvals.length > 0 && (
        <div className="space-y-6">
          {approvals.map((approval) => (
            <ApprovalCard
              key={approval.approval_id}
              approval={approval}
              onApprove={handleApprove}
              onReject={handleReject}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}
