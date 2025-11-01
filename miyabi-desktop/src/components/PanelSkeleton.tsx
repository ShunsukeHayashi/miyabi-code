/**
 * PanelSkeleton - Loading skeleton component for lazy-loaded panels
 *
 * Displays a minimal loading state while panel components are being loaded.
 * Follows the Ultra Minimalism design philosophy with subtle animations.
 */

export function PanelSkeleton() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12 animate-pulse">
      <div className="w-16 h-16 rounded-2xl bg-gray-200 mb-6"></div>
      <div className="space-y-3 w-full max-w-md">
        <div className="h-4 bg-gray-200 rounded-full w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded-full w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded-full w-5/6"></div>
      </div>
      <div className="mt-12 text-sm font-light text-gray-400" role="status" aria-live="polite">
        Loading panel...
      </div>
    </div>
  );
}

export default PanelSkeleton;
