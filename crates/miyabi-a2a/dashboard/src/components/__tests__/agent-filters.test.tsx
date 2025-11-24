import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentFilters, type FilterOptions } from '../agent-filters';

const baseFilters: FilterOptions = {
  searchQuery: '',
  statusFilter: [],
  typeFilter: [],
  sortBy: 'name',
  sortOrder: 'asc',
};

const renderFilters = (
  filters: FilterOptions = baseFilters,
  onFiltersChange: (filters: FilterOptions) => void = vi.fn(),
) =>
  render(
    <AgentFilters
      filters={filters}
      onFiltersChange={onFiltersChange}
      agentCount={10}
      filteredCount={5}
    />,
  );

describe('AgentFilters', () => {
  it('applies quick filters for active/working agents', async () => {
    const onFiltersChange = vi.fn();
    renderFilters(baseFilters, onFiltersChange);

    await userEvent.click(screen.getByText('稼働中のみ'));

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ statusFilter: ['active', 'working'] }),
    );
  });

  it('updates search query and supports clearing it', async () => {
    const onFiltersChange = vi.fn();
    renderFilters(baseFilters, onFiltersChange);

    const searchInput = screen.getByPlaceholderText('Agentを検索...');
    await userEvent.type(searchInput, 'orchestra');

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ searchQuery: 'orchestra' }),
    );

    const clearButton = screen.getByLabelText('Clear search');
    await userEvent.click(clearButton);

    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ searchQuery: '' }),
    );
  });

  it('toggles sort order', async () => {
    const onFiltersChange = vi.fn();
    renderFilters(baseFilters, onFiltersChange);

    const toggle = screen.getByTestId('sort-order-toggle');
    await userEvent.click(toggle);

    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortOrder: 'desc' }),
    );
  });

  it('renders summary chips and clears all filters', async () => {
    const onFiltersChange = vi.fn();
    const filters: FilterOptions = {
      searchQuery: 'agent',
      statusFilter: ['active', 'idle'],
      typeFilter: ['coordinator'],
      sortBy: 'status',
      sortOrder: 'desc',
    };

    renderFilters(filters, onFiltersChange);

    expect(screen.getByText('5 / 10 件表示中')).toBeInTheDocument();
    expect(screen.getAllByText('稼働中')[0]).toBeInTheDocument();
    expect(screen.getAllByText('待機中')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Coordinator')[0]).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'クリア' }));

    expect(onFiltersChange).toHaveBeenLastCalledWith({
      searchQuery: '',
      statusFilter: [],
      typeFilter: [],
      sortBy: 'name',
      sortOrder: 'asc',
    });
  });
});
