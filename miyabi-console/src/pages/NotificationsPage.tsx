import {
  Badge,
  Button,
  Card,
  CardBody,
  Checkbox,
  CheckboxGroup,
  Chip,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
  Tab,
  Tabs,
  Tooltip,
  useDisclosure,
} from '@heroui/react'
import {
  AlertTriangle,
  Archive,
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  Clock,
  Filter,
  GitPullRequest,
  Mail,
  MailOpen,
  MessageSquare,
  MoreVertical,
  Rocket,
  Search,
  Settings,
  Trash2,
  Users,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { handleApiError } from '@/lib/api/client'

// Types
type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'task_comment'
  | 'task_deadline'
  | 'agent_status'
  | 'system_alert'
  | 'mention'
  | 'organization_invite'
  | 'deployment'
  | 'backup'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  created_at: Date
  action_url?: string
  action_text?: string
}

interface NotificationPreferences {
  task_assigned: boolean
  task_completed: boolean
  task_comment: boolean
  task_deadline: boolean
  agent_status: boolean
  system_alert: boolean
  mention: boolean
  organization_invite: boolean
  deployment: boolean
  backup: boolean
  desktop_notifications: boolean
  email_digest: boolean
}

// Mock Data
const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: 'You have been assigned to "Implement auth flow" by Yuki Tanaka',
    is_read: false,
    created_at: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    action_url: '/tasks/123',
    action_text: 'View Task',
  },
  {
    id: 'notif-2',
    type: 'deployment',
    title: 'Deployment Successful',
    message: 'Production deployment completed successfully for miyabi-api v2.1.0',
    is_read: false,
    created_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    action_url: '/deployment',
    action_text: 'View Details',
  },
  {
    id: 'notif-3',
    type: 'mention',
    title: 'You were mentioned',
    message: 'Ken Yamamoto mentioned you in PR #456: "@shunsuke please review"',
    is_read: false,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    action_url: '/prs/456',
    action_text: 'View PR',
  },
  {
    id: 'notif-4',
    type: 'system_alert',
    title: 'High Memory Usage',
    message: 'Server memory usage exceeded 85% threshold on production cluster',
    is_read: true,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    action_url: '/infrastructure',
    action_text: 'Check Status',
  },
  {
    id: 'notif-5',
    type: 'agent_status',
    title: 'Agent Status Changed',
    message: 'CodeGenAgent changed status from Running to Idle',
    is_read: true,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    action_url: '/agents',
    action_text: 'View Agents',
  },
  {
    id: 'notif-6',
    type: 'task_completed',
    title: 'Task Completed',
    message: 'Task "Setup CI/CD pipeline" has been completed by Sakura Ito',
    is_read: true,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    action_url: '/tasks/120',
    action_text: 'View Task',
  },
  {
    id: 'notif-7',
    type: 'organization_invite',
    title: 'Organization Invitation',
    message: 'You have been invited to join "Acme Corp" as a Member',
    is_read: false,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    action_url: '/organizations',
    action_text: 'View Invitation',
  },
  {
    id: 'notif-8',
    type: 'task_deadline',
    title: 'Deadline Approaching',
    message: 'Task "Database migration" is due in 24 hours',
    is_read: true,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    action_url: '/tasks/115',
    action_text: 'View Task',
  },
  {
    id: 'notif-9',
    type: 'task_comment',
    title: 'New Comment',
    message: 'New comment on "API refactoring": "Looks good, please merge"',
    is_read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    action_url: '/tasks/110',
    action_text: 'View Comment',
  },
  {
    id: 'notif-10',
    type: 'backup',
    title: 'Backup Completed',
    message: 'Daily database backup completed successfully (2.4 GB)',
    is_read: true,
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 days ago
  },
]

const defaultPreferences: NotificationPreferences = {
  task_assigned: true,
  task_completed: true,
  task_comment: true,
  task_deadline: true,
  agent_status: true,
  system_alert: true,
  mention: true,
  organization_invite: true,
  deployment: true,
  backup: false,
  desktop_notifications: false,
  email_digest: false,
}

// Helper functions
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'task_assigned':
      return <Zap className="w-4 h-4 text-blue-400" />
    case 'task_completed':
      return <CheckCircle2 className="w-4 h-4 text-green-400" />
    case 'task_comment':
      return <MessageSquare className="w-4 h-4 text-purple-400" />
    case 'task_deadline':
      return <Clock className="w-4 h-4 text-amber-400" />
    case 'agent_status':
      return <Zap className="w-4 h-4 text-cyan-400" />
    case 'system_alert':
      return <AlertTriangle className="w-4 h-4 text-red-400" />
    case 'mention':
      return <MessageSquare className="w-4 h-4 text-indigo-400" />
    case 'organization_invite':
      return <Users className="w-4 h-4 text-pink-400" />
    case 'deployment':
      return <Rocket className="w-4 h-4 text-emerald-400" />
    case 'backup':
      return <Archive className="w-4 h-4 text-gray-400" />
    default:
      return <Bell className="w-4 h-4 text-gray-400" />
  }
}

