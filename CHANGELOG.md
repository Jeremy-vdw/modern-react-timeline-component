# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-16

### Added
- **Custom Group Header Renderer**: New `groupHeaderRenderer` prop allows customization of the header area (top-left corner above group labels)
  - Receives `width` and `height` props for proper sizing
  - Enables branding, logos, summary information, or custom styling
  - Works in both sticky and non-sticky header modes
  - Fully backward compatible with default renderer

- **Automatic Item Stacking**: Items that overlap in time are now automatically stacked vertically in separate lanes
  - Collision detection algorithm assigns items to lanes
  - Dynamic group heights adjust based on number of lanes needed
  - Works seamlessly with drag-and-drop
  - No manual positioning required

- **Variable Row Height**: New `rowHeight` prop with preset options (40px, 60px, 80px, 100px)
  - Allows customization from compact to spacious layouts
  - Affects both group heights and item heights
  - Integrated with item stacking feature

### Fixed
- **Custom Item Renderer Refresh**: Timeline now properly re-renders when switching between default and custom item renderers
  - Added `itemRenderer` to `TimelineItem` memo comparison function
  - Added `itemRenderer` to `TimelineGroup` memo comparison function
  
- **Item Stacking with Custom Renderers**: Overlapping items now properly stack vertically even when using custom item renderers
  - Fixed hardcoded `top: '6px'` in custom renderer's `getItemProps()`
  - Now uses lane-based positioning calculation for both default and custom renderers

### Changed
- Removed full-width demo from examples (internal change, no library impact)
- Simplified examples/main.tsx to focus on standard demo

### Technical Details
- Created `src/utils/laneAssignment.ts` for collision detection and lane assignment
- Updated Timeline component to calculate lane assignments using `useMemo`
- Updated TimelineGroup to pass lane information to items
- Updated TimelineItem to position based on assigned lane
- Exported `GroupHeaderRendererProps` type in index.ts

## [0.1.0-beta] - Initial Beta Release

### Added
- Initial release of Modern React Timeline Component
- Interactive drag-and-drop functionality
- Zoom in/out controls
- Sticky headers with smooth scrolling
- Customizable item and group rendering
- Multi-language support (11+ locales)
- Category-based styling
- Custom icons with tooltips
- Resize items by dragging edges
- Full TypeScript support
- Built with Tailwind CSS and shadcn/ui

[0.1.0]: https://github.com/Jeremy-vdw/modern-react-timeline-component/compare/v0.1.0-beta...v0.1.0
[0.1.0-beta]: https://github.com/Jeremy-vdw/modern-react-timeline-component/releases/tag/v0.1.0-beta

