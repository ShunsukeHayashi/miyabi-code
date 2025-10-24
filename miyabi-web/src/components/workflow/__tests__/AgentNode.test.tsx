/**
 * AgentNode Component Tests
 * Issue #427: Phase 2 Testing
 */

import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import AgentNode from '../AgentNode';

describe('AgentNode', () => {
  const mockProps = {
    id: 'agent-1',
    type: 'agentNode',
    position: { x: 0, y: 0 },
    data: {
      id: 'coordinator',
      name: 'Coordinator Agent',
      category: 'coding' as const,
      description: 'Orchestrates tasks and manages DAG-based workflows',
      icon: '🎯',
      capabilities: ['Task decomposition', 'DAG planning', 'Parallel execution'],
    },
    selected: false,
    isConnectable: true,
    xPos: 0,
    yPos: 0,
    zIndex: 0,
    dragging: false,
  };

  it('renders agent node with correct data', () => {
    render(
      <ReactFlowProvider>
        <AgentNode {...mockProps} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Coordinator Agent')).toBeInTheDocument();
    expect(screen.getByText('Orchestrates tasks and manages DAG-based workflows')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('displays capabilities badges', () => {
    render(
      <ReactFlowProvider>
        <AgentNode {...mockProps} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Task decomposition')).toBeInTheDocument();
    expect(screen.getByText('DAG planning')).toBeInTheDocument();
  });

  it('applies correct styling for coding category', () => {
    const { container } = render(
      <ReactFlowProvider>
        <AgentNode {...mockProps} />
      </ReactFlowProvider>
    );

    const card = container.querySelector('[data-ai-component="agent-node"]');
    expect(card).toHaveClass('bg-purple-50', 'border-purple-300');
  });

  it('applies correct styling for business category', () => {
    const businessProps = {
      ...mockProps,
      data: {
        ...mockProps.data,
        category: 'business' as const,
      },
    };

    const { container } = render(
      <ReactFlowProvider>
        <AgentNode {...businessProps} />
      </ReactFlowProvider>
    );

    const card = container.querySelector('[data-ai-component="agent-node"]');
    expect(card).toHaveClass('bg-green-50', 'border-green-300');
  });

  it('shows selected state styling', () => {
    const selectedProps = { ...mockProps, selected: true };

    const { container } = render(
      <ReactFlowProvider>
        <AgentNode {...selectedProps} />
      </ReactFlowProvider>
    );

    const card = container.querySelector('[data-ai-component="agent-node"]');
    expect(card).toHaveClass('ring-2', 'ring-purple-400', 'shadow-lg');
  });

  it('supports legacy agent type format', () => {
    const legacyProps = {
      ...mockProps,
      data: {
        agentType: 'Coordinator' as const,
        label: 'Coordinator Agent',
        status: 'idle' as const,
      },
    };

    render(
      <ReactFlowProvider>
        <AgentNode {...legacyProps} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('CoordinatorAgent')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('displays status badge when provided', () => {
    const propsWithStatus = {
      ...mockProps,
      data: {
        ...mockProps.data,
        status: 'running' as const,
      },
    };

    render(
      <ReactFlowProvider>
        <AgentNode {...propsWithStatus} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('実行中')).toBeInTheDocument();
  });

  it('limits capability display to 2 items', () => {
    const propsWithManyCapabilities = {
      ...mockProps,
      data: {
        ...mockProps.data,
        capabilities: ['Cap1', 'Cap2', 'Cap3', 'Cap4', 'Cap5'],
      },
    };

    render(
      <ReactFlowProvider>
        <AgentNode {...propsWithManyCapabilities} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Cap1')).toBeInTheDocument();
    expect(screen.getByText('Cap2')).toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();
  });
});
