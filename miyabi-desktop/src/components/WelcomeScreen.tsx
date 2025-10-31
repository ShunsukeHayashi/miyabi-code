import { Code, Briefcase, Zap } from "lucide-react";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Feature = ({ icon, title, description }: FeatureProps) => {
  return (
    <div className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
      <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl p-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome to Miyabi Desktop 🎌
          </h1>
          <p className="text-lg text-gray-600">
            自律型AI開発プラットフォーム - 21個のエージェントがあなたの開発を加速します
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <Feature
            icon={<Code className="w-6 h-6" />}
            title="7 Coding Agents"
            description="コード生成、レビュー、デプロイまで全自動"
          />
          <Feature
            icon={<Briefcase className="w-6 h-6" />}
            title="14 Business Agents"
            description="戦略企画、マーケティング、営業まで包括サポート"
          />
          <Feature
            icon={<Zap className="w-6 h-6" />}
            title="Real-time Logs"
            description="エージェント実行状況をリアルタイム可視化"
          />
        </div>

        <button
          onClick={onStart}
          className="w-full py-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Get Started →
        </button>
      </div>
    </div>
  );
};
