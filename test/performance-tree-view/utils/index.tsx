import * as React from 'react';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import type { TreeViewBenchItem } from 'test/utils/tree-view/buildTreeViewItems';

/**
 * Maps a benchmark fixture to nested `<TreeItem>` JSX, for `SimpleTreeView` benches.
 */
export function renderJsxTree(items: TreeViewBenchItem[]): React.ReactNode {
  return items.map((item) => (
    <TreeItem key={item.id} itemId={item.id} label={item.label}>
      {item.children ? renderJsxTree(item.children) : null}
    </TreeItem>
  ));
}

/**
 * Waits for the next two animation frames, letting React flush renders and the
 * browser paint before the next interaction step.
 */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}
