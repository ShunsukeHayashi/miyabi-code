import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
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
  Select,
  SelectItem,
  Tab,
  Tabs,
  Tooltip,
  useDisclosure,
} from '@heroui/react'
import {
  Building2,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Crown,
  LogOut,
  Mail,
  MoreVertical,
  Plus,
  Settings,
  Shield,
  Trash2,
  User,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { handleApiError } from '@/lib/api/client'

// Types
interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string
  plan_tier: 'free' | 'pro' | 'enterprise'
  created_at: Date
  member_count: number
  role: 'owner' | 'admin' | 'member' | 'viewer'
  avatar_url?: string
}

interface OrganizationMember {
  id: string
  user_id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joined_at: Date
}

interface Invitation {
  id: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  invited_by: string
  expires_at: Date
}

// Mock Data
const mockOrganizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Miyabi Labs',
    slug: 'miyabi-labs',
    owner_id: 'user-1',
    plan_tier: 'enterprise',
    created_at: new Date('2024-01-15'),
    member_count: 12,
    role: 'owner',
    avatar_url: undefined,
  },
  {
    id: 'org-2',
    name: 'Development Team',
    slug: 'dev-team',
    owner_id: 'user-2',
    plan_tier: 'pro',
    created_at: new Date('2024-06-20'),
    member_count: 5,
    role: 'admin',
    avatar_url: undefined,
  },
  {
    id: 'org-3',
    name: 'Customer Success',
    slug: 'customer-success',
    owner_id: 'user-3',
    plan_tier: 'free',
    created_at: new Date('2024-09-10'),
    member_count: 3,
    role: 'member',
    avatar_url: undefined,
  },
]

const mockMembers: OrganizationMember[] = [
  {
    id: 'member-1',
    user_id: 'user-1',
    email: 'owner@miyabi.dev',
    full_name: 'Shunsuke Hayashi',
    role: 'owner',
    joined_at: new Date('2024-01-15'),
  },
  {
    id: 'member-2',
    user_id: 'user-2',
    email: 'admin@miyabi.dev',
    full_name: 'Yuki Tanaka',
    role: 'admin',
    joined_at: new Date('2024-02-20'),
  },
  {
    id: 'member-3',
    user_id: 'user-3',
    email: 'dev@miyabi.dev',
    full_name: 'Ken Yamamoto',
    role: 'member',
    joined_at: new Date('2024-03-15'),
  },
  {
    id: 'member-4',
    user_id: 'user-4',
    email: 'viewer@miyabi.dev',
    full_name: 'Sakura Ito',
    role: 'viewer',
    joined_at: new Date('2024-04-10'),
  },
]

const mockInvitations: Invitation[] = [
  {
    id: 'inv-1',
    email: 'newuser@example.com',
    role: 'member',
    invited_by: 'Shunsuke Hayashi',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
]

// Helper functions
const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'owner':
      return 'warning'
    case 'admin':
      return 'secondary'
    case 'member':
      return 'primary'
    case 'viewer':
      return 'default'
    default:
      return 'default'
  }
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'owner':
      return <Crown className="w-3 h-3" />
    case 'admin':
      return <Shield className="w-3 h-3" />
    case 'member':
      return <User className="w-3 h-3" />
    case 'viewer':
      return <User className="w-3 h-3" />
    default:
      return null
  }
}

const getPlanBadgeColor = (plan: string) => {
  switch (plan) {
    case 'enterprise':
      return 'warning'
    case 'pro':
      return 'secondary'
    case 'free':
      return 'default'
    default:
      return 'default'
  }
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('members')

  // Modals
  const createOrgModal = useDisclosure()
  const inviteMemberModal = useDisclosure()
  const settingsModal = useDisclosure()
  const deleteModal = useDisclosure()
  const leaveModal = useDisclosure()

  // Form states
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgSlug, setNewOrgSlug] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('member')
  const [editOrgName, setEditOrgName] = useState('')
  const [editOrgSlug, setEditOrgSlug] = useState('')
  const [copiedSlug, setCopiedSlug] = useState(false)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))
        setOrganizations(mockOrganizations)
        setCurrentOrganization(mockOrganizations[0])
        setSelectedOrganization(mockOrganizations[0])
        setMembers(mockMembers)
        setInvitations(mockInvitations)
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Update members when selected org changes
  useEffect(() => {
    if (selectedOrganization) {
      setEditOrgName(selectedOrganization.name)
      setEditOrgSlug(selectedOrganization.slug)
    }
  }, [selectedOrganization])

  // Handlers
  const handleCreateOrganization = () => {
    if (!newOrgName.trim()) return

    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: newOrgName,
      slug: newOrgSlug || newOrgName.toLowerCase().replace(/\s+/g, '-'),
      owner_id: 'current-user',
      plan_tier: 'free',
      created_at: new Date(),
      member_count: 1,
      role: 'owner',
    }

    setOrganizations([...organizations, newOrg])
    setSelectedOrganization(newOrg)
    setNewOrgName('')
    setNewOrgSlug('')
    createOrgModal.onClose()
  }

  const handleInviteMember = () => {
    if (!inviteEmail.trim()) return

    const newInvitation: Invitation = {
      id: `inv-${Date.now()}`,
      email: inviteEmail,
      role: inviteRole as 'admin' | 'member' | 'viewer',
      invited_by: 'Current User',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }

    setInvitations([...invitations, newInvitation])
    setInviteEmail('')
    setInviteRole('member')
    inviteMemberModal.onClose()
  }

  const handleUpdateOrganization = () => {
    if (!selectedOrganization || !editOrgName.trim()) return

    const updatedOrgs = organizations.map((org) =>
      org.id === selectedOrganization.id
        ? { ...org, name: editOrgName, slug: editOrgSlug }
        : org
    )

    setOrganizations(updatedOrgs)
    setSelectedOrganization({
      ...selectedOrganization,
      name: editOrgName,
      slug: editOrgSlug,
    })
    settingsModal.onClose()
  }

  const handleDeleteOrganization = () => {
    if (!selectedOrganization) return

    const filteredOrgs = organizations.filter((org) => org.id !== selectedOrganization.id)
    setOrganizations(filteredOrgs)
    setSelectedOrganization(filteredOrgs[0] || null)
    deleteModal.onClose()
  }

  const handleLeaveOrganization = () => {
    if (!selectedOrganization) return

    const filteredOrgs = organizations.filter((org) => org.id !== selectedOrganization.id)
    setOrganizations(filteredOrgs)
    setSelectedOrganization(filteredOrgs[0] || null)
    leaveModal.onClose()
  }

  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId))
  }

  const handleUpdateMemberRole = (memberId: string, newRole: string) => {
    setMembers(
      members.map((m) =>
        m.id === memberId ? { ...m, role: newRole as OrganizationMember['role'] } : m
      )
    )
  }

  const handleCancelInvitation = (invitationId: string) => {
    setInvitations(invitations.filter((i) => i.id !== invitationId))
  }

  const handleSwitchOrganization = (org: Organization) => {
    setCurrentOrganization(org)
    setSelectedOrganization(org)
  }

  const copySlug = () => {
    if (selectedOrganization) {
      navigator.clipboard.writeText(selectedOrganization.slug)
      setCopiedSlug(true)
      setTimeout(() => setCopiedSlug(false), 2000)
    }
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
        <div>
          <h1 className="text-2xl font-bold text-white">Organizations</h1>
          <p className="text-gray-400 mt-1">Manage your organizations and team members</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Organization Switcher */}
          <Dropdown>
            <DropdownTrigger>
              <Button variant="flat" className="bg-white/5" endContent={<ChevronDown size={16} />}>
                <Building2 size={16} className="mr-2" />
                {currentOrganization?.name || 'Select Organization'}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Organization switcher"
              onAction={(key) => {
                const org = organizations.find((o) => o.id === key)
                if (org) handleSwitchOrganization(org)
              }}
            >
              {organizations.map((org) => (
                <DropdownItem
                  key={org.id}
                  startContent={<Building2 size={16} />}
                  endContent={
                    org.id === currentOrganization?.id ? <Check size={16} className="text-cyan-400" /> : null
                  }
                >
                  {org.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          <Button
            color="primary"
            startContent={<Plus size={16} />}
            onPress={createOrgModal.onOpen}
          >
            New Organization
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Organization List */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <h2 className="text-lg font-semibold text-white">Your Organizations</h2>

          {organizations.map((org) => (
            <Card
              key={org.id}
              isPressable
              isHoverable
              className={`bg-white/5 border transition-all ${
                selectedOrganization?.id === org.id
                  ? 'border-cyan-500/50 bg-cyan-500/5'
                  : 'border-white/10'
              }`}
              onPress={() => setSelectedOrganization(org)}
            >
              <CardBody className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={org.name.charAt(0)}
                      size="md"
                      className="bg-gradient-to-br from-cyan-500 to-purple-600"
                    />
                    <div>
                      <p className="font-semibold text-white">{org.name}</p>
                      <p className="text-sm text-gray-400">/{org.slug}</p>
                    </div>
                  </div>
                  <Chip size="sm" variant="flat" color={getRoleBadgeColor(org.role) as any} startContent={getRoleIcon(org.role)}>
                    {org.role}
                  </Chip>
                </div>

                <div className="flex items-center justify-between mt-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Users size={14} />
                    <span>{org.member_count} members</span>
                  </div>
                  <Chip size="sm" variant="dot" color={getPlanBadgeColor(org.plan_tier) as any}>
                    {org.plan_tier}
                  </Chip>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Organization Details */}
        <div className="col-span-12 lg:col-span-8">
          {selectedOrganization ? (
            <Card className="bg-white/5 border border-white/10">
              <CardHeader className="flex justify-between items-start p-6">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={selectedOrganization.name.charAt(0)}
                    size="lg"
                    className="bg-gradient-to-br from-cyan-500 to-purple-600"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedOrganization.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                        /{selectedOrganization.slug}
                      </code>
                      <Tooltip content={copiedSlug ? 'Copied!' : 'Copy slug'}>
                        <Button isIconOnly size="sm" variant="light" onPress={copySlug}>
                          {copiedSlug ? <Check size={14} /> : <Copy size={14} />}
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Chip color={getPlanBadgeColor(selectedOrganization.plan_tier) as any} variant="flat">
                    {selectedOrganization.plan_tier.toUpperCase()}
                  </Chip>

                  {(selectedOrganization.role === 'owner' || selectedOrganization.role === 'admin') && (
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly variant="light" size="sm">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Organization actions">
                        <DropdownItem
                          key="settings"
                          startContent={<Settings size={16} />}
                          onPress={settingsModal.onOpen}
                        >
                          Settings
                        </DropdownItem>
                        {selectedOrganization.role !== 'owner' ? (
                          <DropdownItem
                            key="leave"
                            startContent={<LogOut size={16} />}
                            className="text-warning"
                            color="warning"
                            onPress={leaveModal.onOpen}
                          >
                            Leave Organization
                          </DropdownItem>
                        ) : (
                          <DropdownItem
                            key="delete"
                            startContent={<Trash2 size={16} />}
                            className="text-danger"
                            color="danger"
                            onPress={deleteModal.onOpen}
                          >
                            Delete Organization
                          </DropdownItem>
                        )}
                      </DropdownMenu>
                    </Dropdown>
                  )}
                </div>
              </CardHeader>

              <Divider className="bg-white/10" />

              <CardBody className="p-6">
                <Tabs
                  selectedKey={activeTab}
                  onSelectionChange={(key) => setActiveTab(key as string)}
                  variant="underlined"
                  classNames={{
                    tabList: 'gap-6',
                    cursor: 'bg-cyan-500',
                    tab: 'px-0 h-12',
                  }}
                >
                  <Tab
                    key="members"
                    title={
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        <span>Members</span>
                        <Badge content={members.length} size="sm" color="primary">
                          <span />
                        </Badge>
                      </div>
                    }
                  >
                    <div className="mt-4 space-y-4">
                      {/* Invite Button */}
                      {(selectedOrganization.role === 'owner' ||
                        selectedOrganization.role === 'admin') && (
                        <Button
                          color="primary"
                          variant="flat"
                          startContent={<UserPlus size={16} />}
                          onPress={inviteMemberModal.onOpen}
                        >
                          Invite Member
                        </Button>
                      )}

                      {/* Members List */}
                      <div className="space-y-3">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={member.full_name.charAt(0)}
                                size="sm"
                                src={member.avatar_url}
                              />
                              <div>
                                <p className="font-medium text-white">{member.full_name}</p>
                                <p className="text-sm text-gray-400">{member.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {(selectedOrganization.role === 'owner' ||
                                selectedOrganization.role === 'admin') &&
                              member.role !== 'owner' ? (
                                <Select
                                  size="sm"
                                  selectedKeys={[member.role]}
                                  className="w-32"
                                  aria-label={`Change role for ${member.full_name}`}
                                  onSelectionChange={(keys) => {
                                    const newRole = Array.from(keys)[0] as string
                                    handleUpdateMemberRole(member.id, newRole)
                                  }}
                                >
                                  <SelectItem key="admin">Admin</SelectItem>
                                  <SelectItem key="member">Member</SelectItem>
                                  <SelectItem key="viewer">Viewer</SelectItem>
                                </Select>
                              ) : (
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color={getRoleBadgeColor(member.role) as any}
                                  startContent={getRoleIcon(member.role)}
                                >
                                  {member.role}
                                </Chip>
                              )}

                              {(selectedOrganization.role === 'owner' ||
                                selectedOrganization.role === 'admin') &&
                                member.role !== 'owner' && (
                                  <Tooltip content="Remove member">
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      color="danger"
                                      onPress={() => handleRemoveMember(member.id)}
                                    >
                                      <UserMinus size={14} />
                                    </Button>
                                  </Tooltip>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Tab>

                  <Tab
                    key="invitations"
                    title={
                      <div className="flex items-center gap-2">
                        <Mail size={16} />
                        <span>Pending Invitations</span>
                        {invitations.length > 0 && (
                          <Badge content={invitations.length} size="sm" color="warning">
                            <span />
                          </Badge>
                        )}
                      </div>
                    }
                  >
                    <div className="mt-4 space-y-3">
                      {invitations.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No pending invitations</p>
                      ) : (
                        invitations.map((invitation) => (
                          <div
                            key={invitation.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <Mail size={14} className="text-gray-400" />
                              </div>
                              <div>
                                <p className="font-medium text-white">{invitation.email}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <span>Invited by {invitation.invited_by}</span>
                                  <span>·</span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    Expires{' '}
                                    {new Date(invitation.expires_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Chip size="sm" variant="flat">
                                {invitation.role}
                              </Chip>
                              <Tooltip content="Cancel invitation">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  onPress={() => handleCancelInvitation(invitation.id)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </Tooltip>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Tab>

                  <Tab
                    key="activity"
                    title={
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>Activity</span>
                      </div>
                    }
                  >
                    <div className="mt-4">
                      <p className="text-gray-400 text-center py-8">
                        Activity log coming soon...
                      </p>
                    </div>
                  </Tab>
                </Tabs>
              </CardBody>

              <CardFooter className="p-4 bg-white/5 text-sm text-gray-400">
                Created on {new Date(selectedOrganization.created_at).toLocaleDateString()}
              </CardFooter>
            </Card>
          ) : (
            <Card className="bg-white/5 border border-white/10">
              <CardBody className="p-12 text-center">
                <Building2 size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400">Select an organization to view details</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Create Organization Modal */}
      <Modal isOpen={createOrgModal.isOpen} onClose={createOrgModal.onClose}>
        <ModalContent className="bg-[#1a1a24] border border-white/10">
          <ModalHeader>Create New Organization</ModalHeader>
          <ModalBody>
            <Input
              label="Organization Name"
              placeholder="My Organization"
              value={newOrgName}
              onValueChange={setNewOrgName}
            />
            <Input
              label="Slug (URL-friendly name)"
              placeholder="my-organization"
              value={newOrgSlug}
              onValueChange={setNewOrgSlug}
              description="Used in URLs and API calls"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={createOrgModal.onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleCreateOrganization}>
              Create Organization
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Invite Member Modal */}
      <Modal isOpen={inviteMemberModal.isOpen} onClose={inviteMemberModal.onClose}>
        <ModalContent className="bg-[#1a1a24] border border-white/10">
          <ModalHeader>Invite Member</ModalHeader>
          <ModalBody>
            <Input
              label="Email Address"
              placeholder="user@example.com"
              type="email"
              value={inviteEmail}
              onValueChange={setInviteEmail}
            />
            <Select
              label="Role"
              selectedKeys={[inviteRole]}
              onSelectionChange={(keys) => setInviteRole(Array.from(keys)[0] as string)}
            >
              <SelectItem key="admin" startContent={<Shield size={16} />}>
                Admin
              </SelectItem>
              <SelectItem key="member" startContent={<User size={16} />}>
                Member
              </SelectItem>
              <SelectItem key="viewer" startContent={<User size={16} />}>
                Viewer
              </SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={inviteMemberModal.onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleInviteMember}>
              Send Invitation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={settingsModal.isOpen} onClose={settingsModal.onClose}>
        <ModalContent className="bg-[#1a1a24] border border-white/10">
          <ModalHeader>Organization Settings</ModalHeader>
          <ModalBody>
            <Input
              label="Organization Name"
              value={editOrgName}
              onValueChange={setEditOrgName}
            />
            <Input
              label="Slug"
              value={editOrgSlug}
              onValueChange={setEditOrgSlug}
              description="Changing the slug may break existing links"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={settingsModal.onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleUpdateOrganization}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent className="bg-[#1a1a24] border border-white/10">
          <ModalHeader className="text-danger">Delete Organization</ModalHeader>
          <ModalBody>
            <p className="text-gray-300">
              Are you sure you want to delete <strong>{selectedOrganization?.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone. All members will lose access and all data will be
              permanently deleted.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={deleteModal.onClose}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleDeleteOrganization}>
              Delete Organization
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Leave Confirmation Modal */}
      <Modal isOpen={leaveModal.isOpen} onClose={leaveModal.onClose}>
        <ModalContent className="bg-[#1a1a24] border border-white/10">
          <ModalHeader className="text-warning">Leave Organization</ModalHeader>
          <ModalBody>
            <p className="text-gray-300">
              Are you sure you want to leave <strong>{selectedOrganization?.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              You will lose access to all organization resources. You will need to be
              re-invited to rejoin.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={leaveModal.onClose}>
              Cancel
            </Button>
            <Button color="warning" onPress={handleLeaveOrganization}>
              Leave Organization
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
