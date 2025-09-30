import { Category } from './Timeline';

interface TimelineLegendProps {
  categories: Category[];
}

export function TimelineLegend({ 
  categories 
}: TimelineLegendProps) {
  return (
    <div className="border-t bg-muted/30 p-4">
      <div className="flex items-center gap-3 flex-wrap justify-end">
        {categories.map((category) => (
          <div 
            key={category.id} 
            className="flex items-center gap-2"
          >
            <div
              className="w-4 h-4 rounded-sm border border-border/50"
              style={{
                backgroundColor: category.background_color,
              }}
            />
            <span className="text-xs text-foreground">
              {category.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}