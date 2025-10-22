import React from "react";
import { Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";

interface LoadingFallbackProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Loading fallback component for React.lazy Suspense boundaries
 * Used during code-split component loading
 */
export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = "Loading component...",
  size = "md",
}) => {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size={size} color="primary" />
        <div className="flex items-center gap-2">
          <Icon icon="lucide:loader" className="h-4 w-4 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground-600">{message}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Minimal loading fallback for smaller components
 */
export const MinimalLoadingFallback: React.FC = () => {
  return (
    <div className="flex w-full items-center justify-center p-8">
      <Spinner size="sm" color="primary" />
    </div>
  );
};

/**
 * Tab content loading fallback
 */
export const TabLoadingFallback: React.FC<{ tabName: string }> = ({ tabName }) => {
  return (
    <div className="flex min-h-[500px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" color="primary" />
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground-700">
            Loading {tabName}
          </p>
          <p className="text-sm text-foreground-500">
            Fetching components...
          </p>
        </div>
      </div>
    </div>
  );
};
