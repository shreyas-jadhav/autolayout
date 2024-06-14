import { cloneDeep } from "lodash";
import { Layout as LayoutItem } from "react-grid-layout";
export type Layout = LayoutItem[];

export type CompactType = "horizontal" | "vertical";

const heightWidth = { x: "w", y: "h" };

function bottom(layout: Layout): number {
  let max = 0,
    bottomY;
  for (let i = 0, len = layout.length; i < len; i++) {
    bottomY = layout[i].y + layout[i].h;
    if (bottomY > max) max = bottomY;
  }
  return max;
}

function cloneLayoutItem(layoutItem: LayoutItem): LayoutItem {
  return {
    w: layoutItem.w,
    h: layoutItem.h,
    x: layoutItem.x,
    y: layoutItem.y,
    i: layoutItem.i,
    minW: layoutItem.minW,
    maxW: layoutItem.maxW,
    minH: layoutItem.minH,
    maxH: layoutItem.maxH,
    moved: Boolean(layoutItem.moved),
    static: Boolean(layoutItem.static),
    isDraggable: layoutItem.isDraggable,
    isResizable: layoutItem.isResizable,
    resizeHandles: layoutItem.resizeHandles,
    isBounded: layoutItem.isBounded,
  };
}

function collides(l1: LayoutItem, l2: LayoutItem): boolean {
  if (l1.i === l2.i) return false;
  if (l1.x + l1.w <= l2.x) return false;
  if (l1.x >= l2.x + l2.w) return false;
  if (l1.y + l1.h <= l2.y) return false;
  if (l1.y >= l2.y + l2.h) return false;
  return true;
}

function getFirstCollision(
  layout: Layout,
  layoutItem: LayoutItem
): LayoutItem | undefined {
  for (let i = 0, len = layout.length; i < len; i++) {
    if (collides(layout[i], layoutItem)) return layout[i];
  }
}

function getStatics(layout: Layout): Array<LayoutItem> {
  return layout.filter((l) => l.static);
}

function resolveCompactionCollision(
  layout: Layout,
  item: LayoutItem,
  moveToCoord: number,
  axis: "x" | "y"
) {
  const sizeProp = heightWidth[axis];
  item[axis] += 1;
  const itemIndex = layout.map((layoutItem) => layoutItem.i).indexOf(item.i);

  for (let i = itemIndex + 1; i < layout.length; i++) {
    const otherItem = layout[i];
    if (otherItem.static) continue;
    if (otherItem.y > item.y + item.h) break;
    if (collides(item, otherItem)) {
      resolveCompactionCollision(
        layout,
        otherItem,
        moveToCoord + item[sizeProp as "w" | "h"],
        axis
      );
    }
  }

  item[axis] = moveToCoord;
}

function compactItem(
  compareWith: Layout,
  l: LayoutItem,
  compactType: CompactType,
  cols: number,
  fullLayout: Layout
): LayoutItem {
  const compactV = compactType === "vertical";
  const compactH = compactType === "horizontal";
  if (compactV) {
    l.y = Math.min(bottom(compareWith), l.y);
    while (l.y > 0 && !getFirstCollision(compareWith, l)) {
      l.y--;
    }
  } else if (compactH) {
    console.log("compactH", "cols", cols);
    while (l.x > 0 && !getFirstCollision(compareWith, l)) {
      console.log(`decrementing x for ${l.i} from ${l.x}`, cols, compactType);
      l.x--;
      console.log(l.x);
    }
  }

  let collides;
  while ((collides = getFirstCollision(compareWith, l))) {
    if (compactH) {
      resolveCompactionCollision(fullLayout, l, collides.x + collides.w, "x");
    } else {
      resolveCompactionCollision(fullLayout, l, collides.y + collides.h, "y");
    }
    if (compactH && l.x + l.w > cols) {
      l.x = cols - l.w;
      console.log("Setting x to ", l.x);
      l.y++;
    }
  }

  l.y = Math.max(l.y, 0);
  l.x = Math.max(l.x, 0);
  console.log("Returning compacted", l.x);
  return l;
}

function sortLayoutItems(layout: Layout, compactType: CompactType): Layout {
  if (compactType === "horizontal") return sortLayoutItemsByColRow(layout);
  if (compactType === "vertical") return sortLayoutItemsByRowCol(layout);
  return layout;
}

function sortLayoutItemsByRowCol(layout: Layout): Layout {
  return layout.slice(0).sort(function (a, b) {
    if (a.y > b.y || (a.y === b.y && a.x > b.x)) {
      return 1;
    } else if (a.y === b.y && a.x === b.x) {
      return 0;
    }
    return -1;
  });
}

function sortLayoutItemsByColRow(layout: Layout): Layout {
  return layout.slice(0).sort(function (a, b) {
    if (a.x > b.x || (a.x === b.x && a.y > b.y)) {
      return 1;
    }
    return -1;
  });
}

export function compact(
  layout: Layout,
  compactType: CompactType,
  cols: number
): Layout {
  const compareWith = getStatics(layout);
  const sorted = sortLayoutItems(layout, compactType);
  const out = Array(layout.length);

  for (let i = 0, len = sorted.length; i < len; i++) {
    let l = cloneLayoutItem(sorted[i]);

    if (!l.static) {
      l = compactItem(compareWith, l, compactType, cols, sorted);
      compareWith.push(l);
    }

    out[layout.indexOf(sorted[i])] = l;
    l.moved = false;
  }

  return out;
}

function correctBounds(layout: Layout, bounds: { cols: number }): Layout {
  const collidesWith = getStatics(layout);
  for (let i = 0, len = layout.length; i < len; i++) {
    const l = layout[i];
    if (l.x + l.w > bounds.cols) l.x = bounds.cols - l.w;
    if (l.x < 0) {
      l.x = 0;
      l.w = bounds.cols;
    }
    if (!l.static) collidesWith.push(l);
    else {
      while (getFirstCollision(collidesWith, l)) {
        l.y++;
      }
    }
  }

  return layout;
}

export function sync(
  initialLayout: Layout,
  cols: number,
  compactType: CompactType,
  sizeRefLayout?: Layout
): Layout {
  const cloneLayout = cloneDeep(initialLayout) ?? [];

  if (sizeRefLayout) {
    for (let i = 0; i < cloneLayout.length; i++) {
      const refItem = sizeRefLayout.find((item) => item.i === cloneLayout[i].i);
      if (refItem) {
        console.log({
          refItem,
          cloneItem: cloneLayout[i],
        });
        cloneLayout[i].w = refItem.w;
        cloneLayout[i].h = refItem.h;
      }
    }
  }

  const correctedLayout = correctBounds(cloneLayout ?? [], {
    cols: cols,
  });

  console.log({
    correctedLayout,
    cols,
    compactType,
  });
  return compact(correctedLayout, compactType, cols);
}
