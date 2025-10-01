# Modern React Timeline Component

A modern, feature-rich timeline/calendar component for React applications. Built with TypeScript, Tailwind CSS, and shadcn/ui components.

## Features

✨ **Interactive & Modern**
- 🎯 Drag and drop items between groups
- 🔍 Zoom in/out functionality
- 📅 Sticky headers with smooth scrolling
- 🎨 Customizable item and group rendering
- 🌍 Multi-language support (11+ locales)

⚡ **Powerful**
- 📊 Category-based styling
- 🎭 Custom icons with tooltips
- 📐 Resize items by dragging edges
- ⌨️ Keyboard accessible
- 🎬 Smooth animations

🛠️ **Developer Friendly**
- 💪 Full TypeScript support
- 🎨 Built with Tailwind CSS
- 📦 Tree-shakeable
- 🔧 Highly customizable
- 📖 Comprehensive type definitions

## Installation

```bash
npm install modern-react-timeline-component
# or
yarn add modern-react-timeline-component
# or
pnpm add modern-react-timeline-component
```

### Peer Dependencies

Make sure you have these installed:

```bash
npm install react react-dom dayjs lucide-react
```

### Setup Tailwind CSS

This component requires Tailwind CSS. Add the component path to your `tailwind.config.js`:

```js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/modern-react-timeline-component/dist/**/*.{js,mjs}',
  ],
  // ... rest of your config
}
```

### Import Styles

Import the component styles in your main CSS file or entry point:

```tsx
import 'modern-react-timeline-component/styles';
```

## Quick Start

```tsx
import { Timeline, TimelineItem, TimelineGroupData, Category } from 'modern-react-timeline-component';
import 'modern-react-timeline-component/styles';

const groups: TimelineGroupData[] = [
  { id: 'group-1', title: 'Team Alpha' },
  { id: 'group-2', title: 'Team Beta' },
];

const categories: Category[] = [
  { 
    id: 'dev', 
    title: 'Development',
    background_color: '#3b82f6',
    text_color: '#ffffff'
  },
];

const items: TimelineItem[] = [
  {
    id: '1',
    group: 'group-1',
    title: 'Project Kickoff',
    start: new Date('2024-01-15T09:00:00'),
    end: new Date('2024-01-15T17:00:00'),
    category: 'dev',
  },
];

function App() {
  return (
    <div className="h-screen p-4">
      <Timeline
        groups={groups}
        categories={categories}
        items={items}
        locale="en"
        editable={true}
        selectable={true}
        showLegend={true}
        showControls={true}
      />
    </div>
  );
}
```

## Props

### Timeline Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `groups` | `TimelineGroupData[]` | **required** | Array of group/row definitions |
| `categories` | `Category[]` | **required** | Array of category definitions for styling |
| `items` | `TimelineItem[]` | **required** | Array of timeline items to display |
| `locale` | `string` | `'en'` | Locale code for date/time formatting |
| `defaultTimeStart` | `Date` | 6 months ago | Start of the total scrollable range |
| `defaultTimeEnd` | `Date` | 6 months ahead | End of the total scrollable range |
| `visibleTimeStart` | `Date` | 3 days ago | Initial visible range start |
| `visibleTimeEnd` | `Date` | 4 days ahead | Initial visible range end |
| `stickyHeader` | `boolean` | `true` | Enable sticky date headers |
| `editable` | `boolean` | `true` | Allow drag and resize |
| `selectable` | `boolean` | `true` | Allow item selection |
| `showLegend` | `boolean` | `true` | Show category legend |
| `showControls` | `boolean` | `true` | Show zoom/navigation controls |
| `groupBarWidth` | `number` | `192` | Width of the group labels column (px) |
| `selectedItemId` | `string \| null` | `null` | ID of currently selected item |
| `groupRenderer` | `function` | - | Custom group label renderer |
| `itemRenderer` | `function` | - | Custom item renderer |
| `controlsRenderer` | `function` | - | Custom controls renderer |
| `onItemClick` | `function` | - | Called when item is clicked |
| `onItemSelect` | `function` | - | Called when item selection changes |
| `onItemMove` | `function` | - | Called when item is dragged |
| `onItemResize` | `function` | - | Called when item is resized |

### Type Definitions

#### TimelineGroupData
```typescript
interface TimelineGroupData {
  id: string;
  title: string;
  height?: number;
  [key: string]: any; // Additional custom properties
}
```

