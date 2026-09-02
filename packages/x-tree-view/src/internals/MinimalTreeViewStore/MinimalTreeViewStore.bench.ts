import { bench, describe } from 'vitest';
import { buildBalanced1K } from 'test/utils/tree-view/buildTreeViewItems';
import type { TreeViewBenchItem } from 'test/utils/tree-view/buildTreeViewItems';
import { RichTreeViewStore } from '../RichTreeViewStore';
import type { RichTreeViewState } from '../RichTreeViewStore';
import { itemsSelectors } from '../plugins/items/selectors';
import { expansionSelectors } from '../plugins/expansion/selectors';
import { selectionSelectors } from '../plugins/selection/selectors';

const balanced1k = buildBalanced1K();

const store = new RichTreeViewStore<TreeViewBenchItem, true>({
  items: balanced1k.items,
  defaultId: undefined,
  isRtl: false,
  defaultExpandedItems: balanced1k.defaultExpandedItems,
  checkboxSelection: true,
  multiSelect: true,
});

type State = RichTreeViewState<TreeViewBenchItem, true>;
type ItemSelector = (state: State, itemId: string) => unknown;

// The selectors a mounted `<TreeItem />` reads through `useStore` today
// (`useTreeItem`, `useTreeItemUtils`, the selection and label-editing item plugins,
// `TreeItemProvider`, `RichTreeViewItems`) — ~27 subscriptions per item, 2 of which
// are the expensive `itemSelectionStatus`.
const cheapItemSelectors: ItemSelector[] = [
  itemsSelectors.itemMeta,
  itemsSelectors.itemOrderedChildrenIds,
  itemsSelectors.isItemDisabled,
  itemsSelectors.itemDepth,
  itemsSelectors.itemIndex,
  itemsSelectors.itemParentId,
  itemsSelectors.canItemBeFocused,
  (state) => itemsSelectors.itemHeight(state),
  (state) => itemsSelectors.itemChildrenIndentation(state),
  (state) => itemsSelectors.disabledItemFocusable(state),
  expansionSelectors.isItemExpanded,
  selectionSelectors.isItemSelected,
  selectionSelectors.canItemBeSelected,
  selectionSelectors.isItemSelectable,
  selectionSelectors.isFeatureEnabledForItem,
  (state) => selectionSelectors.enabled(state),
  (state) => selectionSelectors.isMultiSelectEnabled(state),
  (state) => selectionSelectors.isCheckboxSelectionEnabled(state),
  (state) => selectionSelectors.propagationRules(state),
];

const CHEAP_SUBSCRIPTIONS_PER_ITEM = 25;
const STATUS_SUBSCRIPTIONS_PER_ITEM = 2;

// Defeats dead-code elimination of the selector results.
export const benchmarkResult = { value: undefined as unknown };

// Mimic what `useSyncExternalStore` does on a store notification: every subscription
// re-runs its selector against the new state before React can bail out.
for (const itemId of balanced1k.itemIds) {
  for (let i = 0; i < CHEAP_SUBSCRIPTIONS_PER_ITEM; i += 1) {
    const selector = cheapItemSelectors[i % cheapItemSelectors.length];
    // The subscriptions intentionally live for the whole benchmark process.
    void store.subscribe((state) => {
      benchmarkResult.value = selector(state, itemId);
    });
  }
  for (let i = 0; i < STATUS_SUBSCRIPTIONS_PER_ITEM; i += 1) {
    void store.subscribe((state) => {
      benchmarkResult.value = selectionSelectors.itemSelectionStatus(state, itemId);
    });
  }
}

let flip = false;

describe('store notification fan-out (1,110 mounted items × 27 subscriptions)', () => {
  bench('one focusedItemId write (~30k selector evaluations)', () => {
    flip = !flip;
    store.set('focusedItemId', flip ? 'item-1' : 'item-2');
  });
});

describe('updateStateFromParameters', () => {
  // The idiomatic inline-callback usage (`getItemLabel={(item) => item.label}`) trips
  // `shouldRebuildItemsState` on every parent render: full items rebuild + full notification.
  // Numbers include the dev-only default-prop `JSON.stringify` checks that also run under
  // vitest; branch-vs-branch comparisons stay valid since both sides pay them.
  bench('fresh inline getItemLabel — full items rebuild + notification', () => {
    store.updateStateFromParameters({
      ...store.parameters,
      getItemLabel: (item: TreeViewBenchItem) => item.label,
    });
  });

  bench('stable parameters object — no-op floor', () => {
    store.updateStateFromParameters(store.parameters);
  });
});
