import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '../../lib/api'

interface AgentStatus {
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  result?: any
  error?: string
}

const AIFunnelBuilder = () => {
  const [businessContext, setBusinessContext] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [agents, setAgents] = useState<AgentStatus[]>([])
  const [funnelDesign, setFunnelDesign] = useState<any>(null)

  const agentDefinitions = [
    { name: 'MarketResearch', description: '市場調査・競合分析' },
    { name: 'Persona', description: 'ターゲットペルソナ設計' },
    { name: 'ProductConcept', description: 'プロダクトコンセプト最適化' },
    { name: 'FunnelDesign', description: 'ファネル構造設計' },
    { name: 'ContentCreation', description: 'コンテンツ制作計画' },
    { name: 'Marketing', description: 'マーケティング戦略' },
    { name: 'SNSStrategy', description: 'SNS戦略立案' },
    { name: 'Sales', description: 'セールスプロセス設計' },
  ]

  const handleGenerate = async () => {
    setIsGenerating(true)
    setAgents([])
    setFunnelDesign(null)

    try {
      // Initialize agent statuses
      const initialAgents: AgentStatus[] = agentDefinitions.map(def => ({
        name: def.name,
        status: 'pending',
      }))
      setAgents(initialAgents)

      // Call SWML Ω-System backend API
      console.log('Calling Agent Execution API with context:', businessContext)
      const response = await api.executeFunnelAgents(businessContext)

      console.log('Agent execution completed:', response)

      // Update agent statuses from response
      const completedAgents: AgentStatus[] = response.agents.map((agent: any) => ({
        name: agent.name,
        status: agent.status === 'completed' ? 'completed' : 'error',
        result: agent.result,
        error: agent.error,
      }))
      setAgents(completedAgents)

      // Set funnel design from response
      setFunnelDesign(response.funnel_design)

      console.log(`Agent execution time: ${response.execution_time_ms}ms`)
    } catch (error: any) {
      console.error('Failed to execute agents:', error)

      // Update all agents to error state
      setAgents(prev => prev.map(agent => ({
        ...agent,
        status: 'error',
        error: error.message || 'Unknown error occurred',
      })))

      alert('エージェント実行中にエラーが発生しました。詳細はコンソールをご確認ください。')
    } finally {
      setIsGenerating(false)
    }
  }

  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-12 h-12 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">AI自動ファネルビルダー</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ビジネス情報を入力するだけで、AIが最適なファネルを自動設計します
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Input Form */}
          <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 hover:shadow-xl transition-shadow h-full flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              ビジネス情報入力
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ビジネス情報・コンテキスト
                </label>
                <textarea
                  value={businessContext}
                  onChange={(e) => setBusinessContext(e.target.value)}
                  placeholder="ビジネスについて自由に記述してください。AIが自動的に解析します。

例：
「30-50代の起業家・経営者向けのオンラインコーチングプログラムを提供しています。
価格は¥49,800で、3ヶ月間のメンタリングとグループコーチングを含みます。
主な目標はリード獲得とウェビナー経由での販売です。
競合他社と差別化するために、個別カスタマイズされた成長戦略を提供しています。」

AIが自動的に以下を抽出・分析します：
• 商品/サービス内容
• ターゲット顧客層
• 価格設定
• ファネルの目的
• 競合状況
• 独自の価値提案（USP）"
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !businessContext.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    AI生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    AIで自動生成
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Agent Status Panel */}
          <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 hover:shadow-xl transition-shadow h-full flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              AI Agent実行状況
            </h2>

            {agents.length > 0 ? (
              <div className="space-y-3">
                {agents.map((agent, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {getStatusIcon(agent.status)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {agentDefinitions[idx].name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {agentDefinitions[idx].description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center py-12 text-gray-500">
                <div>
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-base">ビジネス情報を入力して、AI生成を開始してください</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Funnel Design Result */}
        {funnelDesign && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ✨ 生成されたファネル設計
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pages */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  ページ構成 ({funnelDesign.pages?.length || 0}ページ)
                </h3>
                <div className="space-y-2">
                  {funnelDesign.pages?.map((page: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                      <span className="text-xs font-medium text-blue-700">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-gray-900">{page.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Sequence */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  メールシーケンス ({funnelDesign.email_sequence?.length || 0}通)
                </h3>
                <div className="space-y-2">
                  {funnelDesign.email_sequence?.map((email: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <span className="text-xs font-medium text-green-700">
                        Day {email.day}
                      </span>
                      <span className="text-sm text-gray-900">{email.subject}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md font-medium hover:bg-purple-700">
                ClickFunnelsに作成
              </button>
              <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md font-medium hover:bg-gray-700">
                編集する
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIFunnelBuilder
