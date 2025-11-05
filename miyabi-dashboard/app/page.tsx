'use client'

import { useState, useEffect } from 'react'

interface AgentStatus {
  name: string
  status: 'idle' | 'running' | 'completed' | 'failed'
  progress: number
  currentTask?: string
}

interface Issue {
  number: number
  title: string
  state: string
  labels: string[]
  url: string
}

export default function Dashboard() {
  const [agents, setAgents] = useState<AgentStatus[]>([
    { name: 'CoordinatorAgent', status: 'running', progress: 75, currentTask: 'Issue #531 分析中' },
    { name: 'CodeGenAgent', status: 'running', progress: 45, currentTask: 'Next.js コンポーネント生成中' },
    { name: 'ReviewAgent', status: 'idle', progress: 0 },
    { name: 'PRAgent', status: 'idle', progress: 0 },
    { name: 'DeploymentAgent', status: 'idle', progress: 0 },
    { name: 'IssueAgent', status: 'completed', progress: 100 },
    { name: 'RefresherAgent', status: 'completed', progress: 100 },
  ])

  const [issues, setIssues] = useState<Issue[]>([
    {
      number: 531,
      title: '統合占いアプリ「Shinyu（真由）」開発プロジェクト',
      state: 'open',
      labels: ['⚠️ priority:P1-High', '✨ type:feature'],
      url: 'https://github.com/customer-cloud/miyabi-private/issues/531'
    },
    {
      number: 178,
      title: '[Shinyu AI] Phase 1: 性格診断システムと16キャラクター定義の実装',
      state: 'open',
      labels: ['✨ type:feature'],
      url: 'https://github.com/ShunsukeHayashi/Miyabi/issues/178'
    },
  ])

  const getStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'running':
        return 'bg-miyabi-blue'
      case 'completed':
        return 'bg-miyabi-green'
      case 'failed':
        return 'bg-miyabi-red'
      default:
        return 'bg-gray-600'
    }
  }

  const getStatusText = (status: AgentStatus['status']) => {
    switch (status) {
      case 'running':
        return '実行中'
      case 'completed':
        return '完了'
      case 'failed':
        return '失敗'
      default:
        return '待機中'
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-miyabi-blue to-miyabi-purple bg-clip-text text-transparent">
                Miyabi Dashboard
              </h1>
              <p className="text-gray-400 text-lg">
                完全自律型AI開発オペレーションプラットフォーム
              </p>
            </div>
            <a
              href="/mission-control"
              className="px-6 py-3 bg-gradient-to-r from-miyabi-blue to-miyabi-purple rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
            >
              🎮 Mission Control →
            </a>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-2">Total Agents</p>
            <p className="text-4xl font-bold text-white">{agents.length}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-2">Running</p>
            <p className="text-4xl font-bold text-miyabi-blue">
              {agents.filter(a => a.status === 'running').length}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-2">Completed</p>
            <p className="text-4xl font-bold text-miyabi-green">
              {agents.filter(a => a.status === 'completed').length}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-2">Open Issues</p>
            <p className="text-4xl font-bold text-miyabi-purple">{issues.length}</p>
          </div>
        </div>

        {/* Agents Status */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">Agent Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      agent.status
                    )} text-white`}
                  >
                    {getStatusText(agent.status)}
                  </span>
                </div>

                {agent.currentTask && (
                  <p className="text-sm text-gray-400 mb-4">{agent.currentTask}</p>
                )}

                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getStatusColor(
                      agent.status
                    )}`}
                    style={{ width: `${agent.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">{agent.progress}%</p>
              </div>
            ))}
          </div>
        </section>

        {/* Issues */}
        <section>
          <h2 className="text-3xl font-bold mb-6 text-white">Active Issues</h2>
          <div className="space-y-4">
            {issues.map((issue) => (
              <a
                key={issue.number}
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-gray-400 font-mono text-sm">#{issue.number}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          issue.state === 'open'
                            ? 'bg-miyabi-green/20 text-miyabi-green'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {issue.state}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">{issue.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      {issue.labels.map((label) => (
                        <span
                          key={label}
                          className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
