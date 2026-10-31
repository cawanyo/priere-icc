export const REALTIME_CHANNELS = {
  PRAYER_HOUSE: "prayer-house",
  PRAYER_PLANNING: "prayer-planning",
  SPECIAL_EVENTS: "special-events",
  NOTIFICATIONS: "notifications",
  AVAILABILITY: "availability",
} as const;

export const REALTIME_EVENTS = {
  UPDATE: "update",
  CHANGE: "change",
  SLOT_UPDATED: "slot-updated",
  THEME_UPDATED: "theme-updated",
  ASSIGNMENT_UPDATED: "assignment-updated",
  MEMBER_UPDATED: "member-updated",
} as const;
