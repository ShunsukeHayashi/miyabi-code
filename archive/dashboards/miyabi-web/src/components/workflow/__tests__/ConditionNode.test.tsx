/**
 * ConditionNode Component Tests
 * Issue #427: Phase 2 Testing
 */

import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import ConditionNode from '../ConditionNode';

describe('ConditionNode', () => {
  const mockProps = {
    id: 'condition-1',
    type: 'conditionNode',
    position: { x: 0, y: 0 },
    data: {
      condition: 'status === "success"',
      description: 'Check execution status',
      trueLabel: 'Success',
      falseLabel: 'Failure',
    },
    selected: false,
    isConnectable: true,
    xPos: 0,
    yPos: 0,
    zIndex: 0,
    dragging: false,
  };

  it('renders condition node with correct data', () => {
    render(
      <ReactFlowProvider>
        <ConditionNode {...mockProps} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('status === "success"')).toBeInTheDocument();
    expect(screen.getByText('Check execution status')).toBeInTheDocument();
  });

  it('displays true and false labels', () => {
    render(
      <ReactFlowProvider>
        <ConditionNode {...mockProps} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Failure')).toBeInTheDocument();
  });

  it('uses default labels when not provided', () => {
    const propsWithoutLabels = {
      ...mockProps,
      data: {
        condition: 'test === true',
      },
    };

    render(
      <ReactFlowProvider>
        <ConditionNode {...propsWithoutLabels} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('True')).toBeInTheDocument();
    expect(screen.getByText('False')).toBeInTheDocument();
  });

  it('applies diamond shape styling', () => {
    const { container } = render(
      <ReactFlowProvider>
        <ConditionNode {...mockProps} />
      </ReactFlowProvider>
    );

    const card = container.querySelector('[data-ai-shape="diamond"]');
    expect(card).toHaveClass('rotate-45', 'bg-amber-50', 'border-amber-300');
  });

  it('shows selected state styling', () => {
    const selectedProps = { ...mockProps, selected: true };

    const { container } = render(
      <ReactFlowProvider>
        <ConditionNode {...selectedProps} />
      </ReactFlowProvider>
    );

    const card = container.querySelector('[data-ai-shape="diamond"]');
    expect(card).toHaveClass('ring-2', 'ring-blue-400', 'shadow-lg');
  });

  it('renders without description', () => {
    const propsWithoutDescription = {
      ...mockProps,
      data: {
        condition: 'x > 0',
        trueLabel: 'Yes',
        falseLabel: 'No',
      },
    };

    render(
      <ReactFlowProvider>
        <ConditionNode {...propsWithoutDescription} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('x > 0')).toBeInTheDocument();
    expect(screen.queryByText('Check execution status')).not.toBeInTheDocument();
  });

  it('displays condition icon', () => {
    render(
      <ReactFlowProvider>
        <ConditionNode {...mockProps} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('⚡')).toBeInTheDocument();
  });
});
