'use client'

import { useMemo, useState } from 'react'
import { alerts } from './mock-data'
import type { Alert, AlertSeverity } from './types'

const severityLabels: Record<AlertSeverity, string> = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical'
}

const severityStyles: Record<AlertSeverity, string> = {
  info: 'bg-miyabi-blue/10 text-miyabi-blue border-miyabi-blue/40',
  warning: 'bg-yellow-500/10 text-yellow-300 border-yellow-400/40',
  critical: 'bg-miyabi-red/10 text-miyabi-red border-miyabi-red/40'
}

export function AlertsPanel() {
  const [activeSeverities, setActiveSeverities] = useState<AlertSeverity[]>(['critical', 'warning', 'info'])
  const [showAcknowledged, setShowAcknowledged] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const toggleSeverity = (severity: AlertSeverity) => {
    setActiveSeverities((current) =>
      current.includes(severity)
        ? current.filter((item) => item !== severity)
        : [...current, severity]
    )
  }

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((alert) => {
        if (activeSeverities.length && !activeSeverities.includes(alert.severity)) {
          return false
        }
        if (!showAcknowledged && alert.acknowledged) {
          return false
        }
        if (searchTerm.trim().length === 0) {
          return true
        }
        const query = searchTerm.toLowerCase()
        return (
          alert.title.toLowerCase().includes(query) ||
          alert.message.toLowerCase().includes(query) ||
          alert.relatedAgent?.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
  }, [activeSeverities, showAcknowledged, searchTerm])

  return (
    <section className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-white">Alerts</h2>
          <p className="text-sm text-gray-400">リアルタイム通知と重要な注意事項の一覧です。</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(severityLabels) as AlertSeverity[]).map((severity) => {
              const active = activeSeverities.includes(severity)
              return (
                <button
                  key={severity}
                  type="button"
                  onClick={() => toggleSeverity(severity)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? severityStyles[severity]
                      : 'border border-gray-800 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {severityLabels[severity]}
                </button>
              )
            })}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={showAcknowledged}
              onChange={(event) => setShowAcknowledged(event.target.checked)}
              className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-miyabi-blue focus:ring-miyabi-blue"
            />
            Acknowledged
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
              placeholder="Search alerts..."
              className="w-48 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
            />
          </label>
        </div>
      </header>

      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <article
            key={alert.id}
            className={`rounded-xl border bg-gray-950/50 p-4 transition hover:border-gray-700 ${
              severityStyles[alert.severity]
            }`}
          >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{alert.title}</h3>
                <p className="text-sm text-gray-300">{alert.message}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                  <span className="rounded-full border border-gray-800 px-2 py-1">
                    Severity: {severityLabels[alert.severity]}
                  </span>
                  {alert.relatedAgent ? (
                    <span className="rounded-full border border-gray-800 px-2 py-1">
                      Agent: {alert.relatedAgent}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-gray-800 px-2 py-1">
                    {alert.acknowledged ? 'Acknowledged' : 'Action Required'}
                  </span>
                </div>
              </div>
              <time className="text-xs text-gray-500">
                {new Date(alert.createdAt).toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
            </div>
            {alert.link ? (
              <a
                href={alert.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-miyabi-blue hover:text-miyabi-purple"
              >
                詳細を開く
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10v11h11" />
                </svg>
              </a>
            ) : null}
          </article>
        ))}

        {filteredAlerts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-700 bg-gray-950/60 p-6 text-center text-sm text-gray-500">
            条件に一致するアラートはありません。
          </p>
        ) : null}
      </div>
    </section>
  )
}
