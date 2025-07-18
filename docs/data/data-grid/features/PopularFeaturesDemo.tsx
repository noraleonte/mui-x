import * as React from 'react';
import {
  DataGridPremium,
  DataGridPremiumProps,
  gridClasses,
  GridColDef,
  GridEventListener,
  GridRenderCellParams,
  GridRowParams,
  Toolbar,
  useGridApiRef,
  QuickFilter,
  QuickFilterControl,
  QuickFilterClear,
} from '@mui/x-data-grid-premium';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ArrowUp from '@mui/icons-material/KeyboardArrowUp';
import ArrowDown from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightRounded from '@mui/icons-material/KeyboardArrowRightRounded';
import { useTheme, alpha, styled } from '@mui/material/styles';
import { yellow, blue, green } from '@mui/material/colors';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import AggregationRowGrouping from '../aggregation/AggregationRowGrouping';
import BasicColumnPinning from '../column-pinning/BasicColumnPinning';
import ColumnSelectorGrid from '../column-visibility/ColumnSelectorGrid';
import ExcelExport from '../export/ExcelExport';
import QuickFilteringGrid from '../filtering/QuickFilteringGrid';
import BasicDetailPanels from '../master-detail/BasicDetailPanels';
import RowGroupingInitialState from '../row-grouping/RowGroupingInitialState';
import RowOrderingGrid from '../row-ordering/RowOrderingGrid';
import RowPinningWithPagination from '../row-pinning/RowPinningWithPagination';
import RestoreStateInitialState from '../state/RestoreStateInitialState';
import TreeDataFullExample from '../tree-data/TreeDataFullExample';
import ColumnVirtualizationGrid from '../virtualization/ColumnVirtualizationGrid';
import FullFeaturedDemo from './FullFeaturedDemo';
import LazyLoadingGrid from '../row-updates/LazyLoadingGrid';
import BasicGroupingDemo from '../column-groups/BasicGroupingDemo';
import EditingWithDatePickers from '../custom-columns/EditingWithDatePickers';
import CellSelectionGrid from '../cell-selection/CellSelectionRangeStyling';
import HeaderFilteringDataGridPro from '../filtering/HeaderFilteringDataGridPro';
import ClipboardPaste from '../clipboard/ClipboardPaste';
import GridPivotingInitialState from '../pivoting/GridPivotingInitialState';
import AssistantWithExamples from '../ai-assistant/AssistantWithExamples';

type Row = {
  id: number;
  name: string;
  description: string;
  plan: string;
  detailPage: string;
  demo: React.JSX.Element;
  newBadge?: boolean;
  linkToCode?: string;
};

