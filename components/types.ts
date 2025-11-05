export type AgentIdentifier =
  | 'CoordinatorAgent'
  | 'CodeGenAgent'
  | 'ReviewAgent'
  | 'DeploymentAgent'
  | 'PRAgent'
  | 'IssueAgent'
  | 'RefresherAgent'
  | 'KnowledgeAgent'

export type TimelineEventCategory =
  | 'issue'
  | 'development'
  | 'review'
  | 'deployment'
  | 'knowledge'
  | 'system'

export interface TimelineEvent {
  id: string
  title: string
  description: string
  timestamp: string
  agent: AgentIdentifier
  category: TimelineEventCategory
  tags?: string[]
  link?: string
}

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface Alert {
  id: string
  title: string
  message: string
  severity: AlertSeverity
  createdAt: string
  relatedAgent?: AgentIdentifier
  link?: string
  acknowledged?: boolean
}

export interface ReferenceLink {
  id: string
  title: string
  description: string
  url: string
  category: 'protocol' | 'architecture' | 'workflow' | 'guideline'
  tags?: string[]
}
