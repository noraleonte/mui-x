import * as React from 'react';
import { RefObject } from '@mui/x-internals/types';
import {
  createRenderer,
  screen,
  act,
  ErrorBoundary,
  reactMajor,
  waitFor,
} from '@mui/internal-test-utils';
import clsx from 'clsx';
import { spy, stub } from 'sinon';
import Portal from '@mui/material/Portal';
import {
  DataGrid,
  DataGridProps,
  GridActionsCellItem,
  GridRowIdGetter,
  GridRowClassNameParams,
  GridRowModel,
  GridRenderCellParams,
  useGridApiRef,
  GridApi,
  gridClasses,
} from '@mui/x-data-grid';
import { getBasicGridData } from '@mui/x-data-grid-generator';
import {
  grid,
  gridOffsetTop,
  getColumnValues,
  getRow,
  getActiveCell,
  getCell,
  $$,
} from 'test/utils/helperFn';
import Dialog from '@mui/material/Dialog';
import { isJSDOM } from 'test/utils/skipIf';

import { COMPACT_DENSITY_FACTOR } from '../hooks/features/density/densitySelector';
import { GridApiCommunity } from '../models/api/gridApiCommunity';

describe('<DataGrid /> - Rows', () => {
  const { render } = createRenderer();

  let apiRef: RefObject<GridApi | null>;

  const baselineProps = {
    autoHeight: isJSDOM,
    rows: [
      {
        clientId: 'c1',
        first: 'Mike',
        age: 11,
      },
      {
        clientId: 'c2',
        first: 'Jack',
        age: 11,
      },
      {
        clientId: 'c3',
        first: 'Mike',
        age: 20,
      },
    ],
    columns: [{ field: 'clientId' }, { field: 'first' }, { field: 'age' }],
  };

  describe('prop: getRowId', () => {
    it('should allow to select a field as id', () => {
      const getRowId: GridRowIdGetter = (row) => `${row.clientId}`;
      render(
        <div style={{ width: 300, height: 300 }}>
          <DataGrid {...baselineProps} getRowId={getRowId} />
        </div>,
      );
      expect(getColumnValues(0)).to.deep.equal(['c1', 'c2', 'c3']);
    });
  });

  describe('prop: rows', () => {
    it('should support new dataset', () => {
      const { rows, columns } = getBasicGridData(5, 2);

      function Test(props: Pick<DataGridProps, 'rows'>) {
        return (
          <div style={{ width: 300, height: 300 }}>
            <DataGrid {...props} columns={columns} disableVirtualization />
          </div>
        );
      }

      const { setProps } = render(<Test rows={rows.slice(0, 2)} />);
      expect(getColumnValues(0)).to.deep.equal(['0', '1']);
      setProps({ rows });
      expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4']);
    });
  });

  it('should ignore events coming from a portal in the cell', async () => {
    const handleRowClick = spy();
    function InputCell() {
      return <input type="text" name="input" />;
    }
    function PortalCell() {
      return (
        <Portal>
          <input type="text" name="portal-input" />
        </Portal>
      );
    }

    const { user } = render(
      <div style={{ width: 300, height: 300 }}>
        <DataGrid
          rows={[{ id: '1' }]}
          onRowClick={handleRowClick}
          columns={[
            {
              field: 'id',
              renderCell: () => <PortalCell />,
            },
            {
              field: 'input',
              renderCell: () => <InputCell />,
            },
          ]}
        />
      </div>,
    );
    await user.click(document.querySelector('input[name="portal-input"]')!);
    expect(handleRowClick.callCount).to.equal(0);
    await user.click(document.querySelector('input[name="input"]')!);
    expect(handleRowClick.callCount).to.equal(1);
  });

  // https://github.com/mui/mui-x/issues/8042
  it('should not throw when clicking the cell in the nested grid in a portal', () => {
    const rows = [
      { id: 1, firstName: 'Jon', age: 35 },
      { id: 2, firstName: 'Cersei', age: 42 },
      { id: 3, firstName: 'Jaime', age: 45 },
    ];

    function NestedGridDialog() {
      return (
        <Dialog open>
          <div style={{ height: 300, width: '100%' }}>
            <DataGrid rows={rows} columns={[{ field: 'id' }, { field: 'age' }]} />
          </div>
        </Dialog>
      );
    }

    expect(async () => {
      const { user } = render(
        <div style={{ width: 300, height: 300 }}>
          <DataGrid
            columns={[
              { field: 'id' },
              { field: 'firstName', renderCell: () => <NestedGridDialog /> },
            ]}
            rows={rows}
          />
        </div>,
      );

      // click on the cell in the nested grid in the column that is not defined in the parent grid
      const cell = document.querySelector(
        '[data-rowindex="0"] [role="gridcell"][data-field="age"]',
      )!;
      await user.click(cell);
    }).not.toErrorDev();
  });

  describe('prop: getRowClassName', () => {
    it('should apply the CSS class returned by getRowClassName', () => {
      const getRowId: GridRowIdGetter = (row) => `${row.clientId}`;
      const handleRowClassName: DataGridProps['getRowClassName'] = (params) =>
        params.row.age < 20 ? 'under-age' : '';
      render(
        <div style={{ width: 300, height: 300 }}>
          <DataGrid getRowClassName={handleRowClassName} getRowId={getRowId} {...baselineProps} />
        </div>,
      );
      expect(getRow(0)).to.have.class('under-age');
      expect(getRow(1)).to.have.class('under-age');
      expect(getRow(2)).not.to.have.class('under-age');
    });

    it('should call with isFirstVisible=true in the first row and isLastVisible=true in the last', async () => {
      const { rows, columns } = getBasicGridData(4, 2);

      const getRowClassName = (params: GridRowClassNameParams) =>
        clsx({ first: params.isFirstVisible, last: params.isLastVisible });
      const { user } = render(
        <div style={{ width: 300, height: 300 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowClassName={getRowClassName}
            initialState={{ pagination: { paginationModel: { pageSize: 3, page: 0 } } }}
            pageSizeOptions={[3]}
          />
        </div>,
      );
      expect(getRow(0)).to.have.class('first');
      expect(getRow(1)).not.to.have.class('first');
      expect(getRow(1)).not.to.have.class('last');
      expect(getRow(2)).to.have.class('last');
      await user.click(screen.getByRole('button', { name: /next page/i }));
      expect(getRow(3)).to.have.class('first');
      expect(getRow(3)).to.have.class('last');
    });
  });

  describe('columnType: actions', () => {
    function TestCase({
      getActions,
      ...other
    }: { getActions?: () => React.JSX.Element[] } & Partial<DataGridProps>) {
      return (
        <div style={{ width: 300, height: 300 }}>
          <DataGrid
            {...baselineProps}
            rows={[{ id: 1 }]}
            columns={[
              {
                field: 'id',
              },
              {
                field: 'actions',
                type: 'actions',
                getActions,
              },
            ]}
            {...other}
          />
        </div>
      );
    }

    it.skipIf(!isJSDOM)('should throw an error if getActions is missing', () => {
      expect(() => {
        render(
          <ErrorBoundary>
            <TestCase />
          </ErrorBoundary>,
        );
      }).toErrorDev([
        'MUI X: Missing the `getActions` property in the `GridColDef`.',
        reactMajor < 19 && 'MUI X: Missing the `getActions` property in the `GridColDef`.',
        reactMajor < 19 && 'The above error occurred in the <GridActionsCell> component',
      ]);
    });

    it('should call getActions with the row params', () => {
      const getActions = stub().returns([]);
      render(<TestCase getActions={getActions} />);
      expect(getActions.args[0][0].id).to.equal(1);
      expect(getActions.args[0][0].row).to.deep.equal({ id: 1 });
    });

    it('should always show the actions not marked as showInMenu', () => {
      render(
        <TestCase
          getActions={() => [
            <GridActionsCellItem icon={<span />} label="delete" />,
            <GridActionsCellItem label="print" showInMenu />,
          ]}
        />,
      );
      expect(screen.queryByRole('menuitem', { name: 'delete' })).not.to.equal(null);
      expect(screen.queryByText('print')).to.equal(null);
    });

    it('should show in a menu the actions marked as showInMenu', async () => {
      const { user } = render(
        <TestCase getActions={() => [<GridActionsCellItem label="print" showInMenu />]} />,
      );
      expect(screen.queryByText('print')).to.equal(null);
      await user.click(screen.getByRole('menuitem', { name: 'more' }));
      expect(screen.queryByText('print')).not.to.equal(null);
    });

    it('should not select the row when clicking in an action', async () => {
      const { user } = render(
        <TestCase getActions={() => [<GridActionsCellItem icon={<span />} label="print" />]} />,
      );
      expect(getRow(0)).not.to.have.class('Mui-selected');
      await user.click(screen.getByRole('menuitem', { name: 'print' }));
      expect(getRow(0)).not.to.have.class('Mui-selected');
    });

    it('should not select the row when clicking in a menu action', async () => {
      const { user } = render(
        <TestCase
          getActions={() => [<GridActionsCellItem icon={<span />} label="print" showInMenu />]}
        />,
      );
      expect(getRow(0)).not.to.have.class('Mui-selected');
      await user.click(screen.getByRole('menuitem', { name: 'more' }));
      expect(screen.queryByText('print')).not.to.equal(null);

      await user.click(screen.getByText('print'));
      expect(getRow(0)).not.to.have.class('Mui-selected');
    });

    it('should not select the row when opening the menu', async () => {
      const { user } = render(
        <TestCase getActions={() => [<GridActionsCellItem label="print" showInMenu />]} />,
      );
      expect(getRow(0)).not.to.have.class('Mui-selected');
      await user.click(screen.getByRole('menuitem', { name: 'more' }));
      expect(getRow(0)).not.to.have.class('Mui-selected');
    });

    it('should close other menus before opening a new one', async () => {
      const { user } = render(
        <TestCase
          rows={[{ id: 1 }, { id: 2 }]}
          getActions={() => [<GridActionsCellItem label="print" showInMenu />]}
        />,
      );
      expect(screen.queryAllByRole('menu')).to.have.length(2);

      const more1 = screen.getAllByRole('menuitem', { name: 'more' })[0];
      await user.click(more1);
      await waitFor(() => {
        expect(screen.queryAllByRole('menu')).to.have.length(2 + 1);
      });

      const more2 = screen.getAllByRole('menuitem', { name: 'more' })[1];
      await user.click(more2);
      await waitFor(() => {
        expect(screen.queryAllByRole('menu')).to.have.length(2 + 1);
      });
    });

    it('should allow to move focus to another cell with the arrow keys', async () => {
      const { user } = render(
        <TestCase getActions={() => [<GridActionsCellItem icon={<span />} label="print" />]} />,
      );
      await user.click(getCell(0, 0));
      expect(getActiveCell()).to.equal('0-0');

      await user.keyboard('{ArrowRight}');
      const printButton = screen.getByRole('menuitem', { name: 'print' });
      expect(printButton).toHaveFocus();

      await user.keyboard('{ArrowLeft}');
      expect(getActiveCell()).to.equal('0-0');
    });

    it('should focus the first item when opening the menu', async () => {
      const { user } = render(
        <TestCase
          getActions={() => [
            <GridActionsCellItem icon={<span />} label="print" showInMenu />,
            <GridActionsCellItem icon={<span />} label="delete" showInMenu />,
          ]}
        />,
      );
      const moreButton = screen.getByRole('menuitem', { name: 'more' });
      await user.click(moreButton);

      const printButton = screen.queryByRole('menuitem', { name: 'print' });
      expect(printButton).toHaveFocus();
    });

    it('should allow to navigate between actions using the arrow keys', async () => {
      const { user } = render(
        <TestCase
          getActions={() => [
            <GridActionsCellItem icon={<span />} label="print" />,
            <GridActionsCellItem icon={<span />} label="delete" />,
          ]}
        />,
      );
      const firstCell = getCell(0, 0);
      await user.click(firstCell);
      expect(getActiveCell()).to.equal('0-0');

      await user.keyboard('{ArrowRight}');
      const printButton = screen.getByRole('menuitem', { name: 'print' });
      expect(printButton).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      const deleteButton = screen.getByRole('menuitem', { name: 'delete' });
      expect(deleteButton).toHaveFocus();

      await user.keyboard('{ArrowLeft}');
      expect(printButton).toHaveFocus();

      await user.keyboard('{ArrowLeft}');
      expect(firstCell).toHaveFocus();
    });

    it('should not move focus to first item when clicking in another item', async () => {
      const { user } = render(
        <TestCase
          getActions={() => [
            <GridActionsCellItem icon={<span />} label="print" />,
            <GridActionsCellItem icon={<span />} label="delete" />,
          ]}
        />,
      );
      const deleteButton = screen.getByRole('menuitem', { name: 'delete' });
      await user.click(deleteButton);
      expect(deleteButton).toHaveFocus();
    });

    it('should set the correct tabIndex to the focused button', async () => {
      const { user } = render(
        <TestCase
          getActions={() => [
            <GridActionsCellItem icon={<span />} label="print" />,
            <GridActionsCellItem icon={<span />} label="delete" showInMenu />,
          ]}
        />,
      );
      const firstCell = getCell(0, 0);
      const secondCell = getCell(0, 1);
      await user.click(firstCell);

      await user.keyboard('{ArrowRight}');
      expect(secondCell).to.have.property('tabIndex', -1);

      const printButton = screen.getByRole('menuitem', { name: 'print' });
      const menuButton = screen.getByRole('menuitem', { name: 'more' });
      expect(printButton).to.have.property('tabIndex', 0);
      expect(menuButton).to.have.property('tabIndex', -1);

      await user.click(printButton);
      await user.keyboard('{ArrowRight}');
      expect(printButton).to.have.property('tabIndex', -1);
      expect(menuButton).to.have.property('tabIndex', 0);
    });

    it('should focus the last button if the clicked button removes itself', async () => {
      let canDelete = true;
      function Test() {
        return (
          <TestCase
            getActions={() =>
              canDelete
                ? [
                    <GridActionsCellItem icon={<span />} label="print" />,
                    <GridActionsCellItem
                      icon={<span />}
                      label="delete"
                      onClick={() => {
                        canDelete = false;
                      }}
                    />,
                  ]
                : [<GridActionsCellItem icon={<span />} label="print" />]
            }
          />
        );
      }
      const { user } = render(<Test />);
      await user.click(screen.getByRole('menuitem', { name: 'delete' }));
      expect(screen.getByRole('menuitem', { name: 'print' })).toHaveFocus();
    });

    it('should focus the last button if the currently focused button is removed', async () => {
      const { setProps, user } = render(
        <TestCase
          getActions={() => [
            <GridActionsCellItem icon={<span />} label="print" />,
            <GridActionsCellItem icon={<span />} label="delete" />,
          ]}
        />,
      );
      await user.click(screen.getByRole('menuitem', { name: 'delete' })); // Sets focusedButtonIndex=1
      expect(screen.getByRole('menuitem', { name: 'delete' })).toHaveFocus();
      setProps({ getActions: () => [<GridActionsCellItem icon={<span />} label="print" />] }); // Sets focusedButtonIndex=0
      expect(screen.getByRole('menuitem', { name: 'print' })).toHaveFocus();
    });
  });

  // Need layouting
  describe.skipIf(isJSDOM)('prop: getRowHeight', () => {
    describe('static row height', () => {
      const ROW_HEIGHT = 52;
      function TestCase(props: Partial<DataGridProps>) {
        const getRowId: GridRowIdGetter = (row) => `${row.clientId}`;
        apiRef = useGridApiRef();
        return (
          <div style={{ width: 300, height: 300 }}>
            <DataGrid apiRef={apiRef} {...baselineProps} {...props} getRowId={getRowId} />
          </div>
        );
      }

      it('should set each row height whe rowHeight prop is used', () => {
        const { setProps } = render(<TestCase />);

        expect(getRow(0).clientHeight).to.equal(ROW_HEIGHT);
        expect(getRow(1).clientHeight).to.equal(ROW_HEIGHT);
        expect(getRow(2).clientHeight).to.equal(ROW_HEIGHT);

        setProps({ rowHeight: 30 });

        expect(getRow(0).clientHeight).to.equal(30);
        expect(getRow(1).clientHeight).to.equal(30);
        expect(getRow(2).clientHeight).to.equal(30);
      });

      it('should set the second row to have a different row height than the others', () => {
        render(<TestCase getRowHeight={({ id }) => (id === 'c2' ? 100 : null)} />);

        expect(getRow(0).clientHeight).to.equal(ROW_HEIGHT);
        expect(getRow(1).clientHeight).to.equal(100);
        expect(getRow(2).clientHeight).to.equal(ROW_HEIGHT);
      });

      it('should set density to all but the row with variable row height', () => {
        const { setProps } = render(
          <TestCase getRowHeight={({ id }) => (id === 'c2' ? 100 : null)} />,
        );

        expect(getRow(0).clientHeight).to.equal(ROW_HEIGHT);
        expect(getRow(1).clientHeight).to.equal(100);
        expect(getRow(2).clientHeight).to.equal(ROW_HEIGHT);

        setProps({ density: 'compact' });

        expect(getRow(0).clientHeight).to.equal(Math.floor(ROW_HEIGHT * COMPACT_DENSITY_FACTOR));
        expect(getRow(1).clientHeight).to.equal(100);
        expect(getRow(2).clientHeight).to.equal(Math.floor(ROW_HEIGHT * COMPACT_DENSITY_FACTOR));
      });

      it('should set the correct rowHeight and variable row height', () => {
        const { setProps } = render(
          <TestCase getRowHeight={({ id }) => (id === 'c2' ? 100 : null)} />,
        );

        expect(getRow(0).clientHeight).to.equal(ROW_HEIGHT);
        expect(getRow(1).clientHeight).to.equal(100);
        expect(getRow(2).clientHeight).to.equal(ROW_HEIGHT);

        setProps({ rowHeight: 30 });

        expect(getRow(0).clientHeight).to.equal(30);
        expect(getRow(1).clientHeight).to.equal(100);
        expect(getRow(2).clientHeight).to.equal(30);
      });
    });

    describe('dynamic row height', () => {
      function ResizeObserverMock(
        callback: (entries: { borderBoxSize: [{ blockSize: number }] }[]) => void,
      ) {
        let timeout: ReturnType<typeof setTimeout>;

        return {
          observe: (element: HTMLElement) => {
            // Simulates the async behavior of the native ResizeObserver
            timeout = setTimeout(() => {
              callback([{ borderBoxSize: [{ blockSize: element.clientHeight }] }]);
            });
          },
          disconnect: () => {
            clearTimeout(timeout);
          },
        };
      }

      const originalResizeObserver = window.ResizeObserver;

      beforeEach(() => {
        const { userAgent } = window.navigator;

        if (userAgent.includes('Chrome') && !userAgent.includes('Headless')) {
          // Only use the mock in non-headless Chrome
          window.ResizeObserver = ResizeObserverMock as any;
        }
      });

      afterEach(() => {
        window.ResizeObserver = originalResizeObserver;
      });

      function TestCase(
        props: Partial<DataGridProps> & {
          getBioContentHeight: (row: GridRowModel) => number;
          height?: number;
          width?: number;
        },
      ) {
        const { getBioContentHeight, width = 300, height = 300, ...other } = props;

        const customCellRenderer = React.useCallback(
          ({ row }: GridRenderCellParams) => (
            <div style={{ width: 100, height: getBioContentHeight(row) }} />
          ),
          [getBioContentHeight],
        );

        const columns = React.useMemo(
          () => [{ field: 'clientId' }, { field: 'bio', renderCell: customCellRenderer }],
          [customCellRenderer],
        );

        return (
          <div style={{ width, height }}>
            <DataGrid
              {...baselineProps}
              columns={columns}
              getRowId={(row) => `${row.clientId}`}
              hideFooter
              {...other}
            />
          </div>
        );
      }

      it('should measure all rows and update the content size', async () => {
        const border = 1;
        const contentHeight = 100;
        render(<TestCase getBioContentHeight={() => contentHeight} getRowHeight={() => 'auto'} />);
        const virtualScrollerContent = document.querySelector(
          '.MuiDataGrid-virtualScrollerContent',
        );
        const expectedHeight = baselineProps.rows.length * (contentHeight + border);

        await waitFor(() => {
          expect(virtualScrollerContent).toHaveComputedStyle({ height: `${expectedHeight}px` });
        });

        expect(virtualScrollerContent).toHaveInlineStyle({ width: 'auto' });
      });

      it('should use the default row height to calculate the content size when the row has not been measured yet', async () => {
        const columnHeaderHeight = 50;
        const border = 1;
        const defaultRowHeight = 52;
        const measuredRowHeight = 101;
        render(
          <TestCase
            columnHeaderHeight={columnHeaderHeight}
            height={columnHeaderHeight + 20 + border * 2} // Force to only measure the first row
            getBioContentHeight={() => measuredRowHeight}
            getRowHeight={() => 'auto'}
            rowBufferPx={0}
          />,
        );
        const virtualScrollerContent = document.querySelector(
          '.MuiDataGrid-virtualScrollerContent',
        );
        const expectedHeight =
          measuredRowHeight +
          border + // Measured rows also include the border
          (baselineProps.rows.length - 1) * defaultRowHeight;

        await waitFor(() => {
          expect(virtualScrollerContent).toHaveComputedStyle({ height: `${expectedHeight}px` });
        });

        expect(virtualScrollerContent).toHaveInlineStyle({ width: 'auto' });
      });

      it('should use the value from getEstimatedRowHeight to estimate the content size', async () => {
        const columnHeaderHeight = 50;
        const border = 1;
        const measuredRowHeight = 100;
        const estimatedRowHeight = 90;
        render(
          <TestCase
            columnHeaderHeight={columnHeaderHeight}
            height={columnHeaderHeight + 20 + border * 2} // Force to only measure the first row
            getBioContentHeight={() => measuredRowHeight}
            getEstimatedRowHeight={() => estimatedRowHeight}
            getRowHeight={() => 'auto'}
            rowBufferPx={0}
          />,
        );
        const virtualScrollerContent = document.querySelector(
          '.MuiDataGrid-virtualScrollerContent',
        );
        const firstRowHeight = measuredRowHeight + border; // Measured rows also include the border
        const expectedHeight =
          firstRowHeight + (baselineProps.rows.length - 1) * estimatedRowHeight;

        await waitFor(() => {
          expect(virtualScrollerContent).toHaveComputedStyle({ height: `${expectedHeight}px` });
        });

        expect(virtualScrollerContent).toHaveInlineStyle({ width: 'auto' });
      });

      it('should recalculate the content size when the rows prop changes', async () => {
        const { setProps } = render(
          <TestCase
            getBioContentHeight={(row) => (row.expanded ? 200 : 100)}
            rows={[{ clientId: 'c1', expanded: false }]}
            getRowHeight={() => 'auto'}
            rowBufferPx={0}
          />,
        );
        const virtualScrollerContent = document.querySelector(
          '.MuiDataGrid-virtualScrollerContent',
        );

        await waitFor(() => {
          expect(virtualScrollerContent).toHaveComputedStyle({ height: '101px' });
        });
        expect(virtualScrollerContent).toHaveInlineStyle({ width: 'auto' });
        setProps({ rows: [{ clientId: 'c1', expanded: true }] });

        await waitFor(() => {
          expect(virtualScrollerContent).toHaveComputedStyle({ height: '201px' });
        });

        expect(virtualScrollerContent).toHaveInlineStyle({ width: 'auto' });
      });

      it('should set minHeight to "auto" in all rows with dynamic row height', () => {
        render(
          <TestCase
            getBioContentHeight={() => 50}
            getRowHeight={({ id }) => (id === 'c3' ? 100 : 'auto')}
            rowBufferPx={0}
          />,
        );
        expect(getRow(0)).toHaveInlineStyle({ minHeight: 'auto' });
        expect(getRow(1)).toHaveInlineStyle({ minHeight: 'auto' });
        expect(getRow(2)).toHaveInlineStyle({ minHeight: '100px' });
      });

      it('should not virtualize columns if a row has auto height', async () => {
        render(
          <TestCase
            rows={baselineProps.rows.slice(0, 1)}
            getBioContentHeight={() => 100}
            getRowHeight={() => 'auto'}
            columnBufferPx={0}
            width={100}
          />,
        );
        await waitFor(() => {
          expect($$(`.${gridClasses.cell}:not(.${gridClasses.cellEmpty})`)).to.have.length(2);
        });
      });

      it('should measure rows while scrolling', async () => {
        const columnHeaderHeight = 50;
        const border = 1;
        const cellHeight = columnHeaderHeight + border * 2;
        render(
          <TestCase
            getBioContentHeight={() => 100}
            getRowHeight={() => 'auto'}
            rowBufferPx={0}
            columnHeaderHeight={columnHeaderHeight}
            height={cellHeight * 2}
          />,
        );
        const virtualScroller = grid('virtualScroller')!;

        await waitFor(() => {
          expect(virtualScroller.scrollHeight).to.equal(columnHeaderHeight + 101 + 52 + 52);
        });

        // It calculates the entire height of the scrollbar whenever the scroll event happens
        // https://stackblitz.com/edit/react-kejzfzfx?file=Demo.tsx%3AL26
        // Scroll to measure all cells
        await act(async () => virtualScroller.scrollTo({ top: 1, behavior: 'instant' }));
        await waitFor(() =>
          expect(virtualScroller.scrollHeight).to.equal(columnHeaderHeight + 101 + 101 + 101),
        );
      });

      it('should allow to mix rows with dynamic row height and default row height', async () => {
        const columnHeaderHeight = 50;
        const densityFactor = 1.3;
        const rowHeight = 52;
        const border = 1;
        const measuredRowHeight = 100;
        const expectedHeight = measuredRowHeight + border + rowHeight * densityFactor;
        render(
          <TestCase
            getBioContentHeight={({ clientId }) => (clientId === 'c1' ? measuredRowHeight : 0)}
            getRowHeight={({ id }) => (id === 'c1' ? 'auto' : null)}
            density="comfortable"
            rows={baselineProps.rows.slice(0, 2)}
            rowBufferPx={0}
            columnHeaderHeight={columnHeaderHeight}
          />,
        );
        const virtualScrollerContent = document.querySelector(
          '.MuiDataGrid-virtualScrollerContent',
        )!;

        await waitFor(() => {
          expect(virtualScrollerContent).toHaveComputedStyle({
            height: `${Math.floor(expectedHeight)}px`,
          });
        });
        expect(virtualScrollerContent).toHaveInlineStyle({ width: 'auto' });
      });

      const { userAgent } = window.navigator;
      it.skipIf(!userAgent.includes('Headless') || /edg/i.test(userAgent))(
        'should position correctly the render zone when the 2nd page has less rows than the 1st page',
        async () => {
          const data = getBasicGridData(120, 3);
          const columnHeaderHeight = 50;
          const measuredRowHeight = 100;
          const { user } = render(
            <TestCase
              getBioContentHeight={() => measuredRowHeight}
              getRowHeight={() => 'auto'}
              rowBufferPx={0}
              columnHeaderHeight={columnHeaderHeight}
              getRowId={(row) => row.id}
              hideFooter={false}
              {...data}
            />,
          );
          const virtualScroller = document.querySelector('.MuiDataGrid-virtualScroller')!;
          await act(async () => virtualScroller.scrollTo({ top: 1000, behavior: 'instant' }));
          await waitFor(() => {
            expect(gridOffsetTop()).not.to.equal(0);
          });

          await user.click(screen.getByRole('button', { name: /next page/i }));

          await waitFor(() => {
            expect(gridOffsetTop()).to.equal(0);
          });
        },
      );

      it('should position correctly the render zone when changing pageSize to a lower value', async () => {
        const data = getBasicGridData(120, 3);
        const columnHeaderHeight = 50;
        const measuredRowHeight = 100;
        const apiRefPage = React.createRef<GridApiCommunity>();

        render(
          <TestCase
            getBioContentHeight={() => measuredRowHeight}
            getRowHeight={() => 'auto'}
            rowBufferPx={0}
            columnHeaderHeight={columnHeaderHeight}
            getRowId={(row) => row.id}
            hideFooter={false}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[5, 10]}
            height={columnHeaderHeight + 10 * measuredRowHeight}
            apiRef={apiRefPage}
            {...data}
          />,
        );
        expect(gridOffsetTop()).to.equal(0);
        await act(async () => apiRefPage.current?.setPageSize(5));
        expect(gridOffsetTop()).to.equal(0);
      });

      // In Chrome non-headless and Edge this test is flaky
      it.skipIf(!isJSDOM || !userAgent.includes('Headless') || /edg/i.test(userAgent))(
        'should position correctly the render zone when changing pageSize to a lower value and moving to next page',
        {
          // Retry the test because it is flaky
          retry: 3,
        },
        async () => {
          const data = getBasicGridData(120, 3);
          const columnHeaderHeight = 50;
          const measuredRowHeight = 100;
          const apiRefPage = React.createRef<GridApiCommunity>();

          const { user } = render(
            <TestCase
              getBioContentHeight={() => measuredRowHeight}
              getRowHeight={() => 'auto'}
              rowBufferPx={0}
              columnHeaderHeight={columnHeaderHeight}
              getRowId={(row) => row.id}
              hideFooter={false}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              pageSizeOptions={[10, 25]}
              height={columnHeaderHeight + 10 * measuredRowHeight}
              apiRef={apiRefPage}
              {...data}
            />,
          );

          expect(gridOffsetTop()).to.equal(0);

          const virtualScroller = grid('virtualScroller')!;
          // Scroll to measure all cells
          await act(async () => virtualScroller.scrollTo({ top: 1000, behavior: 'instant' }));
          await waitFor(() => {
            expect(gridOffsetTop()).not.to.equal(0);
          });

          await act(async () => {
            apiRefPage.current?.setPageSize(10);
          });

          await user.click(screen.getByRole('button', { name: /next page/i }));

          await waitFor(() => {
            expect(gridOffsetTop()).to.equal(0);
          });
        },
      );
    });
  });

  describe('prop: getRowSpacing', () => {
    const { rows, columns } = getBasicGridData(4, 2);

    function TestCase(props: Partial<DataGridProps>) {
      return (
        <div style={{ width: 300, height: 300 }}>
          <DataGrid rows={rows} columns={columns} {...props} />
        </div>
      );
    }

    it('should be called with the correct params', async () => {
      const getRowSpacing = stub().returns({});
      const { user } = render(
        <TestCase
          getRowSpacing={getRowSpacing}
          initialState={{ pagination: { paginationModel: { pageSize: 2, page: 0 } } }}
          pageSizeOptions={[2]}
        />,
      );
      expect(getRowSpacing.args[0][0]).to.deep.equal({
        isFirstVisible: true,
        isLastVisible: false,
        indexRelativeToCurrentPage: 0,
        id: 0,
        model: rows[0],
      });
      expect(getRowSpacing.args[1][0]).to.deep.equal({
        isFirstVisible: false,
        isLastVisible: true,
        indexRelativeToCurrentPage: 1,
        id: 1,
        model: rows[1],
      });

      getRowSpacing.resetHistory();
      await user.click(screen.getByRole('button', { name: /next page/i }));

      expect(getRowSpacing.args[0][0]).to.deep.equal({
        isFirstVisible: true,
        isLastVisible: false,
        indexRelativeToCurrentPage: 0,
        id: 2,
        model: rows[2],
      });
      expect(getRowSpacing.args[1][0]).to.deep.equal({
        isFirstVisible: false,
        isLastVisible: true,
        indexRelativeToCurrentPage: 1,
        id: 3,
        model: rows[3],
      });
    });

    // Needs layout
    it.skipIf(isJSDOM)('should consider the spacing when computing the content size', () => {
      const spacingTop = 5;
      const spacingBottom = 10;
      const rowHeight = 50;
      render(
        <TestCase
          rowHeight={rowHeight}
          getRowSpacing={() => ({ top: spacingTop, bottom: spacingBottom })}
          disableVirtualization
        />,
      );
      const virtualScrollerContent = document.querySelector('.MuiDataGrid-virtualScrollerContent');
      const expectedHeight = rows.length * (rowHeight + spacingTop + spacingBottom);
      expect(virtualScrollerContent).toHaveComputedStyle({ height: `${expectedHeight}px` });
      expect(virtualScrollerContent).toHaveInlineStyle({ width: 'auto' });
    });

    // Needs layout
    it.skipIf(isJSDOM)('should update the content size when getRowSpacing is removed', () => {
      const spacingTop = 5;
      const spacingBottom = 10;
      const rowHeight = 50;
      const { setProps } = render(
        <TestCase
          rowHeight={rowHeight}
          getRowSpacing={() => ({ top: spacingTop, bottom: spacingBottom })}
          disableVirtualization
        />,
      );
      const virtualScrollerContent = document.querySelector('.MuiDataGrid-virtualScrollerContent');
      const expectedHeight = rows.length * (rowHeight + spacingTop + spacingBottom);
      expect(virtualScrollerContent).toHaveComputedStyle({ height: `${expectedHeight}px` });
      expect(virtualScrollerContent).toHaveInlineStyle({ width: 'auto' });
      setProps({ getRowSpacing: null });
      expect(virtualScrollerContent).toHaveComputedStyle({
        height: `${rows.length * rowHeight}px`,
      });
      expect(virtualScrollerContent).toHaveInlineStyle({ width: 'auto' });
    });

    it('should set the row margin to the value returned by getRowSpacing if rowSpacingType is not defined', () => {
      const spacingTop = 5;
      const spacingBottom = 10;
      render(
        <TestCase
          getRowSpacing={() => ({ top: spacingTop, bottom: spacingBottom })}
          disableVirtualization
        />,
      );
      expect(getRow(0)).toHaveInlineStyle({
        marginTop: `${spacingTop}px`,
        marginBottom: `${spacingBottom}px`,
      });
    });

    it('should set the row border to the value returned by getRowSpacing if rowSpacingType=border', () => {
      const borderTop = 5;
      const borderBottom = 10;
      render(
        <TestCase
          rowSpacingType="border"
          getRowSpacing={() => ({ top: borderTop, bottom: borderBottom })}
          disableVirtualization
        />,
      );
      expect(getRow(0)).toHaveInlineStyle({
        borderTopWidth: `${borderTop}px`,
        borderBottomWidth: `${borderBottom}px`,
      });
    });
  });

  describe('apiRef: updateRows', () => {
    const rows = [
      { id: 0, brand: 'Nike' },
      { id: 1, brand: 'Adidas' },
      { id: 2, brand: 'Puma' },
    ];
    const columns = [{ field: 'brand', headerName: 'Brand' }];

    function TestCase(props: Partial<DataGridProps>) {
      apiRef = useGridApiRef();
      return (
        <div style={{ width: 300, height: 300 }}>
          <DataGrid
            autoHeight={isJSDOM}
            apiRef={apiRef}
            rows={rows}
            columns={columns}
            {...props}
            disableVirtualization
          />
        </div>
      );
    }

    it('should throw when updating more than one row at once', () => {
      render(<TestCase />);
      expect(() =>
        apiRef.current?.updateRows([
          { id: 1, brand: 'Fila' },
          { id: 0, brand: 'Pata' },
          { id: 2, brand: 'Pum' },
          { id: 3, brand: 'Jordan' },
        ]),
      ).to.throw(/You cannot update several rows at once/);
    });

    it('should allow to update one row at the time', async () => {
      render(<TestCase />);
      await act(async () => apiRef.current?.updateRows([{ id: 1, brand: 'Fila' }]));
      await act(async () => apiRef.current?.updateRows([{ id: 0, brand: 'Pata' }]));
      await act(async () => apiRef.current?.updateRows([{ id: 2, brand: 'Pum' }]));
      expect(getColumnValues(0)).to.deep.equal(['Pata', 'Fila', 'Pum']);
    });

    it('should allow adding rows', async () => {
      render(<TestCase />);
      await act(async () => apiRef.current?.updateRows([{ id: 1, brand: 'Fila' }]));
      await act(async () => apiRef.current?.updateRows([{ id: 0, brand: 'Pata' }]));
      await act(async () => apiRef.current?.updateRows([{ id: 2, brand: 'Pum' }]));
      await act(async () => apiRef.current?.updateRows([{ id: 3, brand: 'Jordan' }]));
      expect(getColumnValues(0)).to.deep.equal(['Pata', 'Fila', 'Pum', 'Jordan']);
    });

    it('should allow to delete rows', async () => {
      render(<TestCase />);
      await act(async () => apiRef.current?.updateRows([{ id: 1, _action: 'delete' }]));
      await act(async () => apiRef.current?.updateRows([{ id: 0, brand: 'Apple' }]));
      await act(async () => apiRef.current?.updateRows([{ id: 2, _action: 'delete' }]));
      await act(async () => apiRef.current?.updateRows([{ id: 5, brand: 'Atari' }]));
      expect(getColumnValues(0)).to.deep.equal(['Apple', 'Atari']);
    });

    it('should throw a console error if autoPageSize is used with autoHeight', () => {
      expect(() => {
        render(<TestCase autoPageSize autoHeight />);
      }).toErrorDev(
        [
          'MUI X: `<DataGrid autoPageSize={true} autoHeight={true} />` are not valid props.',
          'You cannot use both the `autoPageSize` and `autoHeight` props at the same time because `autoHeight` scales the height of the Data Grid according to the `pageSize`.',
          '',
          'Please remove one of these two props.',
        ].join('\n'),
      );
    });
  });

  // https://github.com/mui/mui-x/issues/10373
  // needs virtualization
  it.skipIf(isJSDOM)(
    'should set proper `data-rowindex` and `aria-rowindex` when focused row is out of the viewport',
    async () => {
      const { user } = render(
        <div style={{ width: 300, height: 300 }}>
          <DataGrid
            columns={[{ field: 'id' }]}
            rows={[
              { id: 0 },
              { id: 1 },
              { id: 2 },
              { id: 3 },
              { id: 4 },
              { id: 5 },
              { id: 6 },
              { id: 7 },
              { id: 8 },
              { id: 9 },
            ]}
          />
        </div>,
      );

      const cell = getCell(0, 0);
      await user.click(cell);

      const virtualScroller = document.querySelector('.MuiDataGrid-virtualScroller')!;
      await act(async () => virtualScroller.scrollTo({ top: 1000, behavior: 'instant' }));

      const focusedRow = getRow(0);
      expect(focusedRow.getAttribute('data-id')).to.equal('0');
      expect(focusedRow.getAttribute('data-rowindex')).to.equal('0');
      expect(focusedRow.getAttribute('aria-rowindex')).to.equal('2'); // 1-based, 1 is the header

      const lastRow = 9;
      await waitFor(async () => {
        expect(getRow(lastRow).getAttribute('data-id')).to.equal('9');
      });
      expect(getRow(lastRow).getAttribute('data-rowindex')).to.equal('9');
      expect(getRow(lastRow).getAttribute('aria-rowindex')).to.equal('11'); // 1-based, 1 is the header
    },
  );
});
