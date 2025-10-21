import React from "react";
import { Card, CardBody, Chip, Tooltip, Button, Progress } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Agent } from "../types/miyabi-types";

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);

  // Map agent type to color, icon, and emoji
  const getAgentTypeInfo = (type: string) => {
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
  };

  // Map status to color and animation
  const getStatusInfo = (status: string) => {
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
  };

  const typeInfo = getAgentTypeInfo(agent.type);
  const statusInfo = getStatusInfo(agent.status);
  const isWorking = agent.status === "working" || agent.status === "active";

  // Animation variants
  const cardVariants = {
    initial: { scale: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 30px rgba(99, 102, 241, 0.2)",
      transition: { duration: 0.2 }
    },
  };

  const iconVariants = {
    working: {
      rotate: 360,
      transition: { duration: 2, repeat: Infinity, ease: "linear" }
    },
    idle: { rotate: 0 }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={`
          transition-all duration-300 cursor-pointer
          ${isWorking ? "border-2 border-primary" : "border border-divider"}
          ${isHovered ? "bg-content2" : ""}
        `}
        isPressable
        onPress={() => {
          setShowDetails(!showDetails);
          onClick?.();
        }}
      >
        <CardBody className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Agent Icon with Gradient */}
              <motion.div
                className={`
                  flex h-10 w-10 items-center justify-center rounded-full
                  bg-gradient-to-br ${typeInfo.color}
                  shadow-lg
                `}
                animate={isWorking ? "working" : "idle"}
                variants={iconVariants}
              >
                <Icon icon={typeInfo.icon} className="h-5 w-5 text-white" />
              </motion.div>

              {/* Agent Info */}
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-lg">{typeInfo.emoji}</span>
                  <h3 className="font-semibold text-lg">{agent.name}</h3>
                </div>
                <p className="text-xs text-foreground-400">{typeInfo.label} • {agent.type}</p>
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
              <span className="font-semibold">{agent.taskCount}</span>
            </div>

            {agent.taskCount > 0 && (
              <Progress
                value={(agent.taskCount / 5) * 100}
                color={statusInfo.color}
                size="sm"
                className="max-w-full"
              />
            )}

            {agent.currentTask && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 rounded-md bg-default-100 p-2"
              >
                <p className="text-xs text-foreground-500 mb-1">現在の作業:</p>
                <p className="text-sm font-medium truncate">{agent.currentTask}</p>
              </motion.div>
            )}
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

          {/* Pulse indicator for working agents */}
          {isWorking && (
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
};