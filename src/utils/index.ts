import { EUROPEAN_LOCALES } from "../constants";

// Check if locale uses 24-hour format
export const uses24HourFormat = (locale: string): boolean => {
  return EUROPEAN_LOCALES.includes(locale);
};

// Create lighter color for gradients
export const createLighterColor = (color: string): string => {
  return `${color}80`; // 50% opacity for lighter effect
};

// Format duration in minutes to human readable
export const formatDuration = (durationMinutes: number): string => {
  return durationMinutes < 60 
    ? `${durationMinutes}m` 
    : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;
};