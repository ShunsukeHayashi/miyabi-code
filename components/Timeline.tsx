'use client'

import { useMemo, useState } from 'react'
import { timelineEvents } from './mock-data'
import type {
  AgentIdentifier,
  TimelineEvent,
  TimelineEventCategory
} from './types'

const getUniqueValues = <T extends string>(items: TimelineEvent[], key: keyof TimelineEvent) =>
  Array.from(new Set(items.map((item) => item[key] as T)))

const categoryLabels: Record<TimelineEventCategory, string> = {
  issue: 'Issue',
  development: 'Development',
  review: 'Review',
  deployment: 'Deployment',
  knowledge: 'Knowledge',
  system: 'System'
}

const agentLabels: Partial<Record<AgentIdentifier, string>> = {
  CoordinatorAgent: 'Coordinator',
  CodeGenAgent: 'CodeGen',
  ReviewAgent: 'Review',
  DeploymentAgent: 'Deployment',
  PRAgent: 'PR',
  IssueAgent: 'Issue',
  RefresherAgent: 'Refresher',
  KnowledgeAgent: 'Knowledge'
}

export function Timeline() {
  const categories = useMemo(
    () => getUniqueValues<TimelineEventCategory>(timelineEvents, 'category'),
    []
  )

  const agents = useMemo(
    () => getUniqueValues<AgentIdentifier>(timelineEvents, 'agent'),
    []
  )

  const [activeCategories, setActiveCategories] = useState<TimelineEventCategory[]>(categories)
  const [selectedAgent, setSelectedAgent] = useState<'all' | AgentIdentifier>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const toggleCategory = (category: TimelineEventCategory) => {
    setActiveCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category]
    )
  }

  const filteredEvents = useMemo(() => {
    return timelineEvents
      .filter((event) => {
        if (activeCategories.length && !activeCategories.includes(event.category)) {
          return false
        }
        if (selectedAgent !== 'all' && event.agent !== selectedAgent) {
          return false
        }
        if (searchTerm.trim().length === 0) {
          return true
        }
        const query = searchTerm.toLowerCase()
        return (
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.tags?.some((tag) => tag.toLowerCase().includes(query))
        )
      })
      .sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1))
  }, [activeCategories, selectedAgent, searchTerm])

  return (
    <section className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-white">Mission Timeline</h2>
          <p className="text-sm text-gray-400">
            エージェントの進捗と主要イベントを時系列で追跡します。
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((category) => {
              const isActive = activeCategories.includes(category)
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    isActive
                      ? 'bg-miyabi-blue text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {categoryLabels[category]}
                </button>
              )
            })}
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300 focus-within:border-miyabi-blue">
            <span className="text-xs uppercase tracking-wide text-gray-500">Agent</span>
            <select
              value={selectedAgent}
              onChange={(event) => setSelectedAgent(event.target.value as typeof selectedAgent)}
              className="bg-transparent text-sm text-white outline-none"
            >
              <option value="all">All</option>
              {agents.map((agent) => (
                <option key={agent} value={agent}>
                  {agentLabels[agent] ?? agent}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm focus-within:border-miyabi-blue">
            <svg
              className="h-4 w-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
            </svg>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search timeline..."
              className="w-48 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
            />
          </label>
        </div>
      </header>

      <ol className="relative space-y-6 border-l border-gray-800 pl-6">
        {filteredEvents.map((event) => (
          <li key={event.id} className="relative">
            <span className="absolute -left-3 top-1.5 h-2.5 w-2.5 rounded-full bg-miyabi-purple" />
            <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-4 transition hover:border-gray-700">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                  <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300">
                    {categoryLabels[event.category]}
                  </span>
                  <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300">
                    {agentLabels[event.agent] ?? event.agent}
                  </span>
                </div>
                <time className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </time>
              </div>
              <p className="text-sm text-gray-300">{event.description}</p>
              {event.tags?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <span key={tag} className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {event.link ? (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm text-miyabi-blue hover:text-miyabi-purple"
                >
                  詳細を見る
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10v11h11" />
                  </svg>
                </a>
              ) : null}
            </div>
          </li>
        ))}

        {filteredEvents.length === 0 ? (
          <li className="relative text-sm text-gray-500">
            <span className="absolute -left-3 top-1.5 h-2.5 w-2.5 rounded-full bg-gray-700" />
            条件に一致するイベントがありません。
          </li>
        ) : null}
      </ol>
    </section>
  )
}