const getNotificationTypeLabel = (type: NotificationType) => {
  switch (type) {
    case 'task_assigned':
      return 'Task'
    case 'task_completed':
      return 'Task'
    case 'task_comment':
      return 'Comment'
    case 'task_deadline':
      return 'Deadline'
    case 'agent_status':
      return 'Agent'
    case 'system_alert':
      return 'Alert'
    case 'mention':
      return 'Mention'
    case 'organization_invite':
      return 'Invite'
    case 'deployment':
      return 'Deploy'
    case 'backup':
      return 'Backup'
    default:
      return 'Other'
  }
}

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilters, setTypeFilters] = useState<NotificationType[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [activeTab, setActiveTab] = useState('all')

  const preferencesModal = useDisclosure()

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))
        setNotifications(mockNotifications)
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Computed values
  const unreadCount = notifications.filter((n) => !n.is_read).length

  const filteredNotifications = notifications.filter((notification) => {
    // Status filter
    if (statusFilter === 'unread' && notification.is_read) return false
    if (statusFilter === 'read' && !notification.is_read) return false

    // Type filter
    if (typeFilters.length > 0 && !typeFilters.includes(notification.type)) return false

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Handlers
  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(
      notifications.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    )
  }

  const handleMarkAsUnread = (notificationId: string) => {
    setNotifications(
      notifications.map((n) => (n.id === notificationId ? { ...n, is_read: false } : n))
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })))
  }

  const handleDelete = (notificationId: string) => {
    setNotifications(notifications.filter((n) => n.id !== notificationId))
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  const handlePreferenceChange = (key: keyof NotificationPreferences) => {
    setPreferences({ ...preferences, [key]: !preferences[key] })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <Badge content={unreadCount} color="primary" size="lg">
              <span />
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content="Mark all as read">
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              onPress={handleMarkAllAsRead}
              isDisabled={unreadCount === 0}
            >
              <CheckCheck size={18} />
            </Button>
          </Tooltip>
          <Tooltip content="Notification settings">
            <Button isIconOnly variant="flat" size="sm" onPress={preferencesModal.onOpen}>
              <Settings size={18} />
            </Button>
          </Tooltip>
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="flat" size="sm">
                <MoreVertical size={18} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="More actions">
              <DropdownItem
                key="clear"
                startContent={<Trash2 size={16} />}
                className="text-danger"
                color="danger"
                onPress={handleClearAll}
              >
                Clear all notifications
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search notifications..."
          startContent={<Search size={16} className="text-gray-400" />}
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="w-64"
          size="sm"
        />

        <Dropdown>
          <DropdownTrigger>
            <Button variant="flat" size="sm" startContent={<Filter size={14} />}>
              Status: {statusFilter === 'all' ? 'All' : statusFilter === 'unread' ? 'Unread' : 'Read'}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Status filter"
            onAction={(key) => setStatusFilter(key as 'all' | 'unread' | 'read')}
            selectedKeys={[statusFilter]}
            selectionMode="single"
          >
            <DropdownItem key="all">All</DropdownItem>
            <DropdownItem key="unread">Unread</DropdownItem>
            <DropdownItem key="read">Read</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
              size="sm"
              startContent={<Filter size={14} />}
              endContent={
                typeFilters.length > 0 ? (
                  <Chip size="sm" color="primary">
                    {typeFilters.length}
                  </Chip>
                ) : null
              }
            >
              Type
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Type filter"
            closeOnSelect={false}
            selectedKeys={typeFilters}
            selectionMode="multiple"
            onSelectionChange={(keys) => setTypeFilters(Array.from(keys) as NotificationType[])}
          >
            <DropdownItem key="task_assigned">Task Assigned</DropdownItem>
            <DropdownItem key="task_completed">Task Completed</DropdownItem>
            <DropdownItem key="task_comment">Comments</DropdownItem>
            <DropdownItem key="task_deadline">Deadlines</DropdownItem>
            <DropdownItem key="agent_status">Agent Status</DropdownItem>
            <DropdownItem key="system_alert">System Alerts</DropdownItem>
            <DropdownItem key="mention">Mentions</DropdownItem>
            <DropdownItem key="organization_invite">Invitations</DropdownItem>
            <DropdownItem key="deployment">Deployments</DropdownItem>
            <DropdownItem key="backup">Backups</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        {(typeFilters.length > 0 || statusFilter !== 'all' || searchQuery) && (
          <Button
            variant="light"
            size="sm"
            onPress={() => {
              setTypeFilters([])
              setStatusFilter('all')
              setSearchQuery('')
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Notification List */}
      <Card className="bg-white/5 border border-white/10">
        <CardBody className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <BellOff size={48} className="mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400">
                {notifications.length === 0
                  ? 'No notifications yet'
                  : 'No notifications match your filters'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-cyan-500/5 border-l-2 border-l-cyan-500' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getNotificationIcon(notification.type)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className={`font-medium truncate ${
                            notification.is_read ? 'text-gray-300' : 'text-white'
                          }`}
                        >
                          {notification.title}
                        </p>
                        <Chip size="sm" variant="flat" className="text-xs">
                          {getNotificationTypeLabel(notification.type)}
                        </Chip>
                      </div>

                      <p
                        className={`text-sm mb-2 ${
                          notification.is_read ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.created_at)}
                        </span>

                        {notification.action_url && notification.action_text && (
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            className="text-xs"
                            onPress={(e) => {
                              e.stopPropagation()
                              // Navigate to action URL
                            }}
                          >
                            {notification.action_text}
                          </Button>
                        )}
                      </div>
                    </div>

                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={(e) => e.stopPropagation()}
                        >
                          <MoreVertical size={14} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Notification actions">
                        {notification.is_read ? (
                          <DropdownItem
                            key="unread"
                            startContent={<Mail size={14} />}
                            onPress={() => handleMarkAsUnread(notification.id)}
                          >
                            Mark as unread
                          </DropdownItem>
                        ) : (
                          <DropdownItem
                            key="read"
                            startContent={<MailOpen size={14} />}
                            onPress={() => handleMarkAsRead(notification.id)}
                          >
                            Mark as read
                          </DropdownItem>
                        )}
                        <DropdownItem
                          key="delete"
                          startContent={<Trash2 size={14} />}
                          className="text-danger"
                          color="danger"
                          onPress={() => handleDelete(notification.id)}
                        >
                          Delete
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Preferences Modal */}
      <Modal isOpen={preferencesModal.isOpen} onClose={preferencesModal.onClose} size="lg">
        <ModalContent className="bg-[#1a1a24] border border-white/10">
          <ModalHeader>Notification Preferences</ModalHeader>
          <ModalBody>
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
              variant="underlined"
            >
              <Tab key="all" title="Notification Types">
                <div className="mt-4 space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400 uppercase">Tasks</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Task assigned to you</span>
                        <Switch
                          isSelected={preferences.task_assigned}
                          onValueChange={() => handlePreferenceChange('task_assigned')}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Task completed</span>
                        <Switch
                          isSelected={preferences.task_completed}
                          onValueChange={() => handlePreferenceChange('task_completed')}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Task comments</span>
                        <Switch
                          isSelected={preferences.task_comment}
                          onValueChange={() => handlePreferenceChange('task_comment')}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Deadline reminders</span>
                        <Switch
                          isSelected={preferences.task_deadline}
                          onValueChange={() => handlePreferenceChange('task_deadline')}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>

                  <Divider className="bg-white/10" />

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400 uppercase">System</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Agent status changes</span>
                        <Switch
                          isSelected={preferences.agent_status}
                          onValueChange={() => handlePreferenceChange('agent_status')}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">System alerts</span>
                        <Switch
                          isSelected={preferences.system_alert}
                          onValueChange={() => handlePreferenceChange('system_alert')}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Deployments</span>
                        <Switch
                          isSelected={preferences.deployment}
                          onValueChange={() => handlePreferenceChange('deployment')}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Backups</span>
                        <Switch
                          isSelected={preferences.backup}
                          onValueChange={() => handlePreferenceChange('backup')}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>

                  <Divider className="bg-white/10" />

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400 uppercase">Social</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mentions</span>
                        <Switch
                          isSelected={preferences.mention}
                          onValueChange={() => handlePreferenceChange('mention')}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Organization invitations</span>
                        <Switch
                          isSelected={preferences.organization_invite}
                          onValueChange={() => handlePreferenceChange('organization_invite')}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab key="delivery" title="Delivery">
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="font-medium">Desktop notifications</p>
                      <p className="text-sm text-gray-400">
                        Show browser notifications for new alerts
                      </p>
                    </div>
                    <Switch
                      isSelected={preferences.desktop_notifications}
                      onValueChange={() => handlePreferenceChange('desktop_notifications')}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="font-medium">Email digest</p>
                      <p className="text-sm text-gray-400">
                        Receive daily summary of notifications
                      </p>
                    </div>
                    <Switch
                      isSelected={preferences.email_digest}
                      onValueChange={() => handlePreferenceChange('email_digest')}
                    />
                  </div>
                </div>
              </Tab>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={preferencesModal.onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={preferencesModal.onClose}>
              Save Preferences
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
