import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  ZoomIn,
  ZoomOut,
  Home,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { TimelineGroup } from "./TimelineGroup";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineLegend } from "./TimelineLegend";
import dayjs from "dayjs";

export interface Category {
  id: string;
  title: string;
  background_color: string;
  text_color: string;
}

export interface TimelineItem {
  id: string;
  group: string;
  title: string;
  start: Date;
  end: Date;
  show_duration?: boolean; // Default: false
  icon?: {
    name: string;           // Icon name from lucide-react
    text: string;           // Tooltip text
    position: "left" | "right"; // Position relative to content
  };
  category?: string; // Reference to category ID
  style?: React.CSSProperties;
}

export interface TimelineGroupData {
  id: string;
  title: string;
  height?: number;
  [key: string]: any; // Allow additional properties for custom rendering
}

export interface TimelineRef {
  scrollToGroup: (groupId: string) => void;
}

export interface ItemContext {
  title: string;
  dimensions: {
    height: number;
    width: string;
  };
  useResizeHandle: boolean;
  selected: boolean;
  canMove: boolean;
  canResize: boolean;
}

export interface ItemProps {
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}

export interface ResizeProps {
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export interface ItemRendererProps {
  item: TimelineItem;
  itemContext: ItemContext;
  getItemProps: (props?: Partial<ItemProps>) => ItemProps;
  getResizeProps: () => {
    left: ResizeProps;
    right: ResizeProps;
  };
}

export interface ControlsRendererProps {
  controls: {
    scrollLeft: () => void;
    scrollRight: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    goHome: () => void;
    scrollToToday: () => void;
  };
  state: {
    zoom: number;
    canZoomIn: boolean;
    canZoomOut: boolean;
  };
}

interface TimelineProps {
  groups: TimelineGroupData[];
  categories: Category[];
  items: TimelineItem[];
  locale?: string;
  defaultTimeStart?: Date;
  defaultTimeEnd?: Date;
  visibleTimeStart?: Date;
  visibleTimeEnd?: Date;
  stickyHeader?: boolean;
  editable?: boolean;
  selectable?: boolean;
  showLegend?: boolean;
  showControls?: boolean;
  groupBarWidth?: number;
  selectedItemId?: string | null;
  groupRenderer?: (props: { group: TimelineGroupData }) => React.ReactNode;
  itemRenderer?: (props: ItemRendererProps) => React.ReactNode;
  controlsRenderer?: (props: ControlsRendererProps) => React.ReactNode;
  onItemClick?: (item: TimelineItem) => void;
  onItemSelect?: (item: TimelineItem | null) => void;
  onItemMove?: (
    itemId: string,
    dragTime: Date,
    newGroupId: string,
  ) => void;
  onItemResize?: (
    itemId: string,
    newStart: Date,
    newEnd: Date,
  ) => void;
}

const TimelineComponent = forwardRef<TimelineRef, TimelineProps>(({
  groups,
  categories,
  items,
  locale = 'en',
  defaultTimeStart,
  defaultTimeEnd,
  visibleTimeStart: _visibleTimeStart,
  visibleTimeEnd: _visibleTimeEnd,
  stickyHeader = true,
  editable = true,
  selectable = true,
  showLegend = true,
  showControls = true,
  groupBarWidth = 192,
  selectedItemId = null,
  groupRenderer,
  itemRenderer,
  controlsRenderer,
  onItemClick,
  onItemSelect,
  onItemMove,
  onItemResize,
}: TimelineProps, ref) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  // Use selectedItemId from props instead of internal state
  const selectedItem = selectedItemId;
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

  // Calculate default time ranges if not provided
  const now = dayjs();

  // Total scrollable range: 6 months before to 6 months after today
  const totalStart =
    defaultTimeStart || now.subtract(6, "month").toDate();
  const totalEnd =
    defaultTimeEnd || now.add(6, "month").toDate();

  // Default visible range: 3 days before to 4 days after today (1 week total)
  // Not currently used but kept for future implementation
  // const defaultVisibleStart =
  //   visibleTimeStart || now.subtract(3, "day").toDate();
  // const defaultVisibleEnd =
  //   visibleTimeEnd || now.add(4, "day").toDate();

  // Total scrollable range (fixed)
  const [timeStart] = useState(totalStart);
  const [timeEnd] = useState(totalEnd);

  const [zoom, setZoom] = useState(1);

  const totalDuration = dayjs(timeEnd).diff(dayjs(timeStart));
  const groupHeight = 60;

  // Calculate timeline content width based on total range (12 months)
  // Base width should show 1 week by default at 100% zoom
  const containerWidth = 800; // Approximate timeline container width
  const baseWeekWidth = containerWidth; // 1 week takes full container width
  const totalWeeks = totalDuration / (7 * 24 * 60 * 60 * 1000); // Total weeks in 12 months
  const baseWidth = baseWeekWidth * totalWeeks; // Scale up for total range
  const timelineWidth = baseWidth * zoom; // Allow timeline to shrink when zooming out

  const handleZoomIn = useCallback(() => {
    if (zoom >= 8) return; // Max zoom limit
    
    if (contentScrollRef.current && headerScrollRef.current) {
      // Get current dimensions
      const containerWidth = contentScrollRef.current.clientWidth;
      const currentScrollLeft = contentScrollRef.current.scrollLeft;
      const currentCenter = currentScrollLeft + containerWidth / 2;
      
      // Calculate the current timeline width based on current zoom
      const currentTimelineWidth = baseWidth * zoom;
      
      // Calculate the time ratio at the current center point
      const centerRatio = currentCenter / currentTimelineWidth;
      
      // Calculate new zoom and timeline width
      const newZoom = zoom * 2;
      const newTimelineWidth = baseWidth * newZoom;
      
      // Calculate new scroll position to maintain the same center time
      const newCenterPosition = centerRatio * newTimelineWidth;
      const newScrollLeft = newCenterPosition - containerWidth / 2;
      const maxScroll = Math.max(0, newTimelineWidth - containerWidth);
      const clampedScroll = Math.max(0, Math.min(maxScroll, newScrollLeft));
      
      // Update zoom state
      setZoom(newZoom);
      
      // Apply scroll position after the DOM updates
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (contentScrollRef.current && headerScrollRef.current) {
            contentScrollRef.current.scrollLeft = clampedScroll;
            headerScrollRef.current.scrollLeft = clampedScroll;
          }
        });
      });
    }
  }, [zoom, baseWidth]);

  const handleZoomOut = useCallback(() => {
    if (zoom <= 0.25) return; // Min zoom limit
    
    if (contentScrollRef.current && headerScrollRef.current) {
      // Get current dimensions
      const containerWidth = contentScrollRef.current.clientWidth;
      const currentScrollLeft = contentScrollRef.current.scrollLeft;
      const currentCenter = currentScrollLeft + containerWidth / 2;
      
      // Calculate the current timeline width based on current zoom
      const currentTimelineWidth = baseWidth * zoom;
      
      // Calculate the time ratio at the current center point
      const centerRatio = currentCenter / currentTimelineWidth;
      
      // Calculate new zoom and timeline width
      const newZoom = zoom * 0.5;
      const newTimelineWidth = baseWidth * newZoom;
      
      // Calculate new scroll position to maintain the same center time
      const newCenterPosition = centerRatio * newTimelineWidth;
      const newScrollLeft = newCenterPosition - containerWidth / 2;
      
      // Clamp scroll position to valid range
      const maxScroll = Math.max(0, newTimelineWidth - containerWidth);
      const clampedScroll = Math.max(0, Math.min(maxScroll, newScrollLeft));
      
      // Update zoom state
      setZoom(newZoom);
      
      // Apply scroll position after the DOM updates
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (contentScrollRef.current && headerScrollRef.current) {
            contentScrollRef.current.scrollLeft = clampedScroll;
            headerScrollRef.current.scrollLeft = clampedScroll;
          }
        });
      });
    }
  }, [zoom, baseWidth]);

  // Single click: just scroll to today (keep current zoom)
  const handleScrollToToday = useCallback(() => {
    if (contentScrollRef.current && headerScrollRef.current) {
      const nowRatio = dayjs().diff(dayjs(timeStart)) / totalDuration;
      const containerWidth = contentScrollRef.current.clientWidth || 800;
      const scrollPosition = (nowRatio * timelineWidth) - (containerWidth / 2);
      const maxScroll = Math.max(0, timelineWidth - containerWidth);
      const clampedScroll = Math.max(0, Math.min(maxScroll, scrollPosition));
      
      // Apply scroll position smoothly
      contentScrollRef.current.scrollTo({ left: clampedScroll, behavior: 'smooth' });
      headerScrollRef.current.scrollLeft = clampedScroll;
    }
  }, [timeStart, totalDuration, timelineWidth]);

  // Double click: reset zoom to 100% AND scroll to today
  const handleGoHome = useCallback(() => {
    if (contentScrollRef.current && headerScrollRef.current) {
      // Calculate new zoom and scroll position
      const newZoom = 1;
      const nowRatio = dayjs().diff(dayjs(timeStart)) / totalDuration;
      const containerWidth = contentScrollRef.current.clientWidth || 800;
      const newTimelineWidth = baseWidth * newZoom;
      const scrollPosition = (nowRatio * newTimelineWidth) - (containerWidth / 2);
      const maxScroll = Math.max(0, newTimelineWidth - containerWidth);
      const clampedScroll = Math.max(0, Math.min(maxScroll, scrollPosition));
      
      // Update zoom state
      setZoom(newZoom);
      
      // Apply scroll position after the DOM updates
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (contentScrollRef.current && headerScrollRef.current) {
            contentScrollRef.current.scrollLeft = clampedScroll;
            headerScrollRef.current.scrollLeft = clampedScroll;
          }
        });
      });
    }
  }, [timeStart, totalDuration, baseWidth]);



  // Handle home button clicks with single/double click detection
  const handleHomeButtonClick = useCallback(() => {
    if (clickTimeout) {
      // This is a double click
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      handleGoHome(); // Reset zoom to 100% AND scroll to today
    } else {
      // This might be a single click, wait to see if double click follows
      const timeout = setTimeout(() => {
        handleScrollToToday(); // Just scroll to today (keep current zoom)
        setClickTimeout(null);
      }, 250); // 250ms delay to detect double click
      setClickTimeout(timeout);
    }
  }, [clickTimeout, handleGoHome, handleScrollToToday]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

  const handleScrollLeft = useCallback(() => {
    if (contentScrollRef.current && headerScrollRef.current) {
      const containerWidth = contentScrollRef.current.clientWidth;
      const scrollAmount = containerWidth * 0.5; // 50% of current viewport width
      const newScrollLeft =
        contentScrollRef.current.scrollLeft - scrollAmount;
      contentScrollRef.current.scrollLeft = Math.max(
        0,
        newScrollLeft,
      );
      headerScrollRef.current.scrollLeft =
        contentScrollRef.current.scrollLeft;
    }
  }, []);

  const handleScrollRight = useCallback(() => {
    if (contentScrollRef.current && headerScrollRef.current) {
      const containerWidth = contentScrollRef.current.clientWidth;
      const scrollAmount = containerWidth * 0.5; // 50% of current viewport width
      const maxScrollLeft =
        timelineWidth - containerWidth;
      const newScrollLeft =
        contentScrollRef.current.scrollLeft + scrollAmount;
      contentScrollRef.current.scrollLeft = Math.min(
        maxScrollLeft,
        newScrollLeft,
      );
      headerScrollRef.current.scrollLeft =
        contentScrollRef.current.scrollLeft;
    }
  }, [timelineWidth]);

  // Sync scroll between header and content
  const handleContentScroll = useCallback(() => {
    if (contentScrollRef.current && headerScrollRef.current) {
      // Only sync horizontal scroll for sticky header mode
      // In non-sticky mode, the header scrolls naturally with the content
      if (stickyHeader) {
        headerScrollRef.current.scrollLeft =
          contentScrollRef.current.scrollLeft;
      }
    }
  }, [stickyHeader]);

  // Auto-scroll to show the current week on mount
  useEffect(() => {
    if (contentScrollRef.current && headerScrollRef.current) {
      // Calculate scroll position to center the current week
      const nowRatio = dayjs().diff(dayjs(timeStart)) / totalDuration;
      const containerWidth = contentScrollRef.current.clientWidth || 800;
      
      // Position so current time is roughly in center of visible area
      const scrollPosition = (nowRatio * timelineWidth) - (containerWidth / 2);
      const maxScroll = timelineWidth - containerWidth;
      
      const clampedScroll = Math.max(0, Math.min(maxScroll, scrollPosition));
      
      contentScrollRef.current.scrollLeft = clampedScroll;
      headerScrollRef.current.scrollLeft = clampedScroll;
    }
  }, [timelineWidth, totalDuration, timeStart]); // Update when width changes

  const handleItemClick = useCallback(
    (item: TimelineItem) => {
      // Only handle clicks if selectable is enabled
      if (selectable) {
        onItemClick?.(item);
        onItemSelect?.(item);
      }
    },
    [onItemClick, onItemSelect, selectable],
  );

  const getTimeFromPosition = useCallback(
    (x: number) => {
      const rect =
        contentScrollRef.current?.getBoundingClientRect();
      if (!rect) return timeStart;

      const scrollLeft =
        contentScrollRef.current?.scrollLeft || 0;
      // Adjust for group labels width
      const relativeX = x - rect.left + scrollLeft - groupBarWidth;
      const timeRatio = relativeX / timelineWidth;

      return dayjs(timeStart)
        .add(timeRatio * totalDuration, "millisecond")
        .toDate();
    },
    [timeStart, totalDuration, timelineWidth, groupBarWidth],
  );

  const getGroupFromPosition = useCallback(
    (y: number) => {
      const rect =
        contentScrollRef.current?.getBoundingClientRect();
      if (!rect) return groups[0]?.id;

      const scrollTop =
        contentScrollRef.current?.scrollTop || 0;
      // Adjust for header height in non-sticky mode
      const headerOffset = stickyHeader ? 0 : 60;
      const relativeY = y - rect.top + scrollTop - headerOffset;
      const groupIndex = Math.floor(relativeY / groupHeight);
      return groups[groupIndex]?.id || groups[0]?.id;
    },
    [groups, groupHeight, stickyHeader],
  );

  // Function to scroll to a specific group
  const scrollToGroup = useCallback((groupId: string) => {
    if (!contentScrollRef.current) return;

    const groupIndex = groups.findIndex(group => group.id === groupId);
    if (groupIndex === -1) {
      console.warn(`Group with id "${groupId}" not found`);
      return;
    }

    const scrollContainer = contentScrollRef.current;
    const containerRect = scrollContainer.getBoundingClientRect();
    const containerHeight = containerRect.height;
    const currentScrollTop = scrollContainer.scrollTop;

    // Calculate target scroll position based on sticky header mode
    const headerOffset = stickyHeader ? 0 : 60; // Header height in non-sticky mode
    const groupTop = groupIndex * groupHeight + headerOffset;
    const groupBottom = groupTop + groupHeight;

    // Check if the group is already visible
    const visibleTop = currentScrollTop;
    const visibleBottom = currentScrollTop + containerHeight;

    // If the group is already fully visible, do nothing
    const isGroupVisible = groupTop >= visibleTop && groupBottom <= visibleBottom;
    
    if (isGroupVisible) {
      return;
    }

    // Calculate optimal scroll position to center the group
    const optimalScrollTop = groupTop - (containerHeight / 2) + (groupHeight / 2);
    
    // Clamp scroll position to valid range
    const maxScrollTop = scrollContainer.scrollHeight - containerHeight;
    const targetScrollTop = Math.max(0, Math.min(maxScrollTop, optimalScrollTop));

    // Scroll to the target position with smooth animation
    scrollContainer.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
  }, [groups, groupHeight, stickyHeader]);

  // Expose the scrollToGroup function to parent components
  useImperativeHandle(ref, () => ({
    scrollToGroup
  }), [scrollToGroup]);

  // Default group renderer
  const defaultGroupRenderer = ({ group }: { group: TimelineGroupData }) => (
    <span className="text-sm truncate">
      {group.title}
    </span>
  );

  // Use custom group renderer or fallback to default
  const renderGroup = groupRenderer || defaultGroupRenderer;

  // Default controls renderer
  const defaultControlsRenderer = ({ controls, state }: ControlsRendererProps) => (
    <div className="flex items-center gap-2 p-4 border-b flex-shrink-0">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={controls.scrollLeft}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={controls.scrollRight}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-border mx-2" />

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={controls.zoomIn}
          disabled={!state.canZoomIn}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={controls.zoomOut}
          disabled={!state.canZoomOut}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={controls.goHome}
        >
          <Home className="w-4 h-4" />
        </Button>
      </div>

      <div className="text-sm text-muted-foreground ml-auto">
        Zoom: {Math.round(state.zoom * 100)}%
      </div>
    </div>
  );

  // Use custom controls renderer or fallback to default
  const renderControls = controlsRenderer || defaultControlsRenderer;

  return (
    <Card className="w-full h-full overflow-hidden flex flex-col gap-0">
      {/* Controls */}
      {showControls && renderControls({
        controls: {
          scrollLeft: handleScrollLeft,
          scrollRight: handleScrollRight,
          zoomIn: handleZoomIn,
          zoomOut: handleZoomOut,
          goHome: handleHomeButtonClick,
          scrollToToday: handleScrollToToday,
        },
        state: {
          zoom: zoom,
          canZoomIn: zoom < 8,
          canZoomOut: zoom > 0.25,
        },
      })}

      {/* Timeline Container */}
      <div
        ref={timelineRef}
        className="relative flex-1 bg-background overflow-hidden flex flex-col"
      >
        {stickyHeader ? (
          <>
            {/* Sticky Header */}
            <div className="flex border-b sticky top-0 z-40 bg-background flex-shrink-0">
              {/* Fixed Header Left (Group Labels Space) */}
              <div className="bg-muted border-r flex-shrink-0" style={{ width: `${groupBarWidth}px`, height: '60px' }} />

              {/* Scrollable Header Right (Time Axis) */}
              <div
                ref={headerScrollRef}
                className="flex-1 overflow-hidden"
              >
                <TimelineHeader
                  timeStart={timeStart}
                  timeEnd={timeEnd}
                  width={timelineWidth}
                  zoom={zoom}
                  locale={locale}
                />
              </div>
            </div>

            {/* Single Scrollable Content Area */}
            <div
              ref={contentScrollRef}
              className="flex-1 overflow-auto scroll-smooth relative"
              onScroll={handleContentScroll}
              style={{ 
                maxHeight: showLegend ? `calc(100% - 60px)` : '100%' // Reserve space for footer if legend is shown
              }}
            >
              <div
                className="relative"
                style={{
                  width: `${groupBarWidth + timelineWidth}px`, // group bar width plus timeline width
                  height: `${groups.length * groupHeight}px`,
                }}
              >
                {/* Sticky Group Labels - stays visible during horizontal scroll */}
                <div 
                  className="sticky left-0 top-0 bg-muted border-r z-50"
                  style={{ width: `${groupBarWidth}px`, height: `${groups.length * groupHeight}px` }}
                >
                  {groups.map((group, index) => (
                    <div
                      key={group.id}
                      className="absolute flex items-center px-4 border-b border-r bg-muted"
                      style={{ 
                        height: groupHeight,
                        top: `${index * groupHeight}px`,
                        width: `${groupBarWidth}px`,
                        left: 0
                      }}
                    >
                      {renderGroup({ group })}
                    </div>
                  ))}
                </div>

                {/* Timeline Content Area */}
                <div
                  className="absolute"
                  style={{
                    left: `${groupBarWidth}px`,
                    top: 0,
                    width: `${timelineWidth}px`,
                    height: `${groups.length * groupHeight}px`,
                  }}
                >
                  {/* Current time indicator for content area */}
                  <div
                    className="absolute top-0 w-0.5 bg-destructive z-40 pointer-events-none"
                    style={{
                      left: `${(dayjs().diff(dayjs(timeStart)) / totalDuration) * timelineWidth}px`,
                      height: "100%",
                      display:
                        dayjs().isAfter(dayjs(timeStart)) &&
                        dayjs().isBefore(dayjs(timeEnd))
                          ? "block"
                          : "none",
                    }}
                  />

                  {groups.map((group, index) => (
                    <TimelineGroup
                      key={group.id}
                      group={group}
                      categories={categories}
                      items={items.filter(
                        (item) => item.group === group.id,
                      )}
                      timeStart={timeStart}
                      timeEnd={timeEnd}
                      height={groupHeight}
                      top={index * groupHeight}
                      selectedItem={selectedItem}
                      selectable={selectable}
                      onItemClick={handleItemClick}
                      onItemMove={editable ? onItemMove : undefined}
                      onItemResize={editable ? onItemResize : undefined}
                      getTimeFromPosition={getTimeFromPosition}
                      getGroupFromPosition={getGroupFromPosition}
                      timelineWidth={timelineWidth}
                      locale={locale}
                      itemRenderer={itemRenderer}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline Legend Footer */}
            {showLegend && (
              <div className="flex-shrink-0">
                <TimelineLegend 
                  categories={categories} 
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Non-sticky version: Everything scrolls together in one container */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div
                ref={contentScrollRef}
                className="flex-1 overflow-auto scroll-smooth relative"
                onScroll={handleContentScroll}
              >
              <div
                className="relative"
                style={{
                  width: `${groupBarWidth + timelineWidth}px`, // group bar width plus timeline width
                  height: `${60 + groups.length * groupHeight}px`, // Include header height
                }}
              >
                {/* Header inside scrollable content */}
                <div 
                  ref={headerScrollRef}
                  className="absolute top-0 border-b bg-background z-30"
                  style={{ 
                    left: `${groupBarWidth}px`,
                    height: '60px', 
                    width: `${timelineWidth}px` 
                  }}
                >
                  <TimelineHeader
                    timeStart={timeStart}
                    timeEnd={timeEnd}
                    width={timelineWidth}
                    zoom={zoom}
                    locale={locale}
                  />
                </div>

                {/* Sticky header space for group labels */}
                <div 
                  className="sticky top-0 left-0 bg-muted border-r border-b z-30"
                  style={{ width: `${groupBarWidth}px`, height: '60px' }}
                />

                {/* Sticky Group Labels - stays visible during horizontal scroll */}
                <div 
                  className="sticky left-0 bg-muted border-r z-50"
                  style={{ 
                    width: `${groupBarWidth}px`,
                    top: '60px',
                    height: `${groups.length * groupHeight}px` 
                  }}
                >
                  {groups.map((group, index) => (
                    <div
                      key={group.id}
                      className="absolute flex items-center px-4 border-b border-r bg-muted"
                      style={{ 
                        height: groupHeight,
                        top: `${index * groupHeight}px`,
                        width: `${groupBarWidth}px`,
                        left: 0
                      }}
                    >
                      {renderGroup({ group })}
                    </div>
                  ))}
                </div>

                {/* Current time indicator for content area */}
                <div
                  className="absolute w-0.5 bg-destructive z-40 pointer-events-none"
                  style={{
                    left: `${groupBarWidth + (dayjs().diff(dayjs(timeStart)) / totalDuration) * timelineWidth}px`,
                    top: '60px',
                    height: `${groups.length * groupHeight}px`,
                    display:
                      dayjs().isAfter(dayjs(timeStart)) &&
                      dayjs().isBefore(dayjs(timeEnd))
                        ? "block"
                        : "none",
                  }}
                />

                {/* Timeline Content Area - offset by header height and group label width */}
                <div
                  className="absolute"
                  style={{
                    left: `${groupBarWidth}px`,
                    top: '60px',
                    width: `${timelineWidth}px`,
                    height: `${groups.length * groupHeight}px`,
                  }}
                >
                  {groups.map((group, index) => (
                    <TimelineGroup
                      key={group.id}
                      group={group}
                      categories={categories}
                      items={items.filter(
                        (item) => item.group === group.id,
                      )}
                      timeStart={timeStart}
                      timeEnd={timeEnd}
                      height={groupHeight}
                      top={index * groupHeight}
                      selectedItem={selectedItem}
                      selectable={selectable}
                      onItemClick={handleItemClick}
                      onItemMove={editable ? onItemMove : undefined}
                      onItemResize={editable ? onItemResize : undefined}
                      getTimeFromPosition={getTimeFromPosition}
                      getGroupFromPosition={getGroupFromPosition}
                      timelineWidth={timelineWidth}
                      locale={locale}
                      itemRenderer={itemRenderer}
                    />
                  ))}
                </div>
              </div>
              </div>
              
              {/* Timeline Legend Footer */}
              {showLegend && (
                <div className="flex-shrink-0">
                  <TimelineLegend 
                    categories={categories} 
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
});

TimelineComponent.displayName = 'Timeline';

export const Timeline = TimelineComponent;