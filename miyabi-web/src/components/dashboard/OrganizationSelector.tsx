/**
 * OrganizationSelector Component
 *
 * Dropdown for switching between organizations
 * Issue: #970 Phase 3.2 - Dashboard Components
 */

'use client';

import { useState } from 'react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { authApi, Organization } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface OrganizationSelectorProps {
  currentOrgId?: string;
  onOrganizationChange?: (org: Organization) => void;
}

export function OrganizationSelector({
  currentOrgId,
  onOrganizationChange,
}: OrganizationSelectorProps) {
  const { data: organizations, isLoading } = useOrganizations();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const currentOrg = organizations?.find((org) => org.id === currentOrgId);

  const handleSelect = async (org: Organization) => {
    if (org.id === currentOrgId) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      const response = await authApi.switchOrganization(org.id);

      // Update token in localStorage
      const storage = localStorage.getItem('miyabi-auth-storage');
      if (storage) {
        const parsed = JSON.parse(storage);
        parsed.state.accessToken = response.data.access_token;
        localStorage.setItem('miyabi-auth-storage', JSON.stringify(parsed));
      }

      onOrganizationChange?.(org);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch organization:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-10 w-48 bg-muted animate-pulse rounded-md" />
    );
  }

  if (!organizations || organizations.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="w-48 justify-between"
      >
        <span className="truncate">
          {currentOrg?.name ?? 'Select Organization'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-background border rounded-lg shadow-lg z-20">
            <div className="p-2 border-b">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Organizations
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSelect(org)}
                  disabled={isSwitching}
                  className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors ${
                    org.id === currentOrgId ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-xs text-muted-foreground">@{org.slug}</p>
                    </div>
                    {org.id === currentOrgId && (
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      {org.plan}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
