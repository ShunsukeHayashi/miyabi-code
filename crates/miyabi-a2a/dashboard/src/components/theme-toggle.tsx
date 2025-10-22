import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/theme-context";

/**
 * ThemeToggle - テーマ切り替えボタン（Framer Motion強化版）
 *
 * Features:
 * - スムーズなアイコン切り替えアニメーション
 * - ホバーエフェクト（回転）
 * - クリック時のスケールアニメーション
 * - システムテーマ自動検出
 */

const iconVariants = {
  initial: { scale: 0, rotate: -180, opacity: 0 },
  animate: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
  exit: {
    scale: 0,
    rotate: 180,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

const buttonVariants = {
  hover: {
    scale: 1.1,
    rotate: 15,
    transition: { type: "spring", stiffness: 300 },
  },
  tap: {
    scale: 0.9,
    rotate: -15,
  },
};

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.div
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
    >
      <Button
        isIconOnly
        variant="light"
        onPress={toggleTheme}
        aria-label="Toggle theme"
        className="relative"
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === "dark" ? (
            <motion.div
              key="dark"
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 flex items-center justify-center"
            >
              <Icon icon="lucide:moon" className="text-xl text-yellow-400" />
            </motion.div>
          ) : (
            <motion.div
              key="light"
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 flex items-center justify-center"
            >
              <Icon icon="lucide:sun" className="text-xl text-orange-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
};