export const featuresSet: Row[] = [
  {
    id: 1,
    name: 'Master-detail row panels',
    description:
      'Display parent rows with collapsible child panels (as seen in this demo).',
    plan: 'Pro',
    detailPage: '/master-detail/',
    demo: <BasicDetailPanels />,
    linkToCode: '/master-detail/#system-BasicDetailPanels.tsx',
  },
  {
    id: 2,
    name: 'Inline editing',
    description: 'Edit data inside cells by double-clicking or pressing Enter.',
    plan: 'Community',
    detailPage: '/editing/',
    demo: <EditingWithDatePickers />,
    linkToCode: '/recipes-editing/#system-EditingWithDatePickers.tsx',
  },
  {
    id: 3,
    name: 'Column grouping',
    description: 'Group columns in a multi-level hierarchy.',
    plan: 'Community',
    detailPage: '/column-groups/',
    demo: <BasicGroupingDemo />,
    linkToCode: '/column-groups/#system-BasicGroupingDemo.tsx',
  },
  {
    id: 4,
    name: 'Lazy loading',
    description: 'Paginate rows and only fetch what you need.',
    plan: 'Pro',
    detailPage: '/row-updates/#lazy-loading',
    demo: <LazyLoadingGrid />,
    linkToCode: '/row-updates/#system-LazyLoadingGrid.tsx',
  },
  {
    id: 5,
    name: 'Save and restore state',
    description:
      'Save and restore internal state and configurations like active filters and sorting.',
    plan: 'Community',
    detailPage: '/state/#save-and-restore-the-state',
    demo: <RestoreStateInitialState />,
    linkToCode: '/state/#system-RestoreStateInitialState.tsx',
  },
  {
    id: 6,
    name: 'Row grouping',
    description: 'Group rows with repeating column values.',
    plan: 'Premium',
    detailPage: '/row-grouping/',
    demo: <RowGroupingInitialState />,
    linkToCode: '/row-grouping/#system-RowGroupingInitialState.tsx',
  },
  {
    id: 7,
    name: 'Excel export',
    description: 'Export rows in various file formats such as CSV, PDF or Excel.',
    plan: 'Premium',
    detailPage: '/export/#excel-export',
    demo: <ExcelExport />,
    linkToCode: '/export/#system-ExcelExport.tsx',
  },
  {
    id: 8,
    name: 'Quick filter',
    description: 'Use a single text input to filter multiple fields.',
    plan: 'Community',
    detailPage: '/filtering/quick-filter/',
    demo: <QuickFilteringGrid />,
    linkToCode: '/filtering/quick-filter/#system-QuickFilteringGrid.tsx',
  },
  {
    id: 9,
    name: 'Row reordering',
    description: 'Drag and drop to reorder data.',
    plan: 'Pro',
    detailPage: '/row-ordering/',
    demo: <RowOrderingGrid />,
    linkToCode: '/row-ordering/#system-RowOrderingGrid.tsx',
  },
  {
    id: 10,
    name: 'Column Pinning',
    description: 'Pin columns to the left or right.',
    plan: 'Pro',
    detailPage: '/column-pinning/',
    demo: <BasicColumnPinning />,
    linkToCode: '/column-pinning/#system-BasicColumnPinning.tsx',
  },
  {
    id: 11,
    name: 'Row pinning',
    description: 'Pin rows to the top or bottom of the Grid.',
    plan: 'Pro',
    detailPage: '/row-pinning/',
    demo: <RowPinningWithPagination />,
    linkToCode: '/row-pinning/#system-RowPinningWithPagination.tsx',
  },
  {
    id: 12,
    name: 'Aggregation and Summary rows',
    description: 'Set summary footer rows or inline summaries with row grouping.',
    plan: 'Premium',
    detailPage: '/aggregation/',
    demo: <AggregationRowGrouping />,
    linkToCode: '/aggregation/#system-AggregationRowGrouping.tsx',
  },
  {
    id: 13,
    name: 'Column visibility',
    description: 'Display different columns for different use cases.',
    plan: 'Community',
    detailPage: '/column-visibility/',
    demo: <ColumnSelectorGrid />,
    linkToCode: '/column-visibility/#system-ColumnSelectorGrid.tsx',
  },
  {
    id: 14,
    name: 'Column virtualization',
    description: 'High-performance support for thousands of columns.',
    plan: 'Community',
    detailPage: '/virtualization/#column-virtualization',
    demo: <ColumnVirtualizationGrid />,
    linkToCode: '/virtualization/#system-ColumnVirtualizationGrid.tsx',
  },
  {
    id: 15,
    name: 'Row virtualization',
    description: 'High-performance support for large volumes of data.',
    plan: 'Pro',
    detailPage: '/virtualization/#row-virtualization',
    demo: <FullFeaturedDemo />,
  },
  {
    id: 16,
    name: 'Tree data',
    description: 'Support rows with a parent/child relationship.',
    plan: 'Pro',
    detailPage: '/tree-data/',
    demo: <TreeDataFullExample />,
    linkToCode: '/tree-data/#system-TreeDataFullExample.tsx',
  },
  {
    id: 17,
    name: 'Cell selection',
    description:
      'Select one or more cells by dragging the mouse or using the Shift key.',
    plan: 'Premium',
    detailPage: '/cell-selection/',
    demo: <CellSelectionGrid />,
    linkToCode: '/cell-selection/#system-CellSelectionGrid.tsx',
  },
  {
    id: 18,
    name: 'Clipboard paste',
    description:
      'Copy and paste selected cells and rows using standard keyboard shortcuts.',
    plan: 'Premium',
    detailPage: '/clipboard/#clipboard-paste',
    demo: <ClipboardPaste />,
    linkToCode: '/clipboard/#system-ClipboardPaste.tsx',
  },
  {
    id: 19,
    name: 'Header filters',
    description:
      'Quickly accessible and customizable header filters to filter the data.',
    plan: 'Pro',
    detailPage: '/filtering/#header-filters',
    demo: <HeaderFilteringDataGridPro />,
    linkToCode: '/filtering/header-filters/#system-HeaderFilteringDataGridPro.tsx',
  },
  {
    id: 20,
    name: 'Pivoting',
    description:
      'Rearrange rows and columns to view data from multiple perspectives.',
    plan: 'Premium',
    detailPage: '/pivoting/',
    demo: <GridPivotingInitialState />,
    linkToCode: '/pivoting/#system-GridPivotingInitialState.tsx',
  },
  {
    id: 21,
    name: 'AI Assistant',
    description: 'Translate natural language into a set of grid state updates.',
    plan: 'Premium',
    detailPage: '/ai-assistant/',
    demo: <AssistantWithExamples />,
    linkToCode: '/ai-assistant/#system-AssistantWithExamples.tsx',
  },
];

