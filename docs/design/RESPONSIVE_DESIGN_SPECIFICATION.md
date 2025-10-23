# Miyabi Web UI - Responsive Design Specification

**Version**: 1.0
**Last Updated**: 2025-10-23
**Approach**: Mobile-first responsive design

---

## Table of Contents

1. [Breakpoint System](#breakpoint-system)
2. [Layout Patterns](#layout-patterns)
3. [Navigation Patterns](#navigation-patterns)
4. [Component Adaptations](#component-adaptations)
5. [Typography Scaling](#typography-scaling)
6. [Touch Target Guidelines](#touch-target-guidelines)
7. [Performance Considerations](#performance-considerations)

---

## Breakpoint System

### Breakpoints

Following Tailwind CSS defaults:

| Breakpoint | Min Width | Max Width | Device | Usage |
|------------|-----------|-----------|--------|-------|
| `xs` (default) | 0px | 639px | Mobile phones | Single column, stacked layout |
| `sm` | 640px | 767px | Large phones, small tablets | 1-2 column hybrid |
| `md` | 768px | 1023px | Tablets, small laptops | 2-column layout |
| `lg` | 1024px | 1279px | Laptops, desktops | 3-column layout |
| `xl` | 1280px | 1535px | Large desktops | 3-4 column layout |
| `2xl` | 1536px+ | ∞ | Ultra-wide displays | 4+ column layout |

### Breakpoint Usage

```tsx
// Tailwind CSS responsive utilities
<div className="
  w-full          // Mobile: full width
  sm:w-1/2        // Small: 50% width
  md:w-1/3        // Medium: 33% width
  lg:w-1/4        // Large: 25% width
">
  Content
</div>
```

---

## Layout Patterns

### 1. Container Widths

```tsx
// Responsive container
<div className="
  container
  mx-auto
  px-4           // Mobile: 16px padding
  sm:px-6        // Small: 24px padding
  lg:px-8        // Large: 32px padding
">
  Content
</div>
```

**Effective Widths**:
- Mobile (< 640px): 100% - 32px (16px each side)
- Small (640px - 767px): 640px - 48px
- Medium (768px - 1023px): 768px - 48px
- Large (1024px+): 1024px - 64px

---

### 2. Grid Layouts

#### Dashboard Summary Cards

```tsx
<div className="
  grid
  grid-cols-1        // Mobile: 1 column
  sm:grid-cols-2     // Small: 2 columns
  lg:grid-cols-3     // Large: 3 columns
  gap-6
">
  <SummaryCard title="Running" value={3} />
  <SummaryCard title="Completed" value={45} />
  <SummaryCard title="Failed" value={2} />
</div>
```

#### Repository Cards

```tsx
<div className="
  grid
  grid-cols-1        // Mobile: 1 column
  md:grid-cols-2     // Medium: 2 columns
  xl:grid-cols-3     // XL: 3 columns
  gap-6
">
  {repositories.map(repo => <RepositoryCard key={repo.id} {...repo} />)}
</div>
```

---

### 3. Flexbox Patterns

#### Header Layout

```tsx
<header className="
  flex
  flex-col           // Mobile: vertical stack
  md:flex-row        // Medium+: horizontal
  items-center
  justify-between
  gap-4
">
  <div className="flex items-center gap-4">
    <h1>Miyabi</h1>
    <nav className="hidden md:flex gap-6">  {/* Hide nav on mobile */}
      <a href="/dashboard">Dashboard</a>
      <a href="/repositories">Repositories</a>
    </nav>
  </div>
  <div className="flex items-center gap-4">
    {/* User profile */}
  </div>
</header>
```

---

### 4. Stack Layouts

#### Form Layouts

```tsx
<div className="
  space-y-4          // Mobile: vertical spacing
  md:space-y-0       // Medium+: no vertical spacing
  md:flex            // Medium+: horizontal
  md:gap-4           // Medium+: horizontal gap
">
  <Input placeholder="Search..." className="md:flex-1" />
  <Select>
    <SelectTrigger className="md:w-[200px]">
      <SelectValue placeholder="Filter..." />
    </SelectTrigger>
  </Select>
  <Button className="w-full md:w-auto">Apply</Button>
</div>
```

---

## Navigation Patterns

### 1. Mobile Navigation (< 768px)

**Pattern**: Hamburger menu + bottom navigation

```tsx
// Header with hamburger menu
<header className="md:hidden sticky top-0 z-50 bg-white border-b">
  <div className="flex items-center justify-between px-4 py-3">
    <h1 className="text-xl font-bold">🤖 Miyabi</h1>
    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
      <Menu className="h-6 w-6" />
    </Button>
  </div>
</header>

// Mobile menu (slide-in drawer)
<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
  <SheetContent side="left">
    <nav className="flex flex-col gap-4 mt-8">
      <a href="/dashboard" className="text-lg">Dashboard</a>
      <a href="/repositories" className="text-lg">Repositories</a>
      <a href="/workflows" className="text-lg">Workflows</a>
      <Separator />
      <a href="/settings" className="text-lg">Settings</a>
      <Button variant="destructive" onClick={handleLogout}>Logout</Button>
    </nav>
  </SheetContent>
</Sheet>

// Bottom navigation (optional, for primary actions)
<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
  <div className="flex items-center justify-around py-2">
    <Button variant="ghost" size="icon">
      <Home className="h-6 w-6" />
    </Button>
    <Button variant="ghost" size="icon">
      <Folder className="h-6 w-6" />
    </Button>
    <Button variant="ghost" size="icon">
      <Workflow className="h-6 w-6" />
    </Button>
    <Button variant="ghost" size="icon">
      <Settings className="h-6 w-6" />
    </Button>
  </div>
</nav>
```

---

### 2. Desktop Navigation (≥ 768px)

**Pattern**: Horizontal header with inline links

```tsx
<header className="hidden md:block sticky top-0 z-50 bg-white border-b">
  <div className="container mx-auto px-6">
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-8">
        <h1 className="text-2xl font-bold">🤖 Miyabi</h1>
        <nav className="flex gap-6">
          <a href="/dashboard" className="hover:text-blue-600">Dashboard</a>
          <a href="/repositories" className="hover:text-blue-600">Repositories</a>
          <a href="/workflows" className="hover:text-blue-600">Workflows</a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <img src={user.avatarUrl} className="w-10 h-10 rounded-full" />
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
      </div>
    </div>
  </div>
</header>
```

---

## Component Adaptations

### 1. Table → Card List (Mobile)

**Desktop (≥ 768px)**: Table layout
**Mobile (< 768px)**: Card list

```tsx
// Desktop: Table
<div className="hidden md:block">
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
      {executions.map(exec => (
        <TableRow key={exec.id}>
          <TableCell>{exec.agentType}</TableCell>
          <TableCell>#{exec.issueNumber}</TableCell>
          <TableCell><AgentStatusIndicator status={exec.status} /></TableCell>
          <TableCell>{exec.duration}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>

// Mobile: Card list
<div className="md:hidden space-y-4">
  {executions.map(exec => (
    <Card key={exec.id}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <AgentBadge type={exec.agentType} />
          <AgentStatusIndicator status={exec.status} />
        </div>
        <p className="font-medium">Issue #{exec.issueNumber}</p>
        <p className="text-sm text-slate-600">Duration: {exec.duration}</p>
      </CardContent>
    </Card>
  ))}
</div>
```

---

### 2. Multi-Column → Single Column (Mobile)

```tsx
// Agent Execution Detail
<div className="
  grid
  grid-cols-1        // Mobile: single column
  lg:grid-cols-3     // Large: 3 columns (2:1 ratio)
  gap-6
">
  {/* Main content (execution detail) */}
  <div className="lg:col-span-2">
    <Card>
      <CardHeader>
        <CardTitle>Execution Details</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress bar, status, etc. */}
      </CardContent>
    </Card>
  </div>

  {/* Sidebar (actions, metadata) */}
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button className="w-full">View Logs</Button>
          <Button className="w-full" variant="outline">View Config</Button>
          <Button className="w-full" variant="destructive">Cancel</Button>
        </div>
      </CardContent>
    </Card>
  </div>
</div>
```

---

### 3. Sidebar → Tabs (Mobile)

```tsx
// Settings Page
// Desktop: Sidebar + content
<div className="hidden lg:grid lg:grid-cols-4 gap-6">
  {/* Sidebar */}
  <nav className="space-y-2">
    <Button variant="ghost" className="w-full justify-start">Profile</Button>
    <Button variant="ghost" className="w-full justify-start">Security</Button>
    <Button variant="ghost" className="w-full justify-start">Integrations</Button>
  </nav>

  {/* Content */}
  <div className="col-span-3">
    {/* Settings content */}
  </div>
</div>

// Mobile: Tabs
<Tabs defaultValue="profile" className="lg:hidden">
  <TabsList className="w-full">
    <TabsTrigger value="profile">Profile</TabsTrigger>
    <TabsTrigger value="security">Security</TabsTrigger>
    <TabsTrigger value="integrations">Integrations</TabsTrigger>
  </TabsList>
  <TabsContent value="profile">
    {/* Profile settings */}
  </TabsContent>
  <TabsContent value="security">
    {/* Security settings */}
  </TabsContent>
  <TabsContent value="integrations">
    {/* Integrations settings */}
  </TabsContent>
</Tabs>
```

---

### 4. Modal Adaptations

**Desktop (≥ 768px)**: Centered modal (max-width)
**Mobile (< 768px)**: Full-screen modal

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Execute Agent</Button>
  </DialogTrigger>
  <DialogContent className="
    sm:max-w-[425px]  // Desktop: max width 425px
    max-h-screen      // Mobile: full height
    sm:max-h-[90vh]   // Desktop: 90% viewport height
  ">
    <DialogHeader>
      <DialogTitle>Execute Agent</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      {/* Form fields */}
    </div>
    <DialogFooter className="
      flex-col         // Mobile: stack buttons vertically
      sm:flex-row      // Desktop: horizontal buttons
      gap-2
    ">
      <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
      <Button className="w-full sm:w-auto">Execute</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Typography Scaling

### Font Size Scaling

```tsx
// Page Title
<h1 className="
  text-2xl        // Mobile: 24px
  sm:text-3xl     // Small: 30px
  lg:text-4xl     // Large: 36px
  font-bold
">
  Dashboard
</h1>

// Section Title
<h2 className="
  text-xl         // Mobile: 20px
  sm:text-2xl     // Small: 24px
  font-semibold
">
  Recent Executions
</h2>

// Body Text
<p className="
  text-sm         // Mobile: 14px
  sm:text-base    // Small: 16px
  text-slate-600
">
  Description text
</p>
```

### Line Height Scaling

```tsx
// Tighter line height on mobile for space efficiency
<p className="
  leading-snug    // Mobile: 1.375
  sm:leading-normal // Desktop: 1.5
">
  Long paragraph text...
</p>
```

---

## Touch Target Guidelines

### Minimum Touch Target Size

**WCAG 2.5.5**: All interactive elements should have a minimum target size of 44x44px.

```tsx
// Button minimum size
<Button size="lg" className="
  min-h-[44px]     // Minimum 44px height
  px-6             // Adequate horizontal padding
">
  Execute Agent
</Button>

// Icon button minimum size
<Button variant="ghost" size="icon" className="
  h-12 w-12        // 48x48px (exceeds 44px minimum)
">
  <Settings className="h-5 w-5" />
</Button>

// Mobile navigation items
<nav className="md:hidden">
  <a href="/dashboard" className="
    block
    py-3             // 12px top + 12px bottom = 24px
    text-lg          // Larger text for readability
    min-h-[44px]     // Minimum touch target
  ">
    Dashboard
  </a>
</nav>
```

### Spacing Between Touch Targets

```tsx
// Adequate spacing between buttons
<div className="
  flex
  flex-col          // Mobile: stack vertically
  sm:flex-row       // Desktop: horizontal
  gap-3             // 12px gap (adequate for touch)
">
  <Button>Primary</Button>
  <Button variant="outline">Secondary</Button>
</div>
```

---

## Performance Considerations

### 1. Image Optimization

```tsx
import Image from 'next/image';

// Responsive images
<Image
  src={user.avatarUrl}
  alt={user.name}
  width={40}
  height={40}
  className="
    w-8 h-8         // Mobile: 32x32px
    md:w-10 md:h-10 // Desktop: 40x40px
    rounded-full
  "
  loading="lazy"   // Lazy load images
  quality={75}     // Optimize quality
/>
```

---

### 2. Conditional Rendering

**Hide non-essential content on mobile**:

```tsx
// Hide detailed metadata on mobile
<div className="hidden sm:block">
  <p className="text-sm text-slate-600">
    Created: {formatDate(createdAt)}
  </p>
  <p className="text-sm text-slate-600">
    Last updated: {formatDate(updatedAt)}
  </p>
</div>
```

---

### 3. Progressive Enhancement

**Load WebSocket features only on desktop**:

```tsx
const isDesktop = useMediaQuery('(min-width: 768px)');

useEffect(() => {
  if (isDesktop) {
    // Connect to WebSocket for live updates
    const ws = new WebSocket(WS_URL);
    // ...
  }
}, [isDesktop]);
```

---

### 4. Lazy Loading Components

```tsx
import dynamic from 'next/dynamic';

// Lazy load workflow builder (heavy component) only when needed
const WorkflowBuilder = dynamic(
  () => import('@/components/workflow/WorkflowBuilder'),
  { ssr: false }
);

function WorkflowNewPage() {
  return (
    <div>
      <h1>Create Workflow</h1>
      <WorkflowBuilder />
    </div>
  );
}
```

---

## Testing Checklist

### Responsive Testing

- [ ] Test all breakpoints (640px, 768px, 1024px, 1280px, 1536px)
- [ ] Test orientation changes (portrait/landscape)
- [ ] Test touch interactions on mobile devices
- [ ] Test keyboard navigation on desktop
- [ ] Verify minimum touch target sizes (44x44px)
- [ ] Test with browser zoom (up to 200%)
- [ ] Test with slow network (3G throttling)

### Device Testing

- [ ] iPhone SE (375px) - Small mobile
- [ ] iPhone 14 Pro (393px) - Standard mobile
- [ ] iPhone 14 Pro Max (430px) - Large mobile
- [ ] iPad Mini (768px) - Small tablet
- [ ] iPad Pro (1024px) - Large tablet
- [ ] MacBook Air (1280px) - Small laptop
- [ ] MacBook Pro (1440px) - Standard laptop
- [ ] iMac 27" (2560px) - Large desktop

### Browser Testing

- [ ] Chrome (Desktop + Mobile)
- [ ] Safari (Desktop + iOS)
- [ ] Firefox (Desktop + Mobile)
- [ ] Edge (Desktop)

---

## Accessibility Considerations

### Focus Indicators

```tsx
// Visible focus ring on all interactive elements
<Button className="
  focus-visible:ring-2
  focus-visible:ring-blue-600
  focus-visible:ring-offset-2
">
  Click me
</Button>
```

### Skip Links

```tsx
// Skip to main content (mobile-friendly)
<a
  href="#main-content"
  className="
    sr-only
    focus:not-sr-only
    focus:absolute
    focus:top-4
    focus:left-4
    focus:z-50
    focus:px-4
    focus:py-2
    focus:bg-blue-600
    focus:text-white
    focus:rounded
  "
>
  Skip to main content
</a>

<main id="main-content">
  {/* Page content */}
</main>
```

---

## Version History

- **v1.0** (2025-10-23) - Initial responsive design specification
  - Breakpoint system defined
  - Layout patterns documented
  - Navigation patterns (mobile/desktop) specified
  - Component adaptations detailed
  - Typography scaling rules
  - Touch target guidelines (WCAG 2.5.5)
  - Performance considerations
  - Testing checklist

---

## References

- **Tailwind CSS Responsive Design**: https://tailwindcss.com/docs/responsive-design
- **WCAG 2.1 Touch Target Size**: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
- **Next.js Image Optimization**: https://nextjs.org/docs/app/building-your-application/optimizing/images
- **React Flow Responsive**: https://reactflow.dev/examples/layout/responsive-flow
