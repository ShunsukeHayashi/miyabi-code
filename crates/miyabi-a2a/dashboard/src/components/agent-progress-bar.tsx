import React from "react";
import { motion } from "framer-motion";
import type { AgentStatus } from "../types/miyabi-types";

/**
 * Props for the AgentProgressBar component
 */
export interface AgentProgressBarProps {
  /** Number of completed tasks */
  tasks: number;
  /** Maximum number of tasks */
  maxTasks: number;
  /** Current agent status */
  status: AgentStatus;
  /** Optional class name for styling */
  className?: string;
  /** Whether to show percentage label */
  showLabel?: boolean;
  /** Custom height (in Tailwind units) */
  height?: "sm" | "md" | "lg";
}

/**
 * Animated progress bar component for visualizing agent task completion
 *
 * Features:
 * - Smooth animation with framer-motion
 * - Status-based gradient colors
 * - Dark mode support
 * - Responsive sizing
 * - Optional percentage label
 *
 * @example
 * ```tsx
 * <AgentProgressBar
 *   tasks={7}
 *   maxTasks={10}
 *   status="working"
 *   showLabel
 * />
 * ```
 */
export const AgentProgressBar = React.memo<AgentProgressBarProps>(
  ({ tasks, maxTasks, status, className = "", showLabel = false, height = "md" }) => {
    // Validate inputs
    const validTasks = Math.max(0, tasks);
    const validMaxTasks = Math.max(1, maxTasks);

    // Calculate progress percentage (0-100)
    const progress = React.useMemo(() => {
      return Math.min((validTasks / validMaxTasks) * 100, 100);
    }, [validTasks, validMaxTasks]);

    // Get gradient colors based on status
    const getGradient = React.useCallback((status: AgentStatus): string => {
      switch (status) {
        case "working":
          return "from-green-400 to-green-600 dark:from-green-500 dark:to-green-700";
        case "error":
          return "from-red-400 to-red-600 dark:from-red-500 dark:to-red-700";
        case "active":
          return "from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700";
        case "idle":
          return "from-gray-400 to-gray-600 dark:from-gray-500 dark:to-gray-700";
        case "completed":
          return "from-miyabi-success to-green-600 dark:from-green-600 dark:to-green-800";
        default:
          return "from-gray-400 to-gray-600 dark:from-gray-500 dark:to-gray-700";
      }
    }, []);

    // Get height class
    const getHeightClass = React.useMemo(() => {
      switch (height) {
        case "sm":
          return "h-1";
        case "md":
          return "h-1.5";
        case "lg":
          return "h-2";
        default:
          return "h-1.5";
      }
    }, [height]);

    // Animation variants
    const progressVariants = React.useMemo(
      () => ({
        initial: { width: 0, opacity: 0 },
        animate: {
          width: `${progress}%`,
          opacity: 1,
          transition: {
            width: { duration: 0.5, ease: "easeOut" },
            opacity: { duration: 0.3 },
          },
        },
      }),
      [progress]
    );

    // Pulse animation for working status
    const pulseVariants = React.useMemo(
      () => ({
        initial: { opacity: 0.8 },
        animate:
          status === "working"
            ? {
                opacity: [0.8, 1, 0.8],
                transition: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }
            : { opacity: 1 },
      }),
      [status]
    );

    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {/* Progress bar container */}
        <div
          className={`relative ${getHeightClass} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Agent progress: ${validTasks} of ${validMaxTasks} tasks completed`}
        >
          {/* Animated progress fill */}
          <motion.div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getGradient(status)} rounded-full`}
            variants={progressVariants}
            initial="initial"
            animate="animate"
          >
            {/* Pulse overlay for working status */}
            {status === "working" && (
              <motion.div
                className="absolute inset-0 bg-white/20 rounded-full"
                variants={pulseVariants}
                initial="initial"
                animate="animate"
              />
            )}
          </motion.div>
        </div>

        {/* Optional percentage label */}
        {showLabel && (
          <motion.div
            className="flex items-center justify-between text-xs text-foreground-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span>
              {validTasks}/{validMaxTasks} tasks
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </motion.div>
        )}
      </div>
    );
  }
);

AgentProgressBar.displayName = "AgentProgressBar";