function getChipProperties(plan: string) {
  switch (plan) {
    case 'Premium':
      return { avatarLink: '/static/x/premium.svg' };
    case 'Pro':
      return { avatarLink: '/static/x/pro.svg' };
    default:
      return { avatarLink: '/static/x/community.svg' };
  }
}

const chipColor = {
  light: {
    Premium: { background: yellow[50], border: alpha(yellow[900], 0.4) },
    Pro: { background: blue[50], border: alpha(blue[900], 0.2) },
    Community: { background: green[50], border: alpha(green[900], 0.2) },
  },
  dark: {
    Premium: {
      background: alpha(yellow[900], 0.4),
      border: alpha(yellow[300], 0.4),
    },
    Pro: { background: alpha(blue[600], 0.4), border: alpha(blue[300], 0.4) },
    Community: {
      background: alpha(green[600], 0.4),
      border: alpha(green[300], 0.4),
    },
  },
} as const;
function PlanTag(props: { plan: 'Premium' | 'Pro' | 'Community' }) {
  const theme = useTheme();
  const chipProperties = getChipProperties(props.plan);
  const avatar = !chipProperties.avatarLink ? undefined : (
    <img src={chipProperties.avatarLink} width={21} height={24} alt="" />
  );
  return (
    <Chip
      variant="outlined"
      size="small"
      avatar={avatar}
      label={props.plan}
      sx={{
        pl: 0.5,
        backgroundColor: chipColor.light[props.plan].background,
        borderColor: chipColor.light[props.plan].border,
        ...theme.applyStyles('dark', {
          backgroundColor: chipColor.dark[props.plan].background,
          borderColor: chipColor.dark[props.plan].border,
        }),

        '& .MuiChip-label': {
          fontWeight: 'medium',
          fontSize: theme.typography.pxToRem(12),
          pl: 1,
        },
        '& .MuiChip-avatar': {
          width: 16,
        },
      }}
    />
  );
}

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  padding: theme.spacing(1.5),
  minHeight: 'auto',
}));

const StyledQuickFilter = styled(QuickFilter)({
  margin: 0,
  width: '100%',
});

function CustomToolbar() {
  return (
    <StyledToolbar>
      <StyledQuickFilter>
        <QuickFilterControl
          render={({ ref, ...other }) => (
            <TextField
              {...other}
              sx={{ width: '100%' }}
              inputRef={ref}
              aria-label="Search"
              placeholder="Search by feature name or description"
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: other.value ? (
                    <InputAdornment position="end">
                      <QuickFilterClear
                        edge="end"
                        size="small"
                        aria-label="Clear search"
                        material={{ sx: { marginRight: -0.75 } }}
                      >
                        <CancelIcon fontSize="small" />
                      </QuickFilterClear>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
          )}
        />
      </StyledQuickFilter>
    </StyledToolbar>
  );
}

function RowDemo(props: { row: Row }) {
  const { row } = props;
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: 6,
        bgcolor: 'grey.50', // dark color is the branding theme's primaryDark.800
        ...theme.applyStyles('dark', {
          bgcolor: '#141A1F',
        }),
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <div style={{ width: '90%', margin: 'auto' }}>
        <div>{row.demo}</div>
        {row.linkToCode ? (
          <Link
            href={`/x/react-data-grid${row.linkToCode}`}
            target="_blank"
            color="primary"
            variant="body2"
            sx={{
              mt: 1.5,
              fontWeight: 'bold',
              fontFamily: 'IBM Plex Sans',
              display: 'inline-flex',
              alignItems: 'center',
              '& > svg': { transition: '0.2s' },
              '&:hover > svg': { transform: 'translateX(2px)' },
            }}
          >
            View the demo source
            <KeyboardArrowRightRounded
              fontSize="small"
              sx={{ mt: '1px', ml: '2px' }}
            />
          </Link>
        ) : null}
      </div>
    </Box>
  );
}

function CustomSizeAggregationFooter(props: { value: string | undefined }) {
  return (
    <Typography sx={{ fontWeight: 500, fontSize: '1em' }} color="primary">
      Total: {props.value}
    </Typography>
  );
}

