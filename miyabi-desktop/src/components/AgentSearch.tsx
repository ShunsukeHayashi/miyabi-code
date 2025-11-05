import { forwardRef } from "react";
import { Search, X } from "lucide-react";

export interface AgentSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export const AgentSearch = forwardRef<HTMLInputElement, AgentSearchProps>(
  ({ value, onChange, onClear, placeholder = "Search agents... (e.g., しきるん, Coordinator)" }, ref) => {
    return (
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Clear agent search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

AgentSearch.displayName = "AgentSearch";
