---
productId: x-tree-view
---

# Migration from v6 to v7

<!-- #default-branch-switch -->

<p class="description">This guide describes the changes needed to migrate the Tree View from v6 to v7.</p>

## Introduction

TBD

## Start using the beta release

In `package.json`, change the version of the tree view package to `next`.

```diff
-"@mui/x-tree-view": "6.x.x",
+"@mui/x-tree-view": "next",
```

## Update `@mui/material` package

To have the option of using the latest API from `@mui/material`, the package peer dependency version has been updated to `^5.15.0`.
It is a change in minor version only, so it should not cause any breaking changes.
Please update your `@mui/material` package to this or a newer version.

## Breaking changes

Since `v7` is a major release, it contains changes that affect the public API.
These changes were done for consistency, improved stability and to make room for new features.

### Drop the legacy bundle

The support for IE11 has been removed from all MUI X packages.
The `legacy` bundle that used to support old browsers like IE11 is no longer included.

:::info
If you need support for IE11, you will need to keep using the latest version of the `v6` release.
:::

### ✅ Rename `nodeId` to `itemId`

The required `nodeId` prop used by the `TreeItem` has been renamed to `itemId` for consistency:

```diff
 <TreeView>
-    <TreeItem label='Item 1' nodeId='one'>
+    <TreeItem label='Item 1' itemId='one'>
 </TreeView>
```

The same change has been applied to the and `ContentComponent` prop:

```diff
  const CustomContent = React.forwardRef((props, ref) => {
-  const id = props.nodeId;
+  const id = props.itemId;

     // Render some UI
   });

   function App() {
     return (
       <SimpleTreeView>
         <TreeItem ContentComponent={CustomContent} />
       </SimpleTreeView>
     )
   }
```

### ✅ Use `SimpleTreeView` instead of `TreeView`

The `TreeView` component has been deprecated and will be removed in the next major.
You can start replacing it with the new `SimpleTreeView` component which has exactly the same API:

```diff
-import { TreeView } from '@mui/x-tree-view';
+import { SimpleTreeView } from '@mui/x-tree-view';

-import { TreeView } from '@mui/x-tree-view/TreeView';
+import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';

   return (
-    <TreeView>
+    <SimpleTreeView>
       <TreeItem itemId="1" label="First item" />
-    </TreeView>
+    </SimpleTreeView>
   );
```

If you were using theme augmentation, you will also need to migrate it:

```diff
 const theme = createTheme({
   components: {
-    MuiTreeView: {
+    MuiSimpleTreeView: {
       styleOverrides: {
         root: {
           opacity: 0.5,
         },
       },
     },
   },
 });
```

If you were using the `treeViewClasses` object, you can replace it with the new `simpleTreeViewClasses` object:

```diff
 import { treeViewClasses } from '@mui/x-tree-view/TreeView';
 import { simpleTreeViewClasses } from '@mui/x-tree-view/SimpleTreeView';

-const rootClass = treeViewClasses.root;
+const rootClass = simpleTreeViewClasses.root;
```

### Use slots to define the item icons

#### Define `expandIcon`

The icon used to expand the children of an item (rendered when this item is collapsed)
is now defined as a slot both on the Tree View and the `TreeItem` components.

If you were using the `ChevronRight` icon from `@mui/icons-material`,
you can stop passing it to your component because it is now the default value:

```diff
-import ChevronRightIcon from '@mui/icons-material/ChevronRight';

 <SimpleTreeView
-  defaultExpandIcon={<ChevronRightIcon />}
 >
   {items}
 </SimpleTreeView>
```

If you were passing another icon to your Tree View component,
you need to use the new `expandIcon` slot on this component:

```diff
 <SimpleTreeView
-  defaultExpandIcon={<MyCustomExpandIcon />}
+  slots={{ expandIcon: MyCustomExpandIcon }}
 >
   {items}
 </SimpleTreeView>
```

:::warning
Note that the `slots` prop expects a React component, not the JSX element returned when rendering this component.
:::

