import { bench, describe } from 'vitest';
import { buildBalanced10K } from 'test/utils/tree-view/buildTreeViewItems';
import { RichTreeViewStore } from '../../RichTreeViewStore';
import { selectionSelectors } from './selectors';

const balanced10k = buildBalanced10K();

// Select every 10th leaf so the tree contains a realistic mix of
// `selected`, `indeterminate` and `unselected` items.
const parentIdsSet = new Set(balanced10k.parentIds);
const leafIds = balanced10k.itemIds.filter((id) => !parentIdsSet.has(id));
const selectedLeafIds = leafIds.filter((_, index) => index % 10 === 0);

const propagatingState = new RichTreeViewStore({
  items: balanced10k.items,
  defaultId: undefined,
  isRtl: false,
  checkboxSelection: true,
  multiSelect: true,
  selectionPropagation: { parents: true, descendants: true },
  defaultSelectedItems: selectedLeafIds,
}).state;

const nonPropagatingState = new RichTreeViewStore({
  items: balanced10k.items,
  defaultId: undefined,
  isRtl: false,
  checkboxSelection: true,
  multiSelect: true,
  defaultSelectedItems: selectedLeafIds,
}).state;

// Defeats dead-code elimination of the benched calls.
export const benchmarkResult = { value: 0 };

describe('itemSelectionStatus', () => {
  // Equivalent of what one store write costs today for a fully rendered ~11k tree:
  // every mounted item re-evaluates its selection status (twice, even — see
  // `useTreeItemUtils` and the selection item plugin, both subscribe to it).
  bench('every item of a ~11k tree (selectionPropagation on)', () => {
    let acc = 0;
    for (let i = 0; i < balanced10k.itemIds.length; i += 1) {
      if (selectionSelectors.itemSelectionStatus(propagatingState, balanced10k.itemIds[i])) {
        acc += 1;
      }
    }
    benchmarkResult.value = acc;
  });

  // Worst-case single call: the root of a ~1.1k subtree triggers a full descendant traversal.
  bench('single call on the root of a ~1.1k subtree', () => {
    benchmarkResult.value +=
      selectionSelectors.itemSelectionStatus(propagatingState, 'item-1') === 'selected' ? 1 : 0;
  });

  // The default configuration (no propagation) — keeps a future memoization honest
  // for the common case, not just the propagating one.
  bench('every item of a ~11k tree (selectionPropagation off)', () => {
    let acc = 0;
    for (let i = 0; i < balanced10k.itemIds.length; i += 1) {
      if (selectionSelectors.itemSelectionStatus(nonPropagatingState, balanced10k.itemIds[i])) {
        acc += 1;
      }
    }
    benchmarkResult.value = acc;
  });

  // Floor baseline: the cheap memoized-map selector, for comparison with the statuses above.
  bench('baseline: isItemSelected for every item', () => {
    let acc = 0;
    for (let i = 0; i < balanced10k.itemIds.length; i += 1) {
      if (selectionSelectors.isItemSelected(propagatingState, balanced10k.itemIds[i])) {
        acc += 1;
      }
    }
    benchmarkResult.value = acc;
  });
});
