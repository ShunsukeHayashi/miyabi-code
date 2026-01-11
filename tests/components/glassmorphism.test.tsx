/**
 * Test glassmorphism components created by Codex X
 */

import { render } from '@testing-library/react';
import {
  GlassCard,
  GlassButton,
  GlassInput,
  GlassBadge,
  GlassStat,
  GlassToggle
} from '@/components/glassmorphism';

describe('Glassmorphism Components', () => {
  it('should render GlassCard without errors', () => {
    expect(() => {
      render(
        <GlassCard
          title="Test Card"
          description="Test description"
        >
          Content
        </GlassCard>
      );
    }).not.toThrow();
  });

  it('should render GlassButton variants without errors', () => {
    expect(() => {
      render(
        <>
          <GlassButton variant="primary">Primary</GlassButton>
          <GlassButton variant="ghost">Ghost</GlassButton>
          <GlassButton variant="outline">Outline</GlassButton>
        </>
      );
    }).not.toThrow();
  });

  it('should render GlassInput with all props', () => {
    expect(() => {
      render(
        <GlassInput
          label="Test Input"
          hint="Test hint"
          placeholder="Enter text..."
          icon={<div>Icon</div>}
        />
      );
    }).not.toThrow();
  });

  it('should render all glass components', () => {
    expect(() => {
      render(
        <div>
          <GlassBadge>Badge</GlassBadge>
          <GlassStat value="99%" label="Uptime" />
          <GlassToggle checked onChange={() => {}} />
        </div>
      );
    }).not.toThrow();
  });
});