If you were passing another icon to your `TreeItem` component,
you need to use the new `expandIcon` slot on this component:

```diff
  <SimpleTreeView>
    <TreeItem
      itemId="1"
      label="Item 1"
-     expandIcon={<MyCustomExpandIcon />}
+     slots={{ expandIcon: MyCustomExpandIcon }}
    />
  </SimpleTreeView>
```

#### Define `collapseIcon`

The icon used to collapse the children of an item (rendered when this item is expanded)
is now defined as a slot both on the Tree View and the `TreeItem` components.

If you were using the `ExpandMore` icon from `@mui/icons-material`,
you can stop passing it to your component because it is now the default value:

```diff
- import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

  <SimpleTreeView
-   defaultCollapseIcon={<ExpandMoreIcon />}
  >
    {items}
  </SimpleTreeView>
```

If you were passing another icon to your Tree View component,
you need to use the new `collapseIcon` slot on this component:

```diff
  <SimpleTreeView
-   defaultCollapseIcon={<MyCustomCollapseIcon />}
+   slots={{ collapseIcon: MyCustomCollapseIcon }}
  >
    {items}
  </SimpleTreeView>
```

:::warning
Note that the `slots` prop expects a React component, not the JSX element returned when rendering this component.
:::

If you were passing another icon to your `TreeItem` component,
you need to use the new `collapseIcon` slot on this component:

```diff
  <SimpleTreeView>
    <TreeItem
      itemId="1"
      label="Item 1"
-     collapseIcon={<MyCustomCollapseIcon />}
+     slots={{ collapseIcon: MyCustomCollapseIcon }}
    />
  </SimpleTreeView>
```

#### Replace `parentIcon`

The `parentIcon` prop has been removed from the Tree View components.

If you were passing an icon to your Tree View component,
you can achieve the same behavior
by passing the same icon to both the `collapseIcon` and the `expandIcon` slots on this component:

```diff
  <SimpleTreeView
-   defaultParentIcon={<MyCustomParentIcon />}
+   slots={{ collapseIcon: MyCustomParentIcon, expandIcon: MyCustomParentIcon }}
  >
    {items}
  </SimpleTreeView>
```

#### Define `endIcon`

The icon rendered next to an item without children
is now defined as a slot both on the Tree View and the `TreeItem` components.

If you were passing an icon to your Tree View component,
you need to use the new `endIcon` slot on this component:

```diff
  <SimpleTreeView
-   defaultEndIcon={<MyCustomEndIcon />}
+   slots={{ endIcon: MyCustomEndIcon }}
  >
    {items}
  </SimpleTreeView>
```

:::warning
Note that the `slots` prop expects a React component, not the JSX element returned when rendering this component.
:::

If you were passing an icon to your `TreeItem` component,
you need to use the new `endIcon` slot on this component:

```diff
  <SimpleTreeView>
    <TreeItem
      itemId="1"
      label="Item 1"
-     endIcon={<MyCustomEndIcon />}
+     slots={{ endIcon: MyCustomEndIcon }}
    />
  </SimpleTreeView>
```

#### Define `icon`

The icon rendered next to an item
is now defined as a slot on the `TreeItem` component.

If you were passing an icon to your `TreeItem` component,
you need to use the new `icon` slot on this component:

```diff
  <SimpleTreeView>
    <TreeItem
      itemId="1"
      label="Item 1"
-     icon={<MyCustomIcon />}
+     slots={{ icon: MyCustomIcon }}
    />
  </SimpleTreeView>
```

:::warning
Note that the `slots` prop expects a React component, not the JSX element returned when rendering this component.
:::

### ✅ Use slots to define the group transition

The component used to animate the item children
is now defined as a slot on the `TreeItem` component.

If you were passing a `TransitionComponent` or `TransitionProps` to your `TreeItem` component,
you need to use the new `groupTransition` slot on this component:

```diff
 <SimpleTreeView>
   <TreeItem
     itemId="1"
     label="Item 1"
-    TransitionComponent={Fade}
+    slots={{ groupTransition: Fade }}
-    TransitionProps={{ timeout: 600 }}
+    slotProps={{ groupTransition: { timeout: 600 } }}
   />
 </SimpleTreeView>
```

### Rename the `group` class of the `TreeItem` component

The `group` class of the `TreeItem` component has been renamed to `groupTransition` to match with its new slot name.

```diff
 const StyledTreeItem = styled(TreeItem)({
-  [`& .${treeItemClasses.group}`]: {
+  [`& .${treeItemClasses.groupTransition}`]: {
    marginLeft: 20,
  },
 });
```

### ✅ Rename `onNodeToggle`, `expanded` and `defaultExpanded`

The expansion props have been renamed to better describe their behaviors:

| Old name          | New name                |
| :---------------- | :---------------------- |
| `onNodeToggle`    | `onExpandedItemsChange` |
| `expanded`        | `expandedItems`         |
| `defaultExpanded` | `defaultExpandedItems`  |

```diff
 <TreeView
-  onNodeToggle={handleExpansionChange}
+  onExpandedItemsChange={handleExpansionChange}

-  expanded={expandedItems}
+  expandedItems={expandedItems}

-  defaultExpanded={defaultExpandedItems}
+  defaultExpandedItems={defaultExpandedItems}
 />
```

:::info
If you were using the `onNodeToggle` prop to react to the expansion or collapse of a specific item,
you can use the new `onItemExpansionToggle` prop which is called whenever an item is expanded or collapsed with its id and expansion status

```tsx
// It is also available on the deprecated `TreeView` component
<SimpleTreeView
  onItemExpansionToggle={(event, itemId, isExpanded) =>
    console.log(itemId, isExpanded)
  }
/>
```

:::

### ✅ Rename `onNodeSelect`, `selected`, and `defaultSelected`

The selection props have been renamed to better describe their behaviors:

| Old name          | New name                |
| :---------------- | :---------------------- |
| `onNodeSelect`    | `onSelectedItemsChange` |
| `selected`        | `selectedItems`         |
| `defaultSelected` | `defaultSelectedItems`  |

```diff
 <TreeView
-  onNodeSelect={handleSelectionChange}
+  onSelectedItemsChange={handleSelectionChange}

-  selected={selectedItems}
+  selectedItems={selectedItems}

-  defaultSelected={defaultSelectedItems}
+  defaultSelectedItems={defaultSelectedItems}
 />
```

:::info
If you were using the `onNodeSelect` prop to react to the selection or deselection of a specific item,
you can use the new `onItemSelectionToggle` prop which is called whenever an item is selected or deselected with its id and selection status.

```tsx
// It is also available on the deprecated `TreeView` component
<SimpleTreeView
  onItemSelectionToggle={(event, itemId, isSelected) =>
    console.log(itemId, isSelected)
  }
/>
```

:::

### ✅ Use `useTreeItemState` instead of `useTreeItem`

The `useTreeItem` hook has been renamed `useTreeItemState`.
This will help create a new headless version of the `TreeItem` component based on a future `useTreeItem` hook.

```diff
-import { TreeItem, useTreeItem } from '@mui/x-tree-view/TreeItem';
+import { TreeItem, useTreeItemState } from '@mui/x-tree-view/TreeItem';

 const CustomContent = React.forwardRef((props, ref) => {
-  const { disabled } = useTreeItem(props.itemId);
+  const { disabled } = useTreeItemState(props.itemId);

   // Render some UI
 });

 function App() {
   return (
     <SimpleTreeView>
       <TreeItem ContentComponent={CustomContent} />
     </SimpleTreeView>
   )
 }
```

### ✅ Rename `onNodeFocus`

The `onNodeFocus` callback has been renamed to `onItemFocus` for consistency:

```diff
 <SimpleTreeView
-  onNodeFocus={onNodeFocus}
+  onItemFocus={onItemFocus}
 />
```
