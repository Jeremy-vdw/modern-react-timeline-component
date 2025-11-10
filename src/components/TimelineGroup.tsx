import React, { memo, useMemo } from 'react';
import { TimelineItem, TimelineGroupData, Category, ItemRendererProps } from './Timeline';
import { TimelineItemComponent } from './TimelineItem';
import dayjs from 'dayjs';

interface TimelineGroupProps {
  group: TimelineGroupData;
  categories: Category[];
  items: TimelineItem[];
  timeStart: Date;
  timeEnd: Date;
  height: number;
  top: number;
  laneHeight: number;
  itemLanes: Map<string, number>;
  selectedItem: string | null;
  selectable?: boolean;
  onItemClick: (item: TimelineItem) => void;
  onItemMove?: (itemId: string, dragTime: Date, newGroupId: string) => void;
  onItemResize?: (itemId: string, newStart: Date, newEnd: Date) => void;
  getTimeFromPosition: (x: number) => Date;
  getGroupFromPosition: (y: number) => string;
  timelineWidth: number;
  locale?: string;
  itemRenderer?: (props: ItemRendererProps) => React.ReactNode;
  visibleStart: Date;
  visibleEnd: Date;
  zoom: number;
}

const TimelineGroupComponent = ({
  categories,
  items,
  timeStart,
  timeEnd,
  height,
  top,
  laneHeight,
  itemLanes,
  selectedItem,
  selectable = true,
  onItemClick,
  onItemMove,
  onItemResize,
  getTimeFromPosition,
  getGroupFromPosition,
  timelineWidth,
  locale = 'en',
  itemRenderer,
  visibleStart,
  visibleEnd,
  zoom,
}: TimelineGroupProps) => {
  const totalDuration = dayjs(timeEnd).diff(dayjs(timeStart));

  // Calculate what's actually visible at current zoom
  const baseVisibleDuration = dayjs(visibleEnd).diff(dayjs(visibleStart));
  const actualVisibleDuration = baseVisibleDuration / zoom;
  const visibleDays = actualVisibleDuration / (24 * 60 * 60 * 1000);

  const getItemPosition = (item: TimelineItem) => {
    const itemStartDay = dayjs(item.start);
    const itemEndDay = dayjs(item.end);
    const timeStartDay = dayjs(timeStart);
    const timeEndDay = dayjs(timeEnd);

    const itemStart = Math.max(itemStartDay.valueOf(), timeStartDay.valueOf());
    const itemEnd = Math.min(itemEndDay.valueOf(), timeEndDay.valueOf());

    const leftRatio = (itemStart - timeStartDay.valueOf()) / totalDuration;
    const widthRatio = (itemEnd - itemStart) / totalDuration;

    const left = leftRatio * timelineWidth;
    const width = Math.max(widthRatio * timelineWidth, 2); // Minimum 2px width

    return { left: `${left}px`, width: `${width}px` };
  };

  // Memoize grid lines to prevent recalculation on every render
  // Optimized: Only render lines that are at least 2px apart for better performance
  // Grid interval adapts based on visible duration to match header granularity
  const gridLines = useMemo(() => {
    const lines = [];
    const timeStartDay = dayjs(timeStart);
    const timeEndDay = dayjs(timeEnd);
    let lastRenderedPosition = -10; // Track last rendered position to avoid overlapping lines

    // Determine grid interval based on visible duration
    let intervalUnit: 'hour' | 'day' | 'month';
    let intervalAmount = 1;

    if (visibleDays <= 3) {
      // Very zoomed in: show hour boundaries
      intervalUnit = 'hour';
    } else if (visibleDays <= 60) {
      // Normal zoom: show day boundaries (current behavior)
      intervalUnit = 'day';
    } else {
      // Zoomed out (quarterly view): show month boundaries
      intervalUnit = 'month';
    }

    // Start from the beginning of the first interval
    let current = timeStartDay.startOf(intervalUnit);

    // Create a line for each interval boundary
    while (current.isBefore(timeEndDay) || current.isSame(timeEndDay, intervalUnit)) {
      const ratio = (current.valueOf() - timeStartDay.valueOf()) / totalDuration;
      const leftPosition = ratio * timelineWidth;

      // Only render if position is within timeline and at least 2px from last line
      if (leftPosition >= 0 && leftPosition <= timelineWidth && leftPosition - lastRenderedPosition >= 2) {
        lines.push(
          <div
            key={current.format('YYYY-MM-DD-HH')}
            className="absolute top-0 bottom-0 w-px"
            style={{ left: `${leftPosition}px`, backgroundColor: '#f5f5f5' }}
          />
        );
        lastRenderedPosition = leftPosition;
      }

      current = current.add(intervalAmount, intervalUnit);
    }

    return lines;
  }, [timeStart, timeEnd, timelineWidth, totalDuration, visibleDays]);

  return (
    <div
      className="absolute border-b border-border bg-background hover:bg-muted/20 transition-colors"
      style={{
        height: `${height}px`,
        top: `${top}px`,
        width: `${timelineWidth}px`,
        left: 0,
        contentVisibility: 'auto' as any, // CSS containment for better performance
      }}
    >
      {/* Daily grid lines */}
      <div className="absolute inset-0 z-5 pointer-events-none">
        {gridLines}
      </div>

      {/* Timeline Items */}
      {items.map((item) => {
        const position = getItemPosition(item);
        const isVisible = dayjs(item.end).isAfter(dayjs(timeStart)) &&
                         dayjs(item.start).isBefore(dayjs(timeEnd));

        if (!isVisible) return null;

        const lane = itemLanes.get(item.id) || 0;

        return (
          <TimelineItemComponent
            key={item.id}
            item={item}
            categories={categories}
            position={position}
            height={laneHeight}
            lane={lane}
            isSelected={selectedItem === item.id}
            selectable={selectable}
            onClick={() => onItemClick(item)}
            onMove={onItemMove}
            onResize={onItemResize}
            getTimeFromPosition={getTimeFromPosition}
            getGroupFromPosition={getGroupFromPosition}
            timeStart={timeStart}
            timeEnd={timeEnd}
            locale={locale}
            itemRenderer={itemRenderer}
          />
        );
      })}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const TimelineGroup = memo(TimelineGroupComponent, (prevProps, nextProps) => {
  // Custom comparison for better performance
  // Only re-render if these specific props change
  return (
    prevProps.group.id === nextProps.group.id &&
    prevProps.items === nextProps.items &&
    prevProps.timeStart === nextProps.timeStart &&
    prevProps.timeEnd === nextProps.timeEnd &&
    prevProps.selectedItem === nextProps.selectedItem &&
    prevProps.height === nextProps.height &&
    prevProps.top === nextProps.top &&
    prevProps.timelineWidth === nextProps.timelineWidth &&
    prevProps.selectable === nextProps.selectable &&
    prevProps.locale === nextProps.locale &&
    prevProps.itemRenderer === nextProps.itemRenderer
  );
});