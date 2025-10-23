# Miyabi Web UI - Component Specification

**Version**: 1.0
**Last Updated**: 2025-10-23
**Component Library**: shadcn/ui (New York style)

---

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Core Components](#core-components)
3. [Layout Components](#layout-components)
4. [Agent-Specific Components](#agent-specific-components)
5. [Data Display Components](#data-display-components)
6. [Form Components](#form-components)
7. [Feedback Components](#feedback-components)
8. [Installation Guide](#installation-guide)

---

## Component Architecture

### Component Library Stack

```
shadcn/ui (Base UI primitives)
    ↓
Radix UI (Accessible primitives)
    ↓
Tailwind CSS (Styling)
    ↓
React 18 (Component framework)
```

### Component Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   │
│   ├── layout/          # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Container.tsx
│   │
│   ├── agent/           # Agent-specific components
│   │   ├── AgentBadge.tsx
│   │   ├── AgentExecutionCard.tsx
│   │   ├── AgentProgressBar.tsx
│   │   └── AgentStatusIndicator.tsx
│   │
│   └── dashboard/       # Dashboard-specific components
│       ├── SummaryCard.tsx
│       ├── ExecutionList.tsx
│       └── QuickActions.tsx
```

---

## Core Components

### 1. Button

**Source**: `src/components/ui/button.tsx` (shadcn/ui)

**Variants**:
- `default` - Primary action (blue background)
- `destructive` - Dangerous action (red background)
- `outline` - Secondary action (border only)
- `secondary` - Tertiary action (subtle background)
- `ghost` - Minimal action (hover only)
- `link` - Text link style

**Sizes**:
- `sm` - Small (px-3 py-1.5, text-sm)
- `default` - Default (px-4 py-2, text-base)
- `lg` - Large (px-6 py-3, text-lg)
- `icon` - Icon only (square, p-2)

**Usage**:
```tsx
import { Button } from '@/components/ui/button';

// Primary action
<Button>Execute Agent</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// With icon
<Button>
  <Github className="mr-2 h-4 w-4" />
  Sign in with GitHub
</Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>

// Icon button
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

**Props**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}
```

---

### 2. Card

**Source**: `src/components/ui/card.tsx` (shadcn/ui)

**Sub-components**:
- `Card` - Container
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardDescription` - Description text
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Usage**:
```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Agent Execution</CardTitle>
    <CardDescription>CodeGenAgent - Issue #270</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Status: Running</p>
    <p>Progress: 65%</p>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

**Variants**:
```tsx
// Elevated card (hover effect)
<Card className="hover:shadow-md transition-shadow cursor-pointer">
  Content
</Card>

// Status card with colored border
<Card className="border-l-4 border-l-blue-500 bg-blue-50">
  Agent Running...
</Card>

// Compact card
<Card className="p-4">
  Compact content
</Card>
```

---

### 3. Input

**Source**: `src/components/ui/input.tsx` (shadcn/ui)

**Usage**:
```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Basic input
<div className="space-y-2">
  <Label htmlFor="name">Name</Label>
  <Input id="name" placeholder="Enter your name" />
</div>

// With icon
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
  <Input className="pl-10" placeholder="Search..." />
</div>

// Disabled
<Input disabled value="Read-only value" />

// Error state
<Input className="border-red-500 focus:ring-red-500" />
```

---

### 4. Badge

**Source**: `src/components/ui/badge.tsx` (shadcn/ui)

**Variants**:
- `default` - Neutral (slate)
- `secondary` - Subtle (slate lighter)
- `destructive` - Error/danger (red)
- `outline` - Bordered

**Usage**:
```tsx
import { Badge } from '@/components/ui/badge';

// Status badges
<Badge className="bg-green-100 text-green-800 border-green-300">
  Completed
</Badge>

<Badge className="bg-amber-100 text-amber-800 border-amber-300">
  Running
</Badge>

<Badge className="bg-red-100 text-red-800 border-red-300">
  Failed
</Badge>

// Agent type badge
<Badge className="bg-blue-100 text-blue-800 border-blue-300">
  CodeGenAgent
</Badge>

// Priority badge
<Badge variant="destructive">P0 - Critical</Badge>
```

---

### 5. Table

**Source**: `src/components/ui/table.tsx` (shadcn/ui)

**Sub-components**:
- `Table` - Container
- `TableHeader` - Header section
- `TableBody` - Body section
- `TableRow` - Row
- `TableHead` - Header cell
- `TableCell` - Data cell
- `TableCaption` - Caption

**Usage**:
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Agent</TableHead>
      <TableHead>Issue</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Duration</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>CodeGenAgent</TableCell>
      <TableCell>#270</TableCell>
      <TableCell>
        <Badge className="bg-green-100">Completed</Badge>
      </TableCell>
      <TableCell>5m 30s</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

### 6. Dialog (Modal)

**Source**: `src/components/ui/dialog.tsx` (shadcn/ui)

**Sub-components**:
- `Dialog` - Root
- `DialogTrigger` - Trigger button
- `DialogContent` - Modal content
- `DialogHeader` - Header section
- `DialogTitle` - Title
- `DialogDescription` - Description
- `DialogFooter` - Footer section

**Usage**:
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Execute Agent</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Execute Agent</DialogTitle>
      <DialogDescription>
        Select an agent type and configure options.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      {/* Form fields here */}
    </div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Execute</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 7. Select

**Source**: `src/components/ui/select.tsx` (shadcn/ui)

**Usage**:
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select agent" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="codegen">CodeGenAgent</SelectItem>
    <SelectItem value="review">ReviewAgent</SelectItem>
    <SelectItem value="deploy">DeploymentAgent</SelectItem>
  </SelectContent>
</Select>
```

---

### 8. Tabs

**Source**: `src/components/ui/tabs.tsx` (shadcn/ui)

**Usage**:
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="connected">
  <TabsList>
    <TabsTrigger value="connected">Connected</TabsTrigger>
    <TabsTrigger value="available">Available</TabsTrigger>
  </TabsList>
  <TabsContent value="connected">
    {/* Connected repositories */}
  </TabsContent>
  <TabsContent value="available">
    {/* Available repositories */}
  </TabsContent>
</Tabs>
```

---

## Layout Components

### 1. Header

**File**: `src/components/Header.tsx` (custom)

**Usage**:
```tsx
import Header from '@/components/Header';

<Header />
```

**Features**:
- Miyabi logo
- Navigation links (Dashboard, Repositories, Workflows)
- User profile dropdown
- Logout button

**Structure**:
```tsx
<header className="bg-white border-b border-gray-200">
  <div className="px-6 py-4 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <h1>🤖 Miyabi</h1>
      <nav>
        <a href="/dashboard">Dashboard</a>
        <a href="/dashboard/repositories">Repositories</a>
        <a href="/dashboard/workflows">Workflows</a>
      </nav>
    </div>
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p>{user.name}</p>
        <p>@{user.githubId}</p>
      </div>
      <img src={user.avatarUrl} className="w-10 h-10 rounded-full" />
      <Button onClick={handleLogout}>Logout</Button>
    </div>
  </div>
</header>
```

---

### 2. Container

**File**: `src/components/layout/Container.tsx` (custom)

**Usage**:
```tsx
import Container from '@/components/layout/Container';

<Container>
  <h1>Page Content</h1>
</Container>
```

**Implementation**:
```tsx
export function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </div>
  );
}
```

---

### 3. PageHeader

**File**: `src/components/layout/PageHeader.tsx` (custom)

**Usage**:
```tsx
import PageHeader from '@/components/layout/PageHeader';

<PageHeader
  title="Repositories"
  description="Manage your connected GitHub repositories"
  action={<Button>+ Connect Repository</Button>}
/>
```

**Implementation**:
```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  backLink?: { href: string; label: string };
}

export function PageHeader({ title, description, action, backLink }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {backLink && (
        <Link href={backLink.href} className="text-sm text-slate-600 hover:text-slate-900 mb-2 inline-flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLink.label}
        </Link>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          {description && (
            <p className="mt-2 text-slate-600">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
```

---

## Agent-Specific Components

### 1. AgentBadge

**File**: `src/components/agent/AgentBadge.tsx` (custom)

**Usage**:
```tsx
import AgentBadge from '@/components/agent/AgentBadge';

<AgentBadge type="codegen" />
<AgentBadge type="review" />
<AgentBadge type="coordinator" />
```

**Implementation**:
```tsx
const AGENT_COLORS = {
  coordinator: 'bg-purple-100 text-purple-800 border-purple-300',
  codegen: 'bg-blue-100 text-blue-800 border-blue-300',
  review: 'bg-green-100 text-green-800 border-green-300',
  deployment: 'bg-orange-100 text-orange-800 border-orange-300',
  pr: 'bg-violet-100 text-violet-800 border-violet-300',
  issue: 'bg-sky-100 text-sky-800 border-sky-300',
  hooks: 'bg-pink-100 text-pink-800 border-pink-300',
} as const;

const AGENT_LABELS = {
  coordinator: 'CoordinatorAgent',
  codegen: 'CodeGenAgent',
  review: 'ReviewAgent',
  deployment: 'DeploymentAgent',
  pr: 'PRAgent',
  issue: 'IssueAgent',
  hooks: 'Hooks',
} as const;

export function AgentBadge({ type }: { type: keyof typeof AGENT_COLORS }) {
  return (
    <Badge className={AGENT_COLORS[type]}>
      {AGENT_LABELS[type]}
    </Badge>
  );
}
```

---

### 2. AgentStatusIndicator

**File**: `src/components/agent/AgentStatusIndicator.tsx` (custom)

**Usage**:
```tsx
import AgentStatusIndicator from '@/components/agent/AgentStatusIndicator';

<AgentStatusIndicator status="running" />
<AgentStatusIndicator status="completed" />
<AgentStatusIndicator status="failed" />
```

**Implementation**:
```tsx
const STATUS_CONFIG = {
  pending: {
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    icon: Clock,
    label: 'Pending',
  },
  running: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: Loader2,
    label: 'Running',
    animate: true,
  },
  completed: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    label: 'Completed',
  },
  failed: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: XCircle,
    label: 'Failed',
  },
} as const;

export function AgentStatusIndicator({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor}`}>
      <Icon className={`h-4 w-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
}
```

---

### 3. AgentProgressBar

**File**: `src/components/agent/AgentProgressBar.tsx` (custom)

**Usage**:
```tsx
import AgentProgressBar from '@/components/agent/AgentProgressBar';

<AgentProgressBar
  progress={65}
  currentStep="Running tests..."
  estimatedTimeRemaining="2 minutes"
/>
```

**Implementation**:
```tsx
interface AgentProgressBarProps {
  progress: number; // 0-100
  currentStep?: string;
  estimatedTimeRemaining?: string;
}

export function AgentProgressBar({
  progress,
  currentStep,
  estimatedTimeRemaining,
}: AgentProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">
          {currentStep || 'Processing...'}
        </span>
        <span className="text-slate-600">{progress}%</span>
      </div>
      <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {estimatedTimeRemaining && (
        <p className="text-xs text-slate-500">
          Estimated time remaining: {estimatedTimeRemaining}
        </p>
      )}
    </div>
  );
}
```

---

### 4. AgentExecutionCard

**File**: `src/components/agent/AgentExecutionCard.tsx` (custom)

**Usage**:
```tsx
import AgentExecutionCard from '@/components/agent/AgentExecutionCard';

<AgentExecutionCard
  execution={{
    id: 'exec-123',
    agentType: 'codegen',
    issueNumber: 270,
    status: 'running',
    progress: 65,
    startedAt: '2025-10-23T10:05:32Z',
  }}
  onClick={() => router.push(`/dashboard/agents/${execution.id}`)}
/>
```

**Implementation**:
```tsx
interface Execution {
  id: string;
  agentType: string;
  issueNumber: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  startedAt: string;
}

export function AgentExecutionCard({ execution, onClick }: { execution: Execution; onClick?: () => void }) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AgentBadge type={execution.agentType} />
            <div>
              <p className="font-medium text-slate-900">
                Issue #{execution.issueNumber}
              </p>
              <p className="text-sm text-slate-600">
                Started {formatDistanceToNow(new Date(execution.startedAt))} ago
              </p>
            </div>
          </div>
          <AgentStatusIndicator status={execution.status} />
        </div>
        {execution.status === 'running' && execution.progress !== undefined && (
          <div className="mt-4">
            <AgentProgressBar progress={execution.progress} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Data Display Components

### 1. SummaryCard

**File**: `src/components/dashboard/SummaryCard.tsx` (custom)

**Usage**:
```tsx
import SummaryCard from '@/components/dashboard/SummaryCard';

<SummaryCard
  title="Running"
  value={3}
  icon={<Loader2 className="h-6 w-6 animate-spin" />}
  color="amber"
/>

<SummaryCard
  title="Completed"
  value={45}
  icon={<CheckCircle className="h-6 w-6" />}
  color="green"
/>

<SummaryCard
  title="Failed"
  value={2}
  icon={<XCircle className="h-6 w-6" />}
  color="red"
/>
```

**Implementation**:
```tsx
interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'amber' | 'green' | 'red' | 'blue';
}

const COLOR_CLASSES = {
  amber: 'text-amber-600 bg-amber-50 border-amber-200',
  green: 'text-green-600 bg-green-50 border-green-200',
  red: 'text-red-600 bg-red-50 border-red-200',
  blue: 'text-blue-600 bg-blue-50 border-blue-200',
};

export function SummaryCard({ title, value, icon, color }: SummaryCardProps) {
  return (
    <Card className={`border-l-4 ${COLOR_CLASSES[color]}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          </div>
          <div className={`${COLOR_CLASSES[color]} p-3 rounded-full`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 2. ExecutionList

**File**: `src/components/dashboard/ExecutionList.tsx` (custom)

**Usage**:
```tsx
import ExecutionList from '@/components/dashboard/ExecutionList';

<ExecutionList
  executions={recentExecutions}
  onExecutionClick={(id) => router.push(`/dashboard/agents/${id}`)}
/>
```

---

## Form Components

### 1. Form (React Hook Form + Zod)

**Installation**:
```bash
npm install react-hook-form zod @hookform/resolvers
npx shadcn@latest add form
```

**Usage**:
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  agentType: z.enum(['codegen', 'review', 'deployment']),
  issueNumber: z.number().min(1),
  useWorktree: z.boolean().default(true),
});

function ExecuteAgentForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      useWorktree: true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // POST /api/agents/execute
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="agentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agent Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="codegen">CodeGenAgent</SelectItem>
                  <SelectItem value="review">ReviewAgent</SelectItem>
                  <SelectItem value="deployment">DeploymentAgent</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the agent type to execute
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Execute</Button>
      </form>
    </Form>
  );
}
```

---

## Feedback Components

### 1. Toast (Notifications)

**Installation**:
```bash
npx shadcn@latest add toast
```

**Usage**:
```tsx
import { useToast } from '@/hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();

  return (
    <Button
      onClick={() => {
        toast({
          title: "Agent execution started",
          description: "CodeGenAgent is now processing Issue #270",
        });
      }}
    >
      Execute Agent
    </Button>
  );
}
```

**Toast Variants**:
```tsx
// Success
toast({
  title: "Success",
  description: "Agent execution completed successfully",
  variant: "default",
});

// Error
toast({
  title: "Error",
  description: "Agent execution failed",
  variant: "destructive",
});

// With action
toast({
  title: "Execution completed",
  description: "PR #145 has been created",
  action: <Button size="sm">View PR</Button>,
});
```

---

### 2. Skeleton (Loading State)

**Installation**:
```bash
npx shadcn@latest add skeleton
```

**Usage**:
```tsx
import { Skeleton } from '@/components/ui/skeleton';

function LoadingCard() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}
```

---

## Installation Guide

### Install shadcn/ui Components

All components used in Miyabi Web UI must be installed via:

```bash
npx shadcn@latest add <component-name>
```

**Already Installed**:
- ✅ `button`
- ✅ `card`

**To Be Installed (as needed)**:
```bash
npx shadcn@latest add badge
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add toast
npx shadcn@latest add skeleton
npx shadcn@latest add dropdown-menu
npx shadcn@latest add popover
npx shadcn@latest add separator
npx shadcn@latest add scroll-area
npx shadcn@latest add progress
```

---

## Version History

- **v1.0** (2025-10-23) - Initial component specification
  - Core components documented (Button, Card, Input, Badge, Table, Dialog, Select, Tabs)
  - Layout components defined (Header, Container, PageHeader)
  - Agent-specific components specified (AgentBadge, AgentStatusIndicator, AgentProgressBar, AgentExecutionCard)
  - Data display components (SummaryCard, ExecutionList)
  - Form components (React Hook Form + Zod integration)
  - Feedback components (Toast, Skeleton)

---

## Next Steps

1. **Implement Custom Components** - Build agent-specific and dashboard components
2. **Storybook Setup** - Create component documentation with Storybook
3. **Component Testing** - Add unit tests with Vitest + React Testing Library
4. **Accessibility Audit** - Ensure all components meet WCAG 2.1 AA standards
