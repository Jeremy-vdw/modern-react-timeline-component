import dayjs from 'dayjs';

interface TimelineHeaderProps {
  timeStart: Date;
  timeEnd: Date;
  width: number;
  zoom: number;
  locale?: string;
}

export function TimelineHeader({ timeStart, timeEnd, width, zoom, locale = 'en' }: TimelineHeaderProps) {
  const totalDuration = dayjs(timeEnd).diff(dayjs(timeStart));
  
  // Create dayjs instances with the specified locale
  const createLocalizedDayjs = (date: Date | dayjs.Dayjs) => dayjs(date).locale(locale);
  
  // Calculate major intervals (top row) that span across minor intervals
  const getMajorIntervals = () => {
    const intervals = [];
    
    let intervalUnit: 'day' | 'month' | 'year';
    let formatString: string;
    
    // Proper hierarchy: top row should be one level above bottom row
    if (zoom >= 4) {
      // Very zoomed in (400%+) - show days (when hours are shown below)
      intervalUnit = 'day';
      formatString = 'ddd MMM D';
    } else if (zoom >= 2) {
      // 200% zoom - show months (when day descriptions are shown below)
      intervalUnit = 'month';
      formatString = 'MMMM YYYY';
    } else if (zoom >= 0.5) {
      // Default zoom - show months (when days are shown below)
      intervalUnit = 'month';
      formatString = 'MMMM YYYY';
    } else {
      // Zoomed out - show years (when months/weeks are shown below)
      intervalUnit = 'year';
      formatString = 'YYYY';
    }
    
    const timeStartDay = createLocalizedDayjs(timeStart);
    const timeEndDay = createLocalizedDayjs(timeEnd);
    let current = timeStartDay.startOf(intervalUnit);
    
    // Find the first interval boundary before or at timeStart
    while (current.isAfter(timeStartDay)) {
      current = current.subtract(1, intervalUnit);
    }
    
    while (current.isBefore(timeEndDay)) {
      const intervalStart = current;
      const intervalEnd = current.add(1, intervalUnit);
      
      // Calculate position and width
      const startPosition = Math.max(0, (intervalStart.diff(timeStartDay) / totalDuration) * 100);
      const endPosition = Math.min(100, (intervalEnd.diff(timeStartDay) / totalDuration) * 100);
      const widthPercent = endPosition - startPosition;
      
      // Only add if the interval is visible
      if (widthPercent > 0 && startPosition < 100) {
        intervals.push({
          date: intervalStart.toDate(),
          startPosition,
          widthPercent,
          label: intervalStart.format(formatString)
        });
      }
      
      current = intervalEnd;
    }
    
    return intervals;
  };

  // Calculate minor intervals (bottom row)
  const getMinorIntervals = () => {
    const intervals = [];
    
    let intervalUnit: 'hour' | 'day' | 'month';
    let intervalAmount: number;
    let formatString: string;
    
    // Bottom row intervals that match the hierarchy
    if (zoom >= 4) {
      // Very zoomed in (400%+) - show hours (with days above)
      intervalUnit = 'hour';
      intervalAmount = 1; // 1-hour blocks at 400%+
      // Use 24-hour format for Dutch and other European locales
      const use24Hour = ['nl', 'de', 'fr', 'es', 'pt', 'ru'].includes(locale);
      formatString = use24Hour ? 'H' : 'h A';
    } else if (zoom >= 2) {
      // 200% zoom - show day descriptions (with months above)
      intervalUnit = 'day';
      intervalAmount = 1;
      // Dutch format: "zo. 28 sep", others: "zo. sep 28"
      formatString = locale === 'nl' ? 'ddd D MMM' : 'ddd MMM D';
    } else if (zoom >= 0.5) {
      // Default zoom - show days (with months above)
      intervalUnit = 'day';
      intervalAmount = 1;
      formatString = 'D';
    } else {
      // Zoomed out - show months (with years above)
      intervalUnit = 'month';
      intervalAmount = 1;
      formatString = 'MMM';
    }
    
    const timeStartDay = createLocalizedDayjs(timeStart);
    const timeEndDay = createLocalizedDayjs(timeEnd);
    let current = timeStartDay.startOf(intervalUnit);
    
    // Find the first interval boundary after timeStart
    while (current.isBefore(timeStartDay)) {
      current = current.add(intervalAmount, intervalUnit);
    }
    
    while (current.isBefore(timeEndDay)) {
      const position = (current.diff(timeStartDay) / totalDuration) * 100;
      intervals.push({
        date: current.toDate(),
        position,
        label: current.format(formatString)
      });
      current = current.add(intervalAmount, intervalUnit);
    }
    
    return intervals;
  };

  const majorIntervals = getMajorIntervals();
  const minorIntervals = getMinorIntervals();

  return (
    <div 
      className="bg-background border-b relative"
      style={{ width: `${width}px`, height: '60px' }}
    >
      {/* Current time indicator */}
      <div className="absolute top-0 w-0.5 bg-destructive z-30" 
           style={{ 
             left: `${(createLocalizedDayjs(new Date()).diff(createLocalizedDayjs(timeStart)) / totalDuration) * width}px`,
             height: '100%',
             display: createLocalizedDayjs(new Date()).isAfter(createLocalizedDayjs(timeStart)) && createLocalizedDayjs(new Date()).isBefore(createLocalizedDayjs(timeEnd)) ? 'block' : 'none',
             transform: 'translateZ(0)' // Force hardware acceleration
           }}>
      </div>

      {/* Top Row - Major Intervals (Spanning) */}
      <div className="relative h-7 border-b bg-muted/30">
        {majorIntervals.map((interval, index) => (
          <div
            key={`major-${index}`}
            className="absolute top-0 bottom-0 border-r border-border/50 bg-muted/10 flex items-center justify-center"
            style={{ 
              left: `${interval.startPosition}%`,
              width: `${interval.widthPercent}%`
            }}
          >
            <span className="text-xs font-medium text-foreground/80 truncate px-2">
              {interval.label}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Row - Minor Intervals */}
      <div className="relative h-8 bg-muted/10">
        {minorIntervals.map((interval, index) => {
          // Calculate width to next interval or end
          const nextInterval = minorIntervals[index + 1];
          const endPosition = nextInterval ? nextInterval.position : 100;
          const widthPercent = endPosition - interval.position;
          
          // Calculate actual pixel width for dynamic font sizing
          const actualWidth = (widthPercent / 100) * width;
          
          // Dynamic font sizing based on available width
          // More aggressive sizing to ensure text always fits
          let fontSize = '12px';
          let fontClass = 'text-xs';
          let paddingClass = 'px-1';
          
          if (actualWidth < 16) {
            // Extremely narrow - smallest font, no padding
            fontSize = '7px';
            fontClass = 'text-4xs';
            paddingClass = 'px-0';
          } else if (actualWidth < 20) {
            // Very narrow - tiny font, minimal padding
            fontSize = '8px';
            fontClass = 'text-3xs';
            paddingClass = 'px-0.5';
          } else if (actualWidth < 28) {
            // Narrow - small font
            fontSize = '9px';
            fontClass = 'text-2xs';
            paddingClass = 'px-0.5';
          } else if (actualWidth < 36) {
            // Medium narrow - small font with standard padding
            fontSize = '10px';
            fontClass = 'text-2xs';
            paddingClass = 'px-1';
          } else if (actualWidth < 44) {
            // Medium - small font with standard padding
            fontSize = '11px';
            fontClass = 'text-xs';
            paddingClass = 'px-1';
          }
          // For wider widths, keep default text-xs (12px)
          
          return (
            <div
              key={`minor-${index}`}
              className="absolute top-0 bottom-0 border-r border-border/30 flex items-center justify-center hover:bg-muted/20 transition-colors"
              style={{ 
                left: `${interval.position}%`,
                width: `${widthPercent}%`,
                overflow: 'visible' // Allow text to overflow if needed
              }}
            >
              <span 
                className={`${fontClass} text-muted-foreground ${paddingClass} font-medium`}
                style={{ 
                  fontSize: fontSize,
                  lineHeight: '1',
                  minWidth: 0, // Allow text to shrink below its content size
                  whiteSpace: 'nowrap', // Prevent wrapping
                  overflow: 'visible', // Allow text to be visible even if slightly wider than container
                  textAlign: 'center',
                  width: '100%'
                }}
              >
                {interval.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}