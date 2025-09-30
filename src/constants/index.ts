// Available locales with their display names
export const AVAILABLE_LOCALES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हিন্দী' },
];

// European locales that use 24-hour format
export const EUROPEAN_LOCALES = ['nl', 'de', 'fr', 'es', 'pt', 'ru'];

// Group bar width options
export const GROUP_BAR_WIDTH_OPTIONS = {
  120: "Narrow",
  192: "Default", 
  280: "Wide",
  360: "Extra Wide"
} as const;

// Category emojis for custom item renderer
export const CATEGORY_EMOJIS = {
  development: '💻',
  design: '🎨',
  planning: '📋',
  business: '💼',
  urgent: '🚨',
  default: '📄'
} as const;

// Random icons for demo items
export const DEMO_ICONS = [
  { name: "Zap", text: "High Priority", position: "left" as const },
  { name: "AlertTriangle", text: "Attention Required", position: "right" as const },
  { name: "CheckCircle", text: "Approved", position: "left" as const },
  { name: "Clock", text: "Time Sensitive", position: "right" as const },
  { name: "Star", text: "Important", position: "left" as const },
  { name: "Flag", text: "Flagged", position: "right" as const },
];