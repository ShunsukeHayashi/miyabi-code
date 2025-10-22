import React from "react";
import { Card, CardBody, Button, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { TimelineEvent } from "../types/miyabi-types";
import { useEventTimeline } from "../hooks/use-event-timeline";

/**
 * Individual event item component - optimized with React.memo
 */
const EventItem = React.memo<{ event: TimelineEvent }>(({ event }) => {
  const typeInfo = React.useMemo(() => {
    switch (event.type) {
      case "task_created":
        return { icon: "lucide:plus-circle", color: "text-miyabi-success" };
      case "task_assigned":
        return { icon: "lucide:user-check", color: "text-miyabi-info" };
      case "task_status":
        return { icon: "lucide:refresh-cw", color: "text-miyabi-warning" };
      case "task_completed":
        return { icon: "lucide:check-circle", color: "text-miyabi-success" };
      case "agent_started":
        return { icon: "lucide:play", color: "text-miyabi-success" };
      case "agent_stopped":
        return { icon: "lucide:square", color: "text-miyabi-error" };
      case "error":
        return { icon: "lucide:alert-triangle", color: "text-miyabi-error" };
      default:
        return { icon: "lucide:info", color: "text-foreground-500" };
    }
  }, [event.type]);

  return (
    <li className="p-4 hover:bg-content2/50">
      <div className="flex items-start gap-3">
        <div className={`mt-1 ${typeInfo.color}`}>
          <Icon icon={typeInfo.icon} className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{event.message}</p>
            {event.task_id && (
              <Chip size="sm" variant="flat" color="primary">
                Task #{event.task_id}
              </Chip>
            )}
            {event.agent_id && (
              <Chip size="sm" variant="flat" color={event.agent_type === "coordinator" ? "danger" : "success"}>
                {event.agent_name}
              </Chip>
            )}
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-foreground-500">
              {event.timestamp}
            </span>
            {event.type === "error" && (
              <Button size="sm" variant="light" color="danger" className="h-6 px-2 text-xs">
                View Details
              </Button>
            )}
          </div>
        </div>

        <Button isIconOnly size="sm" variant="light">
          <Icon icon="lucide:more-horizontal" className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
});

EventItem.displayName = "EventItem";

/**
 * EventTimeline component - optimized with React.memo
 */
export const EventTimeline = React.memo(() => {
  const { events, filter, setFilter, loadMore } = useEventTimeline();
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter events by search query (memoized)
  const filteredEvents = React.useMemo(
    () => events.filter(event =>
      event.message.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [events, searchQuery]
  );

  // Handlers (memoized)
  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const handleFilterChange = React.useCallback(
    (keys: any) => {
      setFilter(Array.from(keys)[0] as string);
    },
    [setFilter]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Recent Events (Last {events.length})</h2>

        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={handleSearchChange}
            startContent={<Icon icon="lucide:search" className="h-4 w-4 text-foreground-400" />}
            className="max-w-xs"
          />

          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="flat"
                endContent={<Icon icon="lucide:chevron-down" className="h-4 w-4" />}
              >
                Filter: {filter === "all" ? "All" : filter}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Filter events"
              selectedKeys={[filter]}
              onSelectionChange={handleFilterChange}
              selectionMode="single"
            >
              <DropdownItem key="all">All</DropdownItem>
              <DropdownItem key="task">Tasks</DropdownItem>
              <DropdownItem key="agent">Agents</DropdownItem>
              <DropdownItem key="error">Errors</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Button
            color="primary"
            variant="flat"
            startContent={<Icon icon="lucide:download" className="h-4 w-4" />}
          >
            Export Log
          </Button>
        </div>
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <ul className="divide-y divide-divider">
              {filteredEvents.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </ul>
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-center">
        <Button
          color="primary"
          variant="flat"
          onPress={loadMore}
          startContent={<Icon icon="lucide:chevrons-down" className="h-4 w-4" />}
        >
          Load More
        </Button>
      </div>
    </div>
  );
});

EventTimeline.displayName = "EventTimeline";
