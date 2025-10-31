import { CheckCircle2, Sparkles } from "lucide-react";

interface SetupCompleteScreenProps {
  githubToken: string;
  repository: string;
  onFinish: () => void;
}

export const SetupCompleteScreen = ({
  githubToken,
  repository,
  onFinish,
}: SetupCompleteScreenProps) => {
  // Mask token for display (show first 7 chars + "...")
  const maskedToken = githubToken
    ? `${githubToken.substring(0, 7)}...`
    : "Not set";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-2xl p-8 bg-white rounded-2xl shadow-2xl">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2">セットアップ完了! 🎉</h1>
          <p className="text-lg text-gray-600">
            Miyabi Desktopの初期設定が完了しました
          </p>
        </div>

        {/* Setup Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-green-900 mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2" />
            設定内容
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-900">GitHub Token: </span>
                <span className="text-gray-600 font-mono text-xs">
                  {maskedToken}
                </span>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-900">Repository: </span>
                <span className="text-gray-600">{repository || "Not selected"}</span>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-900">
                  21個のエージェントが利用可能になりました
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">次のステップ:</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>
                <strong>Agent Dashboard</strong>から作業したいAgentを選択
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>
                <strong>GitHub Issues</strong>を作成して、Agentに作業を依頼
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>
                <strong>Real-time Logs</strong>でAgent実行状況を確認
              </span>
            </li>
          </ul>
        </div>

        {/* Available Agents Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold text-purple-900 mb-1">
                💻 Coding Agents (7個)
              </div>
              <p className="text-xs text-purple-700">
                コード生成、レビュー、デプロイなど
              </p>
            </div>
            <div>
              <div className="font-semibold text-purple-900 mb-1">
                💼 Business Agents (14個)
              </div>
              <p className="text-xs text-purple-700">
                戦略企画、マーケティング、営業など
              </p>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onFinish}
          className="w-full py-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-lg"
        >
          Start Using Miyabi Desktop →
        </button>

        {/* Help Text */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          設定内容はいつでも Settings から変更できます
        </p>
      </div>
    </div>
  );
};
