import React, { useState, useRef, useCallback } from 'react';
import { TimelineItem, Category, ItemRendererProps, ItemContext, ItemProps, ResizeProps } from './Timeline';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { GripVertical, LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import dayjs from 'dayjs';

interface TimelineItemProps {
  item: TimelineItem;
  categories: Category[];
  position: { left: string; width: string };
  height: number;
  isSelected: boolean;
  selectable?: boolean;
  onClick: () => void;
  onMove?: (itemId: string, dragTime: Date, newGroupId: string) => void;
  onResize?: (itemId: string, newStart: Date, newEnd: Date) => void;
  getTimeFromPosition: (x: number) => Date;
  getGroupFromPosition: (y: number) => string;
  timeStart: Date;
  timeEnd: Date;
  locale?: string;
  itemRenderer?: (props: ItemRendererProps) => React.ReactNode;
}

export function TimelineItemComponent({
  item,
  categories,
  position,
  height,
  isSelected,
  selectable = true,
  onClick,
  onMove,
  onResize,
  getTimeFromPosition,
  getGroupFromPosition,
  locale = 'en',
  itemRenderer,
}: TimelineItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);

  const formatTime = (date: Date) => {
    // Use 24-hour format for Dutch and other European locales
    const use24Hour = ['nl', 'de', 'fr', 'es', 'pt', 'ru'].includes(locale);
    return dayjs(date).locale(locale).format(use24Hour ? 'HH:mm' : 'LT');
  };

  const formatDuration = () => {
    const itemStartDay = dayjs(item.start).locale(locale);
    const itemEndDay = dayjs(item.end).locale(locale);
    const durationMinutes = itemEndDay.diff(itemStartDay, 'minute');
    const totalHours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    // If duration is more than 24 hours, show days and hours
    if (totalHours >= 24) {
      const days = Math.floor(totalHours / 24);
      const remainingHours = totalHours % 24;
      
      if (remainingHours > 0) {
        return `${days}d ${remainingHours}h`;
      }
      return `${days}d`;
    }
    
    // For less than 24 hours, show hours and minutes
    if (totalHours > 0) {
      return `${totalHours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get icon component from lucide-react
  const getIconComponent = (iconName: string): LucideIcon | null => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || null;
  };

  const renderIcon = (position: "left" | "right") => {
    if (!item.icon || item.icon.position !== position) return null;
    
    const IconComponent = getIconComponent(item.icon.name);
    if (!IconComponent) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex-shrink-0">
              <IconComponent className="w-4 h-4 opacity-70" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{item.icon.text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Get category styling or default gray
  const getCategoryStyle = () => {
    if (!item.category) {
      return {
        backgroundColor: '#6b7280', // gray-500
        color: '#000000'
      };
    }
    
    const category = categories.find(cat => cat.id === item.category);
    if (!category) {
      return {
        backgroundColor: '#6b7280', // gray-500
        color: '#000000'
      };
    }
    
    return {
      backgroundColor: category.background_color,
      color: category.text_color
    };
  };

  const categoryStyle = getCategoryStyle();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    const rect = itemRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const relativeX = e.clientX - rect.left;
    
    // Check if clicking near edges for resize
    if (relativeX < 8 && onResize) {
      setIsResizing('left');
    } else if (relativeX > rect.width - 8 && onResize) {
      setIsResizing('right');
    } else if (onMove) {
      setIsDragging(true);
    }
    
    // Prevent text selection
    document.body.style.userSelect = 'none';
  }, [onMove, onResize]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && onMove) {
      const newTime = getTimeFromPosition(e.clientX);
      const newGroup = getGroupFromPosition(e.clientY);
      onMove(item.id, newTime, newGroup);
    } else if (isResizing && onResize) {
      const newTime = getTimeFromPosition(e.clientX);
      
      if (isResizing === 'left') {
        const newStart = dayjs(newTime).isBefore(dayjs(item.end).subtract(1, 'minute')) 
          ? newTime 
          : dayjs(item.end).subtract(1, 'minute').toDate();
        onResize(item.id, newStart, item.end);
      } else if (isResizing === 'right') {
        const newEnd = dayjs(newTime).isAfter(dayjs(item.start).add(1, 'minute')) 
          ? newTime 
          : dayjs(item.start).add(1, 'minute').toDate();
        onResize(item.id, item.start, newEnd);
      }
    }
  }, [isDragging, isResizing, onMove, onResize, getTimeFromPosition, getGroupFromPosition, item]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
    document.body.style.userSelect = '';
  }, []);

  // Add global mouse event listeners
  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const itemClasses = `
    absolute rounded-md shadow-sm border transition-all duration-200 group
    ${selectable ? 'cursor-pointer' : 'cursor-default'}
    ${isSelected 
      ? 'ring-2 ring-primary ring-offset-1 shadow-md z-20' 
      : (selectable ? 'hover:shadow-md hover:scale-105 z-10' : 'z-10')
    }
    ${isDragging ? 'opacity-80 scale-105 z-30' : ''}
  `;

  // If custom itemRenderer is provided, use it
  if (itemRenderer) {
    const itemContext: ItemContext = {
      title: item.title,
      dimensions: {
        height: height - 12,
        width: position.width,
      },
      useResizeHandle: Boolean(onResize && isSelected),
      selected: isSelected,
      canMove: Boolean(onMove),
      canResize: Boolean(onResize),
    };

    const getItemProps = (props?: Partial<ItemProps>): ItemProps => ({
      style: {
        position: 'absolute',
        ...position,
        height: `${height - 12}px`,
        top: '6px',
        minWidth: '2px',
        backgroundColor: categoryStyle.backgroundColor,
        color: categoryStyle.color,
        ...item.style,
        ...props?.style,
      },
      className: `${itemClasses} ${props?.className || ''}`,
      onMouseDown: props?.onMouseDown || handleMouseDown,
      onClick: props?.onClick || ((e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectable) {
          onClick();
        }
      }),
      children: props?.children,
    });

    const getResizeProps = () => ({
      left: {
        style: { left: '-1px' },
        className: "absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity",
        onMouseDown: (e: React.MouseEvent) => {
          e.stopPropagation();
          setIsResizing('left');
          document.body.style.userSelect = 'none';
        },
      } as ResizeProps,
      right: {
        style: { right: '-1px' },
        className: "absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity",
        onMouseDown: (e: React.MouseEvent) => {
          e.stopPropagation();
          setIsResizing('right');
          document.body.style.userSelect = 'none';
        },
      } as ResizeProps,
    });

    return (
      <div ref={itemRef}>
        {itemRenderer({
          item,
          itemContext,
          getItemProps,
          getResizeProps,
        })}
      </div>
    );
  }

  // Default rendering
  return (
    <div
      ref={itemRef}
      className={itemClasses}
      style={{
        ...position,
        height: `${height - 12}px`,
        top: '6px',
        minWidth: '2px',
        backgroundColor: categoryStyle.backgroundColor,
        color: categoryStyle.color,
        ...item.style,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        if (selectable) {
          onClick();
        }
      }}
    >
      {/* Resize handles */}
      {onResize && isSelected && (
        <>
          <div 
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: '-1px' }}
          />
          <div 
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ right: '-1px' }}
          />
        </>
      )}

      {/* Content */}
      <div className="flex items-center justify-between h-full px-2 overflow-hidden">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {/* Left icon */}
          {renderIcon("left")}
          
          <div className="flex-1 min-w-0">
            {item.show_duration ? (
              // Show full content when show_duration is true
              <>
                <div className="text-sm truncate font-medium">
                  {item.title}
                </div>
                <div className="text-xs opacity-80 truncate">
                  {formatTime(item.start)} - {formatTime(item.end)}
                </div>
              </>
            ) : (
              // Show only centered title when show_duration is false
              <div className="flex items-center h-full">
                <div className="text-sm truncate font-medium">
                  {item.title}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Duration badge - only show if show_duration is true and item is wide enough */}
          {item.show_duration && position.width.replace('%', '') && parseFloat(position.width.replace('%', '')) > 10 && (
            <Badge variant="secondary" className="text-xs">
              {formatDuration()}
            </Badge>
          )}

          {/* Right icon */}
          {renderIcon("right")}

          {/* Drag handle */}
          {onMove && (
            <GripVertical className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
    </div>
  );
}