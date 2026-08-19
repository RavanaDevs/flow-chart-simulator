/**
 * Canvas grid. Positions are part of the persisted document, so snapping lives
 * with the graph model rather than with the shape geometry in components/.
 * Must stay in step with the <Background gap> the canvas draws.
 */
export const GRID_SIZE = 16;

export function snapValue(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export function snapPosition(position: { x: number; y: number }): {
  x: number;
  y: number;
} {
  return { x: snapValue(position.x), y: snapValue(position.y) };
}