#### TimelineItem
```typescript
interface TimelineItem {
  id: string;
  group: string;  // References group id
  title: string;
  start: Date;
  end: Date;
  show_duration?: boolean;
  icon?: {
    name: string;           // Icon name from lucide-react
    text: string;           // Tooltip text
    position: "left" | "right";
  };
  category?: string;        // References category id
  style?: React.CSSProperties;
}
```

#### Category
```typescript
interface Category {
  id: string;
  title: string;
  background_color: string;
  text_color: string;
}
```

## Advanced Usage

### Custom Item Renderer

```tsx
import { ItemRendererProps } from 'modern-react-timeline-component';

const customItemRenderer = ({ item, itemContext, getItemProps, getResizeProps }: ItemRendererProps) => {
  const { left: leftResize, right: rightResize } = getResizeProps();
  const itemProps = getItemProps();

  return (
    <div {...itemProps}>
      {itemContext.useResizeHandle && <div {...leftResize} />}
      
      <div className="p-2">
        <h4>{itemContext.title}</h4>
        <p>{item.category}</p>
      </div>
      
      {itemContext.useResizeHandle && <div {...rightResize} />}
    </div>
  );
};

<Timeline
  itemRenderer={customItemRenderer}
  // ... other props
/>
```

### Custom Group Renderer

```tsx
const customGroupRenderer = ({ group }) => (
  <div className="flex items-center gap-2">
    <Avatar src={group.avatar} />
    <div>
      <div className="font-bold">{group.title}</div>
      <div className="text-sm text-gray-500">{group.description}</div>
    </div>
  </div>
);

<Timeline
  groupRenderer={customGroupRenderer}
  // ... other props
/>
```

### Custom Controls Renderer

```tsx
import { ControlsRendererProps } from 'modern-react-timeline-component';

const customControlsRenderer = ({ controls, state }: ControlsRendererProps) => (
  <div className="flex gap-2 p-4">
    <button onClick={controls.zoomIn} disabled={!state.canZoomIn}>
      Zoom In
    </button>
    <button onClick={controls.zoomOut} disabled={!state.canZoomOut}>
      Zoom Out
    </button>
    <button onClick={controls.goHome}>
      Reset
    </button>
    <span>Zoom: {Math.round(state.zoom * 100)}%</span>
  </div>
);

<Timeline
  controlsRenderer={customControlsRenderer}
  // ... other props
/>
```

### Scroll to Group Programmatically

```tsx
import { useRef } from 'react';
import { Timeline, TimelineRef } from 'modern-react-timeline-component';

function App() {
  const timelineRef = useRef<TimelineRef>(null);

  const scrollToGroup = (groupId: string) => {
    timelineRef.current?.scrollToGroup(groupId);
  };

  return (
    <>
      <button onClick={() => scrollToGroup('group-1')}>
        Go to Team Alpha
      </button>
      <Timeline
        ref={timelineRef}
        // ... other props
      />
    </>
  );
}
```

### Event Handlers

```tsx
<Timeline
  onItemClick={(item) => {
    console.log('Item clicked:', item);
  }}
  onItemMove={(itemId, newTime, newGroupId) => {
    console.log('Item moved:', itemId, newTime, newGroupId);
    // Update your state here
  }}
  onItemResize={(itemId, newStart, newEnd) => {
    console.log('Item resized:', itemId, newStart, newEnd);
    // Update your state here
  }}
  // ... other props
/>
```

## Supported Locales

The component supports 11+ locales with proper date/time formatting:

- 🇬🇧 English (`en`)
- 🇪🇸 Spanish (`es`)
- 🇫🇷 French (`fr`)
- 🇩🇪 German (`de`)
- 🇳🇱 Dutch (`nl`)
- 🇯🇵 Japanese (`ja`)
- 🇨🇳 Chinese (`zh`)
- 🇵🇹 Portuguese (`pt`)
- 🇷🇺 Russian (`ru`)
- 🇸🇦 Arabic (`ar`)
- 🇮🇳 Hindi (`hi`)

## Styling

The component uses Tailwind CSS classes. You can customize the theme by extending your Tailwind configuration:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Override timeline colors
        primary: {
          DEFAULT: '#your-color',
          // ... 
        },
      },
    },
  },
}
```

## License

MIT © Jeremie Van de Walle

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please file an issue on the [GitHub repository](https://github.com/Jeremy-vdw/modern-react-timeline-component/issues).