const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Feature name',
    maxWidth: 172,
    flex: 0.2,
    minWidth: 100,
    groupable: false,
    display: 'flex',
    renderCell: (params) => {
      if (params.aggregation) {
        return <CustomSizeAggregationFooter value={params.formattedValue} />;
      }
      if (!params.value) {
        return '';
      }
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" fontWeight="medium" fontFamily="IBM Plex Sans">
            <Link
              href={`/x/react-data-grid${params.row.detailPage}`}
              target="_blank"
            >
              {params.value}
            </Link>
          </Typography>
          {params.row.newBadge && (
            <Chip
              label="New"
              color="success"
              size="small"
              sx={(theme) => ({
                ml: 1,
                p: 0.2,
                height: 'auto',
                fontSize: theme.typography.pxToRem(10),
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '.04rem',
                '& .MuiChip-label': {
                  px: '4px',
                },
              })}
            />
          )}
        </Box>
      );
    },
  },
  {
    field: 'description',
    headerName: 'Description',
    groupable: false,
    flex: 0.5,
    minWidth: 120,
  },
  {
    field: 'plan',
    headerName: 'Plan',
    maxWidth: 130,
    flex: 0.3,
    type: 'singleSelect',
    valueOptions: ['Premium', 'Pro', 'Community'],
    display: 'flex',
    renderCell: (params: GridRenderCellParams<any, string>) => {
      if (params.aggregation) {
        return <CustomSizeAggregationFooter value={params.formattedValue} />;
      }
      if (!params.value) {
        return '';
      }
      return <PlanTag plan={params.value as 'Premium' | 'Pro' | 'Community'} />;
    },
    sortComparator: (p1, p2) => {
      function getSortingValue(plan: string) {
        switch (plan) {
          case 'Pro':
            return 1;
          case 'Premium':
            return 2;
          default:
            return 0;
        }
      }
      const p1Value = getSortingValue(p1);
      const p2Value = getSortingValue(p2);
      return p1Value - p2Value;
    },
  },
];

const mainDataGridCellClassName = 'main-data-grid-cell';
const getCellClassName = () => mainDataGridCellClassName;

export default function PopularFeaturesDemo() {
  const apiRef = useGridApiRef();

  const getDetailPanelContent = React.useCallback<
    NonNullable<DataGridPremiumProps['getDetailPanelContent']>
  >((params: GridRowParams) => {
    return <RowDemo row={params.row} />;
  }, []);

  const getRowHeight = React.useCallback<
    NonNullable<DataGridPremiumProps['getRowHeight']>
  >(() => 'auto', []);
  const getDetailPanelHeight = React.useCallback<
    NonNullable<DataGridPremiumProps['getDetailPanelHeight']>
  >(() => 'auto', []);

  const onRowClick = React.useCallback<GridEventListener<'rowClick'>>(
    (params) => {
      const rowNode = apiRef.current?.getRowNode(params.id);
      if (rowNode && rowNode.type === 'group') {
        apiRef.current?.setRowChildrenExpansion(
          params.id,
          !rowNode.childrenExpanded,
        );
      } else {
        apiRef.current?.toggleDetailPanel(params.id);
      }
    },
    [apiRef],
  );

  const memoizedGroupingDef = React.useMemo(() => {
    return {
      headerName: 'Grouped by Plan',
      width: 200,
    };
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 1000,
        width: '100%',
      }}
    >
      <DataGridPremium
        apiRef={apiRef}
        disableRowSelectionOnClick
        onRowClick={onRowClick}
        slots={{
          toolbar: CustomToolbar,
          detailPanelExpandIcon: ArrowDown as any,
          detailPanelCollapseIcon: ArrowUp as any,
        }}
        showToolbar
        getDetailPanelContent={getDetailPanelContent}
        getDetailPanelHeight={getDetailPanelHeight}
        getRowHeight={getRowHeight}
        initialState={{
          sorting: {
            sortModel: [{ field: 'plan', sort: 'asc' }],
          },
        }}
        getCellClassName={getCellClassName}
        sx={{
          fontFamily: 'IBM Plex Sans',
          // Do not target cells in nested grids
          [`.${gridClasses.cell}.${mainDataGridCellClassName}`]: {
            py: 1.5,
          },
          [`& .${gridClasses.columnHeaderTitle}`]: {
            fontWeight: 'medium',
          },
          [`& .${gridClasses.withBorderColor}`]: {
            borderColor: 'divider',
          },
          [`& .${gridClasses.detailPanel}`]: {
            backgroundColor: 'transparent',
          },
          [`& .${gridClasses.cell}:focus, & .${gridClasses.cell}:focus-within`]: {
            outline: 'none',
          },
          [`& .${gridClasses.columnHeader}:focus, & .${gridClasses.columnHeader}:focus-within`]:
            {
              outline: 'none',
            },
          borderRadius: 2,
        }}
        rows={featuresSet}
        columns={columns}
        hideFooter
        groupingColDef={memoizedGroupingDef}
      />
    </Box>
  );
}
