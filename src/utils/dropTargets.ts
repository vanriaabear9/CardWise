export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export function rectContains(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Returns the id of the drop target under `point`, or null.
 * `visibleArea` is the scrollable panel that holds the targets: a target that is scrolled
 * out of view must not catch drops, even though its (off-screen) rectangle contains the point.
 */
export function findDropTarget<Id>(
  point: Point,
  targets: ReadonlyMap<Id, Rect>,
  visibleArea: Rect | null,
): Id | null {
  if (visibleArea && !rectContains(visibleArea, point)) {
    return null;
  }
  for (const [id, rect] of targets) {
    if (rectContains(rect, point)) {
      return id;
    }
  }
  return null;
}
