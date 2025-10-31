import { Code, Briefcase, Zap } from "lucide-react";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Feature = ({ icon, title, description }: FeatureProps) => {
  return (
    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-black text-white rounded-lg">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
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
          <h1 className="text-4xl font-bold mb-2">Welcome to Miyabi Desktop 🎌</h1>
          <p className="text-lg text-gray-600">
            自律型AI開発プラットフォーム - 21個のエージェントがあなたの開発を加速します
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <Feature
            icon={<Code />}
            title="7 Coding Agents"
            description="コード生成、レビュー、デプロイまで全自動"
          />
          <Feature
            icon={<Briefcase />}
            title="14 Business Agents"
            description="戦略企画、マーケティング、営業まで包括サポート"
          />
          <Feature
            icon={<Zap />}
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
