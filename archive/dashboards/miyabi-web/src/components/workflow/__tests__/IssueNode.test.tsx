/**
 * IssueNode Component Tests
 * Issue #427: Phase 2 Testing
 */

import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import IssueNode from '../IssueNode';

describe('IssueNode', () => {
  const mockProps = {
    id: 'issue-1',
    type: 'issueNode',
    position: { x: 0, y: 0 },
    data: {
      issueNumber: 427,
      title: 'Workflow Editor - React Flow Implementation',
      state: 'open' as const,
      labels: ['P1-High', 'feature', 'phase-2'],
      repository: 'ShunsukeHayashi/Miyabi',
    },
    selected: false,
    isConnectable: true,
    xPos: 0,
    yPos: 0,
    zIndex: 0,
    dragging: false,
  };

  it('renders issue node with correct data', () => {
    render(
      <ReactFlowProvider>
        <IssueNode {...mockProps} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Issue #427')).toBeInTheDocument();
    expect(screen.getByText('Workflow Editor - React Flow Implementation')).toBeInTheDocument();
    expect(screen.getByText('ShunsukeHayashi/Miyabi')).toBeInTheDocument();
  });

  it('displays state badge correctly for open issue', () => {
    render(
      <ReactFlowProvider>
        <IssueNode {...mockProps} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('displays state badge correctly for closed issue', () => {
    const closedProps = {
      ...mockProps,
      data: {
        ...mockProps.data,
        state: 'closed' as const,
      },
    };

    render(
      <ReactFlowProvider>
        <IssueNode {...closedProps} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('displays label badges', () => {
    render(
      <ReactFlowProvider>
        <IssueNode {...mockProps} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('P1-High')).toBeInTheDocument();
    expect(screen.getByText('feature')).toBeInTheDocument();
    expect(screen.getByText('phase-2')).toBeInTheDocument();
  });

  it('limits label display to 3 items', () => {
    const propsWithManyLabels = {
      ...mockProps,
      data: {
        ...mockProps.data,
        labels: ['label1', 'label2', 'label3', 'label4', 'label5'],
      },
    };

    render(
      <ReactFlowProvider>
        <IssueNode {...propsWithManyLabels} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('label1')).toBeInTheDocument();
    expect(screen.getByText('label2')).toBeInTheDocument();
    expect(screen.getByText('label3')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('applies correct styling', () => {
    const { container } = render(
      <ReactFlowProvider>
        <IssueNode {...mockProps} />
      </ReactFlowProvider>
    );

    const card = container.querySelector('[data-ai-component="issue-node"]');
    expect(card).toHaveClass('bg-yellow-50', 'border-yellow-200');
  });

  it('shows selected state styling', () => {
    const selectedProps = { ...mockProps, selected: true };

    const { container } = render(
      <ReactFlowProvider>
        <IssueNode {...selectedProps} />
      </ReactFlowProvider>
    );

    const card = container.querySelector('[data-ai-component="issue-node"]');
    expect(card).toHaveClass('ring-2', 'ring-blue-400', 'shadow-lg');
  });

  it('renders without repository name', () => {
    const propsWithoutRepo = {
      ...mockProps,
      data: {
        ...mockProps.data,
        repository: undefined,
      },
    };

    render(
      <ReactFlowProvider>
        <IssueNode {...propsWithoutRepo} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Issue #427')).toBeInTheDocument();
    expect(screen.queryByText('ShunsukeHayashi/Miyabi')).not.toBeInTheDocument();
  });
});
