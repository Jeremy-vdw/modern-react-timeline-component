import React from 'react';
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
}

export function TimelineGroup({
  categories,
  items,
  timeStart,
  timeEnd,
  height,
  top,
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
}: TimelineGroupProps) {
  const totalDuration = dayjs(timeEnd).diff(dayjs(timeStart));

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

  return (
    <div
      className="absolute border-b border-border bg-background hover:bg-muted/20 transition-colors"
      style={{ 
        height: `${height}px`, 
        top: `${top}px`,
        width: `${timelineWidth}px`,
        left: 0
      }}
    >
      {/* Daily grid lines */}
      <div className="absolute inset-0 z-5 pointer-events-none">
        {(() => {
          const lines = [];
          const timeStartDay = dayjs(timeStart);
          const timeEndDay = dayjs(timeEnd);
          
          // Start from the beginning of the first day
          let currentDay = timeStartDay.startOf('day');
          
          // Create a line for each day boundary
          while (currentDay.isBefore(timeEndDay) || currentDay.isSame(timeEndDay, 'day')) {
            const dayRatio = (currentDay.valueOf() - timeStartDay.valueOf()) / totalDuration;
            const leftPosition = dayRatio * timelineWidth;
            
            // Only show lines that are within the visible timeline
            if (leftPosition >= 0 && leftPosition <= timelineWidth) {
              lines.push(
                <div
                  key={currentDay.format('YYYY-MM-DD')}
                  className="absolute top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600 opacity-40"
                  style={{ left: `${leftPosition}px` }}
                />
              );
            }
            
            currentDay = currentDay.add(1, 'day');
          }
          
          return lines;
        })()}
      </div>

      {/* Timeline Items */}
      {items.map((item) => {
        const position = getItemPosition(item);
        const isVisible = dayjs(item.end).isAfter(dayjs(timeStart)) && 
                         dayjs(item.start).isBefore(dayjs(timeEnd));
        
        if (!isVisible) return null;

        return (
          <TimelineItemComponent
            key={item.id}
            item={item}
            categories={categories}
            position={position}
            height={height}
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
}