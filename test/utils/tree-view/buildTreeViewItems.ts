/**
 * Deterministic tree data generator shared by the Tree View benchmarks
 * (both the in-package `vitest bench` files and the `test/performance-tree-view` harness).
 *
 * Ids and labels are derived from the item's path (`item-1-2-3` / `Item 1-2-3`) so
 * typeahead and label-related benchmarks are stable across runs.
 */

export interface TreeViewBenchItem {
  id: string;
  label: string;
  children?: TreeViewBenchItem[];
}

export interface BuildTreeViewItemsOptions {
  /**
   * Fanout per depth level. e.g. `[10, 10, 10]` creates 3 levels with 10 children each
   * (10 roots, each with 10 children, each with 10 children — 1110 items in total).
   */
  childrenPerLevel: number[];
  /**
   * Prefix used for the generated ids.
   * @default 'item'
   */
  idPrefix?: string;
}

export interface TreeViewBenchFixture {
  items: TreeViewBenchItem[];
  /**
   * All item ids in DFS order (the order items are rendered in).
   */
  itemIds: string[];
  /**
   * Ids of all items that have children.
   */
  parentIds: string[];
  /**
   * Expands every item that has children (`parentIds`).
   */
  defaultExpandedItems: string[];
  count: number;
}

export function buildTreeViewItems(options: BuildTreeViewItemsOptions): TreeViewBenchFixture {
  const { childrenPerLevel, idPrefix = 'item' } = options;

  const itemIds: string[] = [];
  const parentIds: string[] = [];

  const buildLevel = (path: string, depth: number): TreeViewBenchItem[] => {
    const count = childrenPerLevel[depth];
    if (count == null || count === 0) {
      return [];
    }

    return Array.from({ length: count }, (_, index) => {
      const itemPath = path === '' ? `${index + 1}` : `${path}-${index + 1}`;
      const id = `${idPrefix}-${itemPath}`;
      itemIds.push(id);

      const children = buildLevel(itemPath, depth + 1);
      if (children.length === 0) {
        return { id, label: `Item ${itemPath}` };
      }

      parentIds.push(id);
      return { id, label: `Item ${itemPath}`, children };
    });
  };

  const items = buildLevel('', 0);

  return {
    items,
    itemIds,
    parentIds,
    defaultExpandedItems: parentIds,
    count: itemIds.length,
  };
}

/** 10,000 items at the root level, no nesting. */
export const buildFlat10K = () => buildTreeViewItems({ childrenPerLevel: [10_000] });

/** 10 levels deep, 2 children per node — 2,046 items. Stresses recursion and subtree traversal. */
export const buildDeep2K = () =>
  buildTreeViewItems({ childrenPerLevel: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2] });

/** 3 levels, 10 children per node — 1,110 items. The workhorse size. */
export const buildBalanced1K = () => buildTreeViewItems({ childrenPerLevel: [10, 10, 10] });

/** 4 levels, 10 children per node — 11,110 items. */
export const buildBalanced10K = () => buildTreeViewItems({ childrenPerLevel: [10, 10, 10, 10] });

/** 110,100 items — same topology as the docs virtualization demo. */
export const buildVirtualized100K = () => buildTreeViewItems({ childrenPerLevel: [100, 100, 10] });
