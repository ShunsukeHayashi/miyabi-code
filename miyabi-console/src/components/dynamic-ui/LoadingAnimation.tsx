import { motion } from 'framer-motion';

/**
 * Impactful Loading Animation for Dynamic UI Generation
 *
 * Shows multi-stage loading process:
 * 1. Data Collection
 * 2. AI Analysis
 * 3. UI Generation
 * 4. Rendering
 */

interface LoadingStage {
  id: string;
  label: string;
  icon: string;
}

const LOADING_STAGES: LoadingStage[] = [
  { id: 'collect', label: 'Collecting System Data', icon: '📊' },
  { id: 'analyze', label: 'AI Analysis in Progress', icon: '🧠' },
  { id: 'generate', label: 'Generating Adaptive UI', icon: '✨' },
  { id: 'render', label: 'Finalizing Experience', icon: '🎨' },
];

interface LoadingAnimationProps {
  currentStage?: string;
  progress?: number;
}

export default function LoadingAnimation({
  currentStage = 'collect',
  progress = 0,
}: LoadingAnimationProps) {
  const currentStageIndex = LOADING_STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center space-y-8 px-4 max-w-md">
        {/* Logo Animation */}
        <motion.div
          className="text-8xl"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          🚀
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-white mb-2">
            Adaptive Runtime
          </h2>
          <p className="text-gray-300 text-lg">
            Crafting your personalized dashboard
          </p>
        </motion.div>

        {/* Stages */}
        <div className="space-y-4">
          {LOADING_STAGES.map((stage, index) => {
            const isActive = index === currentStageIndex;
            const isCompleted = index < currentStageIndex;

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white/20 backdrop-blur-sm'
                    : isCompleted
                    ? 'bg-green-500/20'
                    : 'bg-white/5'
                }`}
              >
                <motion.div
                  className="text-3xl"
                  animate={
                    isActive
                      ? {
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0],
                        }
                      : {}
                  }
                  transition={{
                    duration: 1,
                    repeat: isActive ? Infinity : 0,
                  }}
                >
                  {isCompleted ? '✅' : stage.icon}
                </motion.div>

                <div className="flex-1 text-left">
                  <p
                    className={`font-medium ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {stage.label}
                  </p>

                  {isActive && (
                    <motion.div
                      className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </div>

                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-green-400"
                  >
                    ✓
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-300">
            <span>Overall Progress</span>
            <span>{Math.round((currentStageIndex / LOADING_STAGES.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{
                width: `${(currentStageIndex / LOADING_STAGES.length) * 100}%`,
              }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>

        {/* Subtle Message */}
        <motion.p
          className="text-gray-400 text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Powered by Gemini 3 Pro Preview
        </motion.p>
      </div>
    </div>
  );
}
