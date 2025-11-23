import React from "react";
import { Input, Select, SelectItem, Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";

export interface FilterOptions {
  searchQuery: string;
  statusFilter: string[];
  typeFilter: string[];
  sortBy: "name" | "status" | "tasks";
  sortOrder: "asc" | "desc";
}

interface AgentFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  agentCount: number;
  filteredCount: number;
}

export const AgentFilters: React.FC<AgentFiltersProps> = ({
  filters,
  onFiltersChange,
  agentCount,
  filteredCount,
}) => {
  const statusOptions = [
    { value: "active", label: "稼働中", color: "success" as const },
    { value: "working", label: "作業中", color: "primary" as const },
    { value: "idle", label: "待機中", color: "default" as const },
    { value: "error", label: "エラー", color: "danger" as const },
  ];

  const typeOptions = [
    { value: "coordinator", label: "Coordinator", emoji: "🔴" },
    { value: "codegen", label: "CodeGen", emoji: "🟢" },
    { value: "review", label: "Review", emoji: "🟢" },
    { value: "analyst", label: "Analyst", emoji: "🔵" },
    { value: "deploy", label: "Deploy", emoji: "🟡" },
    { value: "docs", label: "Docs", emoji: "🟡" },
    { value: "support", label: "Support", emoji: "⚪" },
  ];

  const sortOptions = [
    { value: "name", label: "名前順" },
    { value: "status", label: "ステータス順" },
    { value: "tasks", label: "タスク数順" },
  ];

  const quickFilters = [
    {
      label: "すべて",
      action: () =>
        onFiltersChange({
          ...filters,
          statusFilter: [],
          typeFilter: [],
          searchQuery: "",
        }),
    },
    {
      label: "稼働中のみ",
      action: () =>
        onFiltersChange({
          ...filters,
          statusFilter: ["active", "working"],
        }),
    },
    {
      label: "エラーのみ",
      action: () =>
        onFiltersChange({
          ...filters,
          statusFilter: ["error"],
        }),
    },
    {
      label: "待機中のみ",
      action: () =>
        onFiltersChange({
          ...filters,
          statusFilter: ["idle"],
        }),
    },
  ];

  const hasActiveFilters =
    filters.searchQuery ||
    filters.statusFilter.length > 0 ||
    filters.typeFilter.length > 0;

  const handleClearFilters = () => {
    onFiltersChange({
      searchQuery: "",
      statusFilter: [],
      typeFilter: [],
      sortBy: "name",
      sortOrder: "asc",
    });
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-foreground-500">クイックフィルター:</span>
        {quickFilters.map((filter) => (
          <Button
            key={filter.label}
            size="sm"
            variant="flat"
            color="primary"
            onPress={filter.action}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Search and Filters Row */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <Input
          className="flex-1"
          placeholder="Agentを検索..."
          value={filters.searchQuery}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, searchQuery: value })
          }
          startContent={<Icon icon="lucide:search" className="h-4 w-4 text-foreground-400" />}
          endContent={
            filters.searchQuery && (
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, searchQuery: "" })
                }
                aria-label="Clear search"
                className="text-foreground-400 hover:text-foreground-600"
              >
                <Icon icon="lucide:x" className="h-4 w-4" />
              </button>
            )
          }
        />

        {/* Status Filter */}
        <Select
          className="w-full md:w-48"
          placeholder="ステータス"
          selectionMode="multiple"
          selectedKeys={new Set(filters.statusFilter)}
          aria-label="ステータスフィルター"
          onSelectionChange={(keys) =>
            onFiltersChange({
              ...filters,
              statusFilter: Array.from(keys as Set<string>),
            })
          }
          startContent={<Icon icon="lucide:filter" className="h-4 w-4" />}
        >
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} textValue={option.label}>
              {option.label}
            </SelectItem>
          ))}
        </Select>

        {/* Type Filter */}
        <Select
          className="w-full md:w-48"
          placeholder="タイプ"
          selectionMode="multiple"
          selectedKeys={new Set(filters.typeFilter)}
          aria-label="タイプフィルター"
          onSelectionChange={(keys) =>
            onFiltersChange({
              ...filters,
              typeFilter: Array.from(keys as Set<string>),
            })
          }
          startContent={<Icon icon="lucide:layers" className="h-4 w-4" />}
        >
          {typeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} textValue={option.label}>
              {option.emoji} {option.label}
            </SelectItem>
          ))}
        </Select>

        {/* Sort */}
        <Select
          className="w-full md:w-48"
          placeholder="並び替え"
          selectedKeys={new Set([filters.sortBy])}
          aria-label="並び替え"
          onSelectionChange={(keys) => {
            const sortBy = Array.from(keys)[0] as "name" | "status" | "tasks";
            onFiltersChange({ ...filters, sortBy });
          }}
          startContent={<Icon icon="lucide:arrow-up-down" className="h-4 w-4" />}
        >
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} textValue={option.label}>
              {option.label}
            </SelectItem>
          ))}
        </Select>

        {/* Sort Order Toggle */}
        <Button
          isIconOnly
          variant="flat"
          color="default"
          onPress={() =>
            onFiltersChange({
              ...filters,
              sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
            })
          }
          aria-label="Toggle sort order"
          data-testid="sort-order-toggle"
        >
          <Icon
            icon={
              filters.sortOrder === "asc"
                ? "lucide:arrow-up"
                : "lucide:arrow-down"
            }
            className="h-4 w-4"
          />
        </Button>
      </div>

      {/* Filter Summary */}
      <div className="flex flex-wrap items-center gap-2">
        {hasActiveFilters && (
          <>
            <Chip size="sm" variant="flat" color="primary">
              {filteredCount} / {agentCount} 件表示中
            </Chip>

            {filters.statusFilter.map((status) => (
              <Chip
                key={status}
                size="sm"
                variant="flat"
                color={
                  statusOptions.find((s) => s.value === status)?.color ||
                  "default"
                }
                onClose={() =>
                  onFiltersChange({
                    ...filters,
                    statusFilter: filters.statusFilter.filter(
                      (s) => s !== status
                    ),
                  })
                }
              >
                {statusOptions.find((s) => s.value === status)?.label || status}
              </Chip>
            ))}

            {filters.typeFilter.map((type) => (
              <Chip
                key={type}
                size="sm"
                variant="flat"
                onClose={() =>
                  onFiltersChange({
                    ...filters,
                    typeFilter: filters.typeFilter.filter((t) => t !== type),
                  })
                }
              >
                {typeOptions.find((t) => t.value === type)?.emoji}{" "}
                {typeOptions.find((t) => t.value === type)?.label || type}
              </Chip>
            ))}

            <Button
              size="sm"
              variant="light"
              color="danger"
              startContent={<Icon icon="lucide:x" className="h-3 w-3" />}
              onPress={handleClearFilters}
            >
              クリア
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
