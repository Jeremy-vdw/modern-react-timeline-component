import { TimelineItem } from '../components/Timeline';
import dayjs from 'dayjs';

export interface LaneAssignment {
  itemLanes: Map<string, number>;
  totalLanes: number;
}

/**
 * Checks if two timeline items overlap in time
 */
function itemsOverlap(item1: TimelineItem, item2: TimelineItem): boolean {
  const start1 = dayjs(item1.start);
  const end1 = dayjs(item1.end);
  const start2 = dayjs(item2.start);
  const end2 = dayjs(item2.end);

  // Items overlap if one starts before the other ends
  return start1.isBefore(end2) && start2.isBefore(end1);
}

/**
 * Assigns items to lanes (sub-rows) to avoid overlapping
 * Uses a greedy algorithm to minimize the number of lanes needed
 * 
 * @param items - Array of timeline items for a single group
 * @returns Object containing itemLanes map and total number of lanes
 */
export function assignLanesToItems(items: TimelineItem[]): LaneAssignment {
  if (items.length === 0) {
    return { itemLanes: new Map(), totalLanes: 1 };
  }

  // Sort items by start time, then by end time (earlier first)
  const sortedItems = [...items].sort((a, b) => {
    const startDiff = dayjs(a.start).valueOf() - dayjs(b.start).valueOf();
    if (startDiff !== 0) return startDiff;
    return dayjs(a.end).valueOf() - dayjs(b.end).valueOf();
  });

  // Array of lanes, each lane contains items that don't overlap
  const lanes: TimelineItem[][] = [];
  const itemLanes = new Map<string, number>();

  for (const item of sortedItems) {
    let assignedLane = -1;

    // Try to find an existing lane where this item doesn't overlap
    for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
      const lane = lanes[laneIndex];
      
      // Check if item overlaps with any item in this lane
      const hasOverlap = lane.some(laneItem => itemsOverlap(item, laneItem));
      
      if (!hasOverlap) {
        // Found a lane without overlap
        lane.push(item);
        assignedLane = laneIndex;
        break;
      }
    }

    // If no suitable lane found, create a new one
    if (assignedLane === -1) {
      lanes.push([item]);
      assignedLane = lanes.length - 1;
    }

    itemLanes.set(item.id, assignedLane);
  }

  return {
    itemLanes,
    totalLanes: Math.max(lanes.length, 1), // At least 1 lane
  };
}

/**
 * Calculates lane assignments for all groups
 * 
 * @param groups - Array of group data
 * @param items - Array of all timeline items
 * @returns Map of groupId to LaneAssignment
 */
export function calculateGroupLaneAssignments(
  groups: { id: string }[],
  items: TimelineItem[]
): Map<string, LaneAssignment> {
  const groupLaneAssignments = new Map<string, LaneAssignment>();

  // Group items by group ID
  const itemsByGroup = new Map<string, TimelineItem[]>();
  for (const item of items) {
    if (!itemsByGroup.has(item.group)) {
      itemsByGroup.set(item.group, []);
    }
    itemsByGroup.get(item.group)!.push(item);
  }

  // Calculate lane assignments for each group
  for (const group of groups) {
    const groupItems = itemsByGroup.get(group.id) || [];
    const laneAssignment = assignLanesToItems(groupItems);
    groupLaneAssignments.set(group.id, laneAssignment);
  }

  return groupLaneAssignments;
}

