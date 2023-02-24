import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { useImperativeHandle } from "react";
import { forwardRef } from "react";
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import mongoose from "mongoose";

export interface ReactTableRefProps {
  columns: ColumnDef<any, any>[];
  data: mongoose.PaginateResult<any> | { docs: any[]; totalPages: number };
  fetchData: (
    pageIndex: number,
    pageSize: number,
    sortBy: SortingState,
    filters: ColumnFiltersState
  ) => void;
}

export interface ReactTableRef {
  refreshTable: () => void;
}

const ReactTable = forwardRef<
  ReactTableRef,
  ReactTableRefProps
>(({ columns, data, fetchData }, ref) => {
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [columnSorting, setColumnSorting] = useState<SortingState>([]);

  const [columnFilters, setColumFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable<any>({
    columns,
    data: data.docs,

    state: {
      pagination: { pageIndex, pageSize },
      sorting: columnSorting,
    },

    getCoreRowModel: getCoreRowModel(),

    manualPagination: true,
    pageCount: data.totalPages,
    onPaginationChange: setPagination,

    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    onSortingChange: setColumnSorting,

    manualFiltering: true,
    onColumnFiltersChange: setColumFilters,
  });

  useEffect(() => {
    fetchData(pageIndex, pageSize, columnSorting, columnFilters);
  }, [fetchData, pageIndex, columnSorting, pageSize, columnFilters]);

  useImperativeHandle(ref, () => ({
    refreshTable() {
      fetchData(pageIndex, pageSize, columnSorting, columnFilters);
    },
  }));

  useEffect(() => {
    console.log(columnFilters);
  }, [columnFilters]);

  const setFilterCB = useCallback(
    (column: Column<any, any>) => (evt: string | number) =>
      column.setFilterValue(evt),
    []
  );

  return (
    <>
      <TableContainer overflowX="visible">
        <Table size="sm">
          <Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <Th
                      key={header.id}
                      colSpan={header.colSpan}
                      verticalAlign="top"
                    >
                      {header.isPlaceholder ? null : (
                        <VStack>
                          <Box
                            {...{
                              className: header.column.getCanSort()
                                ? "cursor-pointer select-none"
                                : "",
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: " 🔼",
                              desc: " 🔽",
                            }[header.column.getIsSorted() as string] ?? null}
                          </Box>
                          {header.column.getCanFilter() ? (
                            <Box>
                              <DebouncedInput
                                value={header.column.getFilterValue() as string ?? ""}
                                onChange={setFilterCB(header.column)}
                              />
                              {/*<Filter column={header.column} table={table} />*/}
                            </Box>
                          ) : null}
                        </VStack>
                      )}
                    </Th>
                  );
                })}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {table.getRowModel().rows.map((row) => {
              return (
                <Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <Td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Td>
                    );
                  })}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
        <Flex alignItems="center" mt="3">
          <HStack mb="4">
            <Button
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              {"<<"}
            </Button>{" "}
            <Button
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {"<"}
            </Button>{" "}
            <Button
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {">"}
            </Button>{" "}
            <Button
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              {">>"}
            </Button>{" "}
            <Box className="me-2">
              Page{" "}
              <strong>
                {pageIndex + 1} of {table.getPageCount()}
              </strong>{" "}
              | Go to page:{" "}
            </Box>
            <Box me="auto">
              <Input
                type="number"
                size="sm"
                defaultValue={pageIndex + 1}
                onChange={(e) => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0;
                  table.setPageIndex(page);
                }}
                style={{ width: "100px" }}
              />
            </Box>
            <Box>
              <Select
                value={pageSize}
                className="form-select"
                size="sm"
                onChange={(e) => {
                  setPagination({
                    pageIndex,
                    pageSize: Number(e.target.value),
                  });
                }}
              >
                {[2, 5, 10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Show {pageSize}
                  </option>
                ))}
              </Select>
            </Box>
          </HStack>
        </Flex>
      </TableContainer>
    </>
  );
});

ReactTable.displayName = "ReactTableComponent";

export default ReactTable;

function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, debounce]);

  return (
    <Input size="sm" value={value} onChange={(e) => setValue(e.target.value)} />
  );
}
