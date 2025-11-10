import dayjs from 'dayjs';

interface TimelineHeaderProps {
  timeStart: Date;
  timeEnd: Date;
  width: number;
  zoom: number;
  locale?: string;
  visibleStart: Date;
  visibleEnd: Date;
}

export function TimelineHeader({ timeStart, timeEnd, width, zoom, locale = 'en', visibleStart, visibleEnd }: TimelineHeaderProps) {
  const totalDuration = dayjs(timeEnd).diff(dayjs(timeStart));

  // Create dayjs instances with the specified locale
  const createLocalizedDayjs = (date: Date | dayjs.Dayjs) => dayjs(date).locale(locale);

  // Calculate what's actually visible in the viewport at current zoom
  const baseVisibleDuration = dayjs(visibleEnd).diff(dayjs(visibleStart));
  const actualVisibleDuration = baseVisibleDuration / zoom;

  // Convert to days for easier threshold comparison
  const visibleDays = actualVisibleDuration / (24 * 60 * 60 * 1000);
  
  // Calculate major intervals (top row) that span across minor intervals
  const getMajorIntervals = () => {
    const intervals = [];

    let intervalUnit: 'day' | 'month' | 'year' | 'quarter';
    let formatString: string;

    // Determine format based on actual visible duration (not zoom percentage)
    if (visibleDays <= 3) {
      // Very zoomed in: < 3 days visible - show days (when hours are shown below)
      intervalUnit = 'day';
      formatString = 'ddd MMM D';
    } else if (visibleDays <= 60) {
      // Zoomed in to normal: 3-60 days visible - show months (when days are shown below)
      intervalUnit = 'month';
      formatString = 'MMMM YYYY';
    } else if (visibleDays <= 180) {
      // Zoomed out: 60-180 days visible - show quarters (when months are shown below)
      intervalUnit = 'quarter';
      formatString = ''; // Custom formatting for quarters
    } else {
      // Very zoomed out: > 180 days visible - show years (when months are shown below)
      intervalUnit = 'year';
      formatString = 'YYYY';
    }

    const timeStartDay = createLocalizedDayjs(timeStart);
    const timeEndDay = createLocalizedDayjs(timeEnd);

    // Special handling for quarters
    if (intervalUnit === 'quarter') {
      // Calculate the quarter start month for a given date
      const getQuarterStartMonth = (date: dayjs.Dayjs) => {
        const month = date.month(); // 0-11
        return Math.floor(month / 3) * 3; // 0, 3, 6, or 9
      };

      // Start from the beginning of the quarter containing timeStart
      const startQuarterMonth = getQuarterStartMonth(timeStartDay);
      let current = timeStartDay.year(timeStartDay.year()).month(startQuarterMonth).startOf('month');

      while (current.isBefore(timeEndDay)) {
        const intervalStart = current;
        const intervalEnd = current.add(3, 'month'); // Quarter = 3 months

        // Calculate position and width
        const startPosition = Math.max(0, (intervalStart.diff(timeStartDay) / totalDuration) * 100);
        const endPosition = Math.min(100, (intervalEnd.diff(timeStartDay) / totalDuration) * 100);
        const widthPercent = endPosition - startPosition;

        // Only add if the interval is visible
        if (widthPercent > 0 && startPosition < 100) {
          const quarter = Math.floor(intervalStart.month() / 3) + 1;
          const year = intervalStart.year();
          intervals.push({
            date: intervalStart.toDate(),
            startPosition,
            widthPercent,
            label: `Q${quarter} ${year}`
          });
        }

        current = intervalEnd;
      }
    } else {
      // Standard handling for day, month, year
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
    }

    return intervals;
  };

  // Calculate minor intervals (bottom row)
  const getMinorIntervals = () => {
    const intervals = [];

    let intervalUnit: 'hour' | 'day' | 'month';
    let intervalAmount: number;
    let formatString: string;

    // Use 24-hour format for Dutch and other European locales
    const use24Hour = ['nl', 'de', 'fr', 'es', 'pt', 'ru'].includes(locale);

    // Determine format based on actual visible duration (not zoom percentage)
    if (visibleDays <= 3) {
      // Very zoomed in: < 3 days visible - show hours (with days above)
      intervalUnit = 'hour';
      intervalAmount = 1;
      formatString = use24Hour ? 'H' : 'h A';
    } else if (visibleDays <= 60) {
      // Zoomed in to normal: 3-60 days visible - show day numbers only (with months above)
      intervalUnit = 'day';
      intervalAmount = 1;
      formatString = 'D'; // Just day number (e.g., "22")
    } else if (visibleDays <= 180) {
      // Zoomed out: 60-180 days visible - show months (with quarters above)
      intervalUnit = 'month';
      intervalAmount = 1;
      formatString = 'MMM';
    } else {
      // Very zoomed out: > 180 days visible - show months (with years above)
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