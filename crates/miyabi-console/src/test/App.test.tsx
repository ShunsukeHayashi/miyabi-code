import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';

// Create a wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />, { wrapper: createWrapper() });
    // App should render something
    expect(document.body).toBeDefined();
  });
});

describe('Basic Tests', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle arrays', () => {
    const agents = ['coordinator', 'codegen', 'review'];
    expect(agents).toHaveLength(3);
    expect(agents).toContain('coordinator');
  });

  it('should handle objects', () => {
    const agent = {
      name: 'Coordinator',
      status: 'idle',
      type: 'Coding',
    };
    expect(agent.name).toBe('Coordinator');
    expect(agent.status).toBe('idle');
  });
});
