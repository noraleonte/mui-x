import * as React from 'react';
import { benchmark } from '@mui/internal-benchmark';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { buildBalanced1K, buildTreeViewItems } from 'test/utils/tree-view/buildTreeViewItems';
import { nextFrame } from '../utils';

const balanced1k = buildBalanced1K();
const wideBranch = buildTreeViewItems({ childrenPerLevel: [10, 500] });

function dispatchKeyDown(key: string) {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  );
}

// Mount is excluded from all three benches (`reactRecordingPaused`): only the renders
// and paints caused by the interaction are measured.

benchmark(
  'ArrowDown ×20 — 1,000 items expanded',
  () => (
    <RichTreeView items={balanced1k.items} defaultExpandedItems={balanced1k.defaultExpandedItems} />
  ),
  async ({ resumeReactRecording }) => {
    const firstItem = document.querySelector<HTMLElement>('[role="treeitem"]')!;
    firstItem.focus();
    await nextFrame();

    resumeReactRecording();
    for (let i = 0; i < 20; i += 1) {
      dispatchKeyDown('ArrowDown');
      // eslint-disable-next-line no-await-in-loop
      await nextFrame();
    }
  },
  { reactRecordingPaused: true },
);

benchmark(
  'expand a branch of 500 children',
  () => <RichTreeView items={wideBranch.items} />,
  async ({ resumeReactRecording }) => {
    const firstItemContent = document.querySelector<HTMLElement>('.MuiTreeItem-content')!;

    resumeReactRecording();
    firstItemContent.click();
    await nextFrame();
  },
  { reactRecordingPaused: true },
);

benchmark(
  'checkbox click with selection propagation — 1,000 items',
  () => (
    <RichTreeView
      items={balanced1k.items}
      defaultExpandedItems={balanced1k.defaultExpandedItems}
      checkboxSelection
      multiSelect
      selectionPropagation={{ parents: true, descendants: true }}
    />
  ),
  async ({ resumeReactRecording }) => {
    const firstCheckbox = document.querySelector<HTMLInputElement>('.MuiTreeItem-checkbox input')!;

    resumeReactRecording();
    firstCheckbox.click();
    await nextFrame();
  },
  { reactRecordingPaused: true },
);
