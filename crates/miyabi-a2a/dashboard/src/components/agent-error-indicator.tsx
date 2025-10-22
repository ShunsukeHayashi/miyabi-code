import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { Tooltip } from "@heroui/react";

/**
 * Error severity levels
 */
export type ErrorSeverity = "error" | "warning" | "critical";

/**
 * Position of the error indicator
 */
export type IndicatorPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/**
 * Props for the AgentErrorIndicator component
 */
export interface AgentErrorIndicatorProps {
  /** Whether to show the indicator */
  show?: boolean;
  /** Error severity level */
  severity?: ErrorSeverity;
  /** Position of the indicator */
  position?: IndicatorPosition;
  /** Error message for tooltip */
  errorMessage?: string;
  /** Icon size */
  size?: "sm" | "md" | "lg";
  /** Custom class name */
  className?: string;
}

/**
 * Animated error indicator component for agent cards
 *
 * Features:
 * - Pulsing animation to draw attention
 * - Ripple effect animation
 * - Configurable severity levels
 * - Optional tooltip with error message
 * - Responsive sizing
 * - Dark mode support
 *
 * @example
 * ```tsx
 * <AgentErrorIndicator
 *   show={hasError}
 *   severity="critical"
 *   errorMessage="Task execution failed"
 *   position="top-right"
 * />
 * ```
 */
export const AgentErrorIndicator = React.memo<AgentErrorIndicatorProps>(
  ({
    show = true,
    severity = "error",
    position = "top-right",
    errorMessage,
    size = "md",
    className = "",
  }) => {
    // Get severity-based styling
    const getSeverityConfig = React.useMemo(() => {
      switch (severity) {
        case "critical":
          return {
            icon: "lucide:x-circle",
            iconColor: "text-red-600 dark:text-red-500",
            rippleColor: "bg-red-500",
            pulseSpeed: 1.0,
          };
        case "warning":
          return {
            icon: "lucide:alert-triangle",
            iconColor: "text-yellow-500 dark:text-yellow-400",
            rippleColor: "bg-yellow-500",
            pulseSpeed: 2.0,
          };
        case "error":
        default:
          return {
            icon: "lucide:alert-circle",
            iconColor: "text-red-500 dark:text-red-400",
            rippleColor: "bg-red-500",
            pulseSpeed: 1.5,
          };
      }
    }, [severity]);

    // Get position class
    const getPositionClass = React.useMemo(() => {
      switch (position) {
        case "top-left":
          return "top-2 left-2";
        case "top-right":
          return "top-2 right-2";
        case "bottom-left":
          return "bottom-2 left-2";
        case "bottom-right":
          return "bottom-2 right-2";
        default:
          return "top-2 right-2";
      }
    }, [position]);

    // Get icon size
    const getIconSize = React.useMemo(() => {
      switch (size) {
        case "sm":
          return "h-4 w-4";
        case "md":
          return "h-5 w-5";
        case "lg":
          return "h-6 w-6";
        default:
          return "h-5 w-5";
      }
    }, [size]);

    // Pulse animation
    const pulseVariants = React.useMemo(
      () => ({
        initial: { opacity: 1, scale: 1 },
        animate: {
          opacity: [1, 0.3, 1],
          scale: [1, 1.2, 1],
          transition: {
            duration: getSeverityConfig.pulseSpeed,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      }),
      [getSeverityConfig.pulseSpeed]
    );

    // Ripple animation
    const rippleVariants = React.useMemo(
      () => ({
        initial: { scale: 1, opacity: 0.5 },
        animate: {
          scale: [1, 2, 2],
          opacity: [0.5, 0, 0],
          transition: {
            duration: getSeverityConfig.pulseSpeed,
            repeat: Infinity,
            ease: "easeOut",
          },
        },
      }),
      [getSeverityConfig.pulseSpeed]
    );

    const indicator = (
      <AnimatePresence>
        {show && (
          <motion.div
            className={`absolute ${getPositionClass} z-10 ${className}`}
            variants={pulseVariants}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, scale: 0 }}
            role="alert"
            aria-live="assertive"
            aria-label={errorMessage || `${severity} indicator`}
          >
            <div className="relative">
              {/* Main icon */}
              <Icon
                icon={getSeverityConfig.icon}
                className={`${getIconSize} ${getSeverityConfig.iconColor} relative z-10`}
              />

              {/* Ripple effect */}
              <motion.div
                className={`absolute inset-0 rounded-full ${getSeverityConfig.rippleColor}`}
                variants={rippleVariants}
                initial="initial"
                animate="animate"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );

    // Wrap with tooltip if error message provided
    if (errorMessage) {
      return (
        <Tooltip
          content={errorMessage}
          color={severity === "warning" ? "warning" : "danger"}
          placement="left"
          closeDelay={0}
        >
          {indicator}
        </Tooltip>
      );
    }

    return indicator;
  }
);

AgentErrorIndicator.displayName = "AgentErrorIndicator";

/**
 * Helper hook to manage error indicator state
 *
 * @example
 * ```tsx
 * const { showError, setError, clearError } = useErrorIndicator();
 *
 * // Show error
 * setError("critical", "Task failed");
 *
 * // Clear after 5 seconds
 * setTimeout(clearError, 5000);
 * ```
 */
export const useErrorIndicator = () => {
  const [errorState, setErrorState] = React.useState<{
    show: boolean;
    severity: ErrorSeverity;
    message?: string;
  }>({
    show: false,
    severity: "error",
  });

  const setError = React.useCallback((severity: ErrorSeverity, message?: string) => {
    setErrorState({ show: true, severity, message });
  }, []);

  const clearError = React.useCallback(() => {
    setErrorState((prev) => ({ ...prev, show: false }));
  }, []);

  return {
    showError: errorState.show,
    errorSeverity: errorState.severity,
    errorMessage: errorState.message,
    setError,
    clearError,
  };
};
