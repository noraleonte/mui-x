import * as React from 'react';
import { benchmark } from '@mui/internal-benchmark';
import { RichTreeViewPro } from '@mui/x-tree-view-pro/RichTreeViewPro';
import { buildBalanced1K } from 'test/utils/tree-view/buildTreeViewItems';
import { nextFrame } from '../utils';

const balanced1k = buildBalanced1K();

function dispatchDragEvent(target: Element, type: string, dataTransfer: DataTransfer, y: number) {
  const rect = target.getBoundingClientRect();
  target.dispatchEvent(
    new DragEvent(type, {
      bubbles: true,
      cancelable: true,
      dataTransfer,
      clientX: rect.left + rect.width / 2,
      clientY: y,
    }),
  );
}

// Measures the dragover hot path during reordering (drop-target computation runs on
// every dragover event). Nested DOM structure so items render as an actual tree.
benchmark(
  'dragover burst during reordering — 1,000 items',
  () => (
    <RichTreeViewPro
      items={balanced1k.items}
      defaultExpandedItems={balanced1k.defaultExpandedItems}
      itemsReordering
      disableVirtualization
      domStructure="nested"
    />
  ),
  async ({ resumeReactRecording }) => {
    const itemRoots = Array.from(document.querySelectorAll<HTMLElement>('[role="treeitem"]'));
    const source = itemRoots[0];
    const dataTransfer = new DataTransfer();

    resumeReactRecording();
    const sourceRect = source.getBoundingClientRect();
    dispatchDragEvent(source, 'dragstart', dataTransfer, sourceRect.top + 2);
    await nextFrame();

    for (let i = 1; i <= 20; i += 1) {
      const target = itemRoots[i % itemRoots.length];
      const content = target.querySelector<HTMLElement>('.MuiTreeItem-content') ?? target;
      const rect = content.getBoundingClientRect();
      // Alternate between the top and bottom half of the target to force
      // the drop-target position to actually change between events.
      const y = i % 2 === 0 ? rect.top + 2 : rect.bottom - 2;
      dispatchDragEvent(content, 'dragover', dataTransfer, y);
      // eslint-disable-next-line no-await-in-loop
      await nextFrame();
    }

    dispatchDragEvent(source, 'dragend', dataTransfer, sourceRect.top + 2);
    await nextFrame();
  },
  { reactRecordingPaused: true },
);
