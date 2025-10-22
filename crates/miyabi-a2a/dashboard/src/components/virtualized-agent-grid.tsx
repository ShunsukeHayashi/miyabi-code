import React from "react";
import { Grid, type CellComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { AgentCard } from "./agent-card";
import { Agent } from "../types/miyabi-types";

interface VirtualizedAgentGridProps {
  /** Array of agents to display */
  agents: Agent[];
  /** Callback when an agent card is clicked */
  onAgentClick: (agent: Agent) => void;
  /** Number of columns (responsive) */
  columnCount?: number;
  /** Card width in pixels */
  cardWidth?: number;
  /** Card height in pixels */
  cardHeight?: number;
  /** Gap between cards in pixels */
  gap?: number;
}

interface CellProps {
  agents: Agent[];
  columnCount: number;
  onAgentClick: (agent: Agent) => void;
  gap: number;
}

/**
 * Virtualized agent grid using react-window for optimal performance
 *
 * Benefits:
 * - Only renders visible cards (reduces DOM nodes)
 * - Smooth scrolling with thousands of items
 * - Automatic cleanup of off-screen components
 * - Memory efficient
 */
export const VirtualizedAgentGrid: React.FC<VirtualizedAgentGridProps> = ({
  agents,
  onAgentClick,
  columnCount: columnCountProp = 4,
  cardWidth = 300,
  cardHeight = 180,
  gap = 16,
}) => {
  // Cell renderer for react-window
  const Cell = React.useCallback(
    ({ columnIndex, rowIndex, style }: CellComponentProps<CellProps>) => {
      const props = arguments[0] as CellComponentProps<CellProps> & { columnIndex: number; rowIndex: number };
      const cellProps = (props as any).cellProps as CellProps | undefined;

      if (!cellProps) return null;

      const { agents, columnCount, onAgentClick, gap } = cellProps;
      const index = rowIndex * columnCount + columnIndex;

      // Return empty cell if index exceeds agent count
      if (index >= agents.length) {
        return null;
      }

      const agent = agents[index];

      return (
        <div
          style={{
            ...style,
            padding: gap / 2,
          }}
        >
          <AgentCard
            agent={agent}
            onClick={() => onAgentClick(agent)}
          />
        </div>
      );
    },
    []
  );

  // No agents to display
  if (agents.length === 0) {
    return null;
  }

  return (
    <div style={{ height: "600px", width: "100%" }}>
      <AutoSizer>
        {({ height, width }) => {
          // Recalculate column count based on available width
          const responsiveColumnCount = Math.max(
            1,
            Math.floor(width / (cardWidth + gap))
          );

          const responsiveRowCount = Math.ceil(
            agents.length / responsiveColumnCount
          );

          const cellProps: CellProps = {
            agents,
            columnCount: responsiveColumnCount,
            onAgentClick,
            gap,
          };

          return (
            <Grid
              columnCount={responsiveColumnCount}
              columnWidth={cardWidth + gap}
              defaultHeight={height}
              defaultWidth={width}
              rowCount={responsiveRowCount}
              rowHeight={cardHeight + gap}
              overscanCount={1}
              style={{
                paddingLeft: gap / 2,
                paddingTop: gap / 2,
              }}
              cellComponent={Cell}
              cellProps={cellProps}
            />
          );
        }}
      </AutoSizer>
    </div>
  );
};

/**
 * Responsive breakpoint configuration
 */
export const RESPONSIVE_COLUMNS = {
  xs: 1,  // < 640px
  sm: 2,  // 640px - 1023px
  md: 3,  // 1024px - 1279px
  lg: 4,  // >= 1280px
  xl: 5,  // >= 1536px
} as const;

/**
 * Hook to calculate responsive column count
 */
export const useResponsiveColumns = () => {
  const [columnCount, setColumnCount] = React.useState(RESPONSIVE_COLUMNS.lg);

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < 640) {
        setColumnCount(RESPONSIVE_COLUMNS.xs);
      } else if (width < 1024) {
        setColumnCount(RESPONSIVE_COLUMNS.sm);
      } else if (width < 1280) {
        setColumnCount(RESPONSIVE_COLUMNS.md);
      } else if (width < 1536) {
        setColumnCount(RESPONSIVE_COLUMNS.lg);
      } else {
        setColumnCount(RESPONSIVE_COLUMNS.xl);
      }
    };

    handleResize(); // Initial calculation
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return columnCount;
};
