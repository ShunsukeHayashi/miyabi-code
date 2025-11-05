import type { Meta, StoryObj } from '@storybook/react';
import ReferenceHub from './ReferenceHub';
import { mockReferences, Reference } from '@/lib/mockData';

const meta = {
  title: 'Mission Control/ReferenceHub',
  component: ReferenceHub,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    references: {
      description: 'Array of reference objects to display',
    },
  },
} satisfies Meta<typeof ReferenceHub>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with all mock references
export const Default: Story = {
  args: {
    references: mockReferences,
  },
};

// Only documentation
export const DocsOnly: Story = {
  args: {
    references: mockReferences.filter((ref) => ref.category === 'docs'),
  },
};

// Only guides
export const GuidesOnly: Story = {
  args: {
    references: mockReferences.filter((ref) => ref.category === 'guide'),
  },
};

// Only API references
export const APIOnly: Story = {
  args: {
    references: mockReferences.filter((ref) => ref.category === 'api'),
  },
};

// Empty state
export const Empty: Story = {
  args: {
    references: [],
  },
};

// Single reference
export const SingleReference: Story = {
  args: {
    references: [mockReferences[0]],
  },
};

// Many references (stress test)
const manyReferences: Reference[] = Array.from({ length: 30 }, (_, i) => ({
  id: `ref-${i}`,
  title: `Reference ${i + 1}: ${
    i % 3 === 0
      ? 'Documentation Page'
      : i % 3 === 1
        ? 'Integration Guide'
        : 'API Reference'
  }`,
  category: ['docs', 'guide', 'api'][i % 3] as Reference['category'],
  url: `https://example.com/ref-${i}`,
}));

export const ManyReferences: Story = {
  args: {
    references: manyReferences,
  },
};

// Technical documentation set
const technicalDocs: Reference[] = [
  {
    id: 'tech-1',
    title: 'Architecture Overview',
    category: 'docs',
    url: '/docs/ARCHITECTURE.md',
  },
  {
    id: 'tech-2',
    title: 'API Documentation',
    category: 'api',
    url: '/docs/API.md',
  },
  {
    id: 'tech-3',
    title: 'Database Schema',
    category: 'docs',
    url: '/docs/DATABASE.md',
  },
  {
    id: 'tech-4',
    title: 'Deployment Guide',
    category: 'guide',
    url: '/docs/DEPLOYMENT.md',
  },
];

export const TechnicalDocs: Story = {
  args: {
    references: technicalDocs,
  },
};

// User guides set
const userGuides: Reference[] = [
  {
    id: 'guide-1',
    title: 'Quick Start Guide',
    category: 'guide',
    url: '/docs/QUICKSTART.md',
  },
  {
    id: 'guide-2',
    title: 'User Manual',
    category: 'guide',
    url: '/docs/USER_MANUAL.md',
  },
  {
    id: 'guide-3',
    title: 'Tutorial: First Steps',
    category: 'guide',
    url: '/docs/TUTORIAL.md',
  },
  {
    id: 'guide-4',
    title: 'FAQ',
    category: 'guide',
    url: '/docs/FAQ.md',
  },
];

export const UserGuides: Story = {
  args: {
    references: userGuides,
  },
};

// External resources
const externalResources: Reference[] = [
  {
    id: 'ext-1',
    title: 'GitHub Repository',
    category: 'api',
    url: 'https://github.com/example/repo',
  },
  {
    id: 'ext-2',
    title: 'Slack Community',
    category: 'guide',
    url: 'https://slack.example.com',
  },
  {
    id: 'ext-3',
    title: 'REST API Reference',
    category: 'api',
    url: 'https://api.example.com/docs',
  },
  {
    id: 'ext-4',
    title: 'Getting Started Video',
    category: 'guide',
    url: 'https://youtube.com/example',
  },
];

export const ExternalResources: Story = {
  args: {
    references: externalResources,
  },
};

// Miyabi specific references
const miyabiReferences: Reference[] = [
  {
    id: 'miyabi-1',
    title: 'Entity-Relation Model',
    category: 'docs',
    url: '/docs/ENTITY_RELATION_MODEL.md',
  },
  {
    id: 'miyabi-2',
    title: 'Label System Guide',
    category: 'docs',
    url: '/docs/LABEL_SYSTEM_GUIDE.md',
  },
  {
    id: 'miyabi-3',
    title: 'Agent Specifications',
    category: 'guide',
    url: '/.claude/agents/specs/',
  },
  {
    id: 'miyabi-4',
    title: 'MCP Integration Protocol',
    category: 'guide',
    url: '/.claude/MCP_INTEGRATION_PROTOCOL.md',
  },
  {
    id: 'miyabi-5',
    title: 'GitHub API',
    category: 'api',
    url: 'https://docs.github.com/rest',
  },
  {
    id: 'miyabi-6',
    title: 'Miyabi CLI Reference',
    category: 'api',
    url: '/docs/CLI_REFERENCE.md',
  },
];

export const MiyabiReferences: Story = {
  args: {
    references: miyabiReferences,
  },
};
