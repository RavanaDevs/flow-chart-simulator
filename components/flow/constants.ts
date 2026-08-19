/**
 * Edge colours are concrete values rather than Tailwind classes because
 * React Flow generates arrowhead <marker> defs from a colour string — a class
 * name never reaches them. The line and its arrowhead read from the same
 * constant so they can never disagree.
 */
export const EDGE_COLORS = {
  default: "#94a3b8",
  true: "#10b981",
  false: "#f59e0b",
  active: "#6366f1",
} as const;

export type EdgeColorKey = keyof typeof EDGE_COLORS;
