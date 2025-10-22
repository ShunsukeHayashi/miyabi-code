import React from "react";
import { Card, CardBody, Chip, Tooltip, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Agent } from "../types/miyabi-types"; // ✅ Rust型に準拠
import { AgentProgressBar } from "./agent-progress-bar";
import { AgentErrorIndicator } from "./agent-error-indicator";

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

/**
 * AgentCard component - optimized with React.memo
 * Only re-renders when agent props change
 */
export const AgentCard = React.memo<AgentCardProps>(({ agent, onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  // Map agent role to color, icon, and emoji
  // Note: agent.role is English name (e.g., "Coordinator"), so we convert to lowercase
  const getAgentTypeInfo = React.useCallback((role: string) => {
    const type = role.toLowerCase();
    switch (type) {
      case "coordinator":
        return {
          color: "from-red-500 to-red-600",
          icon: "lucide:compass",
          emoji: "🔴",
          label: "リーダー"
        };
      case "codegen":
        return {
          color: "from-green-500 to-green-600",
          icon: "lucide:code",
          emoji: "🟢",
          label: "実行役"
        };
      case "review":
        return {
          color: "from-blue-500 to-blue-600",
          icon: "lucide:search-check",
          emoji: "🔵",
          label: "分析役"
        };
      case "issue":
        return {
          color: "from-blue-500 to-blue-600",
          icon: "lucide:search",
          emoji: "🔵",
          label: "分析役"
        };
      case "pr":
        return {
          color: "from-yellow-500 to-yellow-600",
          icon: "lucide:git-pull-request",
          emoji: "🟡",
          label: "サポート役"
        };
      case "deploy":
        return {
          color: "from-yellow-500 to-yellow-600",
          icon: "lucide:rocket",
          emoji: "🟡",
          label: "サポート役"
        };
      case "hooks":
        return {
          color: "from-yellow-500 to-yellow-600",
          icon: "lucide:link",
          emoji: "🟡",
          label: "サポート役"
        };
      default:
        return {
          color: "from-gray-500 to-gray-600",
          icon: "lucide:bot",
          emoji: "⚪",
          label: "エージェント"
        };
    }
  }, []);

  // Map status to color and animation
  const getStatusInfo = React.useCallback((status: string) => {
    switch (status) {
      case "active":
        return { color: "success", icon: "lucide:activity", label: "稼働中" };
      case "working":
        return { color: "primary", icon: "lucide:loader", label: "作業中" };
      case "idle":
        return { color: "default", icon: "lucide:clock", label: "待機中" };
      case "error":
        return { color: "danger", icon: "lucide:alert-circle", label: "エラー" };
      default:
        return { color: "default", icon: "lucide:help-circle", label: "不明" };
    }
  }, []);

  const typeInfo = React.useMemo(() => getAgentTypeInfo(agent.role), [agent.role, getAgentTypeInfo]);
  const statusInfo = React.useMemo(() => getStatusInfo(agent.status), [agent.status, getStatusInfo]);
  const isWorking = React.useMemo(
    () => agent.status === "working" || agent.status === "active",
    [agent.status]
  );

  const handleCardPress = React.useCallback(() => {
    setShowDetails(prev => !prev);
    onClick?.();
  }, [onClick]);

  const handleImageError = React.useCallback(() => {
    setImageError(true);
  }, []);

  const handleHoverStart = React.useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleHoverEnd = React.useCallback(() => {
    setIsHovered(false);
  }, []);

  // Animation variants (memoized)
  const cardVariants = React.useMemo(() => ({
    initial: { scale: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 30px rgba(99, 102, 241, 0.2)",
      transition: { duration: 0.2 }
    },
  }), []);

  const iconVariants = React.useMemo(() => ({
    working: {
      rotate: 360,
      transition: { duration: 2, repeat: Infinity, ease: "linear" }
    },
    idle: { rotate: 0 }
  }), []);

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
    >
      <Card
        className={`
          transition-all duration-300 cursor-pointer
          ${isWorking ? "border-2 border-primary" : "border border-divider"}
          ${isHovered ? "bg-content2" : ""}
        `}
        isPressable
        onPress={handleCardPress}
      >
        <CardBody className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Agent Character Image with Fallback */}
              <motion.div
                className={`
                  relative flex h-12 w-12 items-center justify-center rounded-full
                  bg-gradient-to-br ${typeInfo.color}
                  shadow-lg overflow-hidden
                `}
                animate={isWorking ? "working" : "idle"}
                variants={iconVariants}
              >
                {!imageError ? (
                  <img
                    src={`/agents/${agent.role.toLowerCase()}.png`}
                    alt={agent.name}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <Icon icon={typeInfo.icon} className="h-6 w-6 text-white" />
                )}
              </motion.div>

              {/* Agent Info */}
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-lg">{typeInfo.emoji}</span>
                  <h3 className="font-semibold text-lg">{agent.name}</h3>
                </div>
                <p className="text-xs text-foreground-400">{typeInfo.label} • {agent.role}</p>
              </div>
            </div>

            {/* Status Badge */}
            <Chip
              color={statusInfo.color}
              size="sm"
              variant="flat"
              startContent={<Icon icon={statusInfo.icon} className="h-3 w-3" />}
            >
              {statusInfo.label}
            </Chip>
          </div>

          {/* Stats */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-500">処理中タスク</span>
              <span className="font-semibold">{agent.tasks}</span>
            </div>

            {/* AgentProgressBar - animated task progress */}
            <AgentProgressBar
              tasks={agent.tasks || 0}
              maxTasks={10}
              status={agent.status}
              showLabel={agent.tasks > 0}
              height="md"
            />
          </div>

          {/* Actions (show on hover) */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: isHovered || showDetails ? 1 : 0, height: isHovered || showDetails ? "auto" : 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 flex justify-end gap-2 overflow-hidden"
          >
            <Tooltip content="詳細を表示">
              <Button isIconOnly size="sm" variant="flat" color="primary">
                <Icon icon="lucide:info" className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip content={agent.status === "active" ? "一時停止" : "再開"}>
              <Button isIconOnly size="sm" variant="flat" color="default">
                <Icon
                  icon={agent.status === "active" ? "lucide:pause" : "lucide:play"}
                  className="h-4 w-4"
                />
              </Button>
            </Tooltip>
            <Tooltip content="ログを表示">
              <Button isIconOnly size="sm" variant="flat" color="default">
                <Icon icon="lucide:file-text" className="h-4 w-4" />
              </Button>
            </Tooltip>
          </motion.div>

          {/* Status indicators */}
          {/* Error indicator with animation */}
          {agent.status === "error" && (
            <AgentErrorIndicator
              show={true}
              severity="error"
              position="top-right"
              errorMessage="Agent encountered an error"
              size="md"
            />
          )}

          {/* Pulse indicator for working agents */}
          {isWorking && agent.status !== "error" && (
            <div className="absolute top-2 right-2">
              <motion.div
                className="h-2 w-2 rounded-full bg-primary"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
});

AgentCard.displayName = "AgentCard";