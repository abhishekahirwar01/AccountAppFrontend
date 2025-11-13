"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Cell } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "../ui/card";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <Card className="w-full">
      <div className="flex items-center p-4">
        <Input
          placeholder="Filter by party, product, or description..."
          value={(table.getColumn("party")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("party")?.setFilterValue(event.target.value)
          }
          className="max-w-sm text-sm"
        />
      </div>
      <div className="overflow-x-auto hidden sm:block">
        <Table className="w-full ">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hidden sm:table-row"
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell: Cell<TData, TValue>) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

     


  {/* Table Content  mobile view*/}
  <div className="sm:hidden flex-1">
    {table.getRowModel().rows?.length ? (
      <div className="grid gap-4">
        {table.getRowModel().rows.map((row) => (
          <div
            key={row.id}
            className="bg-gradient-to-br  dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-soft hover:shadow-gentle transition-all duration-500 border border-gray-100/80 dark:border-gray-700/60 backdrop-blur-sm"
          >
            <div className="space-y-4">
              {row.getVisibleCells().map((cell) => (
                <div
                  key={cell.id}
                  className="flex gap-6 justify-between items-center py-2 px-3 rounded-lg bg-gray-40/30 dark:bg-gray-750/30 hover:bg-gray-100/50 dark:hover:bg-gray-700/40 transition-colors duration-300"
                >
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider letter-spacing-wider">
                    {(cell.column.columnDef.meta as any)?.label ||
                     (typeof cell.column.columnDef.header === "string"
                       ? cell.column.columnDef.header
                       : cell.column.columnDef.id)}
                  </span>
                  <span className="text-right font-medium text-gray-800 dark:text-gray-200 text-sm">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
        <div className="relative mb-5">
          <div className="w-24 h-24 rounded-full bg-blue-100/80 dark:bg-blue-900/30 flex items-center justify-center mb-2">
            <svg
              className="w-10 h-10 text-blue-500 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          No records found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          We couldn't find any matching records. Try adjusting your search parameters or filters.
        </p>
      </div>
    )}
  </div>

  {/* Pagination & Selection Info */}
  <div className="flex flex-col sm:flex-row items-center justify-end gap-4 p-5 mt-6 bg-gradient-to-r from-gray-50 to-gray-100/30 dark:from-gray-800 dark:to-gray-900/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
   

    <div className="flex items-center gap-2">
      <button
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
        className="px-4 py-2.5 text-sm font-medium rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-soft hover:shadow-gentle flex items-center gap-2 group"
      >
        <svg
          className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Previous
      </button>

      <button
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
        className="px-4 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-soft hover:shadow-gentle flex items-center gap-2 group"
      >
        Next
        <svg
          className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  </div>

    </Card>
  );
}
