import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export type SortDirection = "asc" | "desc";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  accessor: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | Date | null;
  align?: "left" | "center" | "right";
};

type SortableDataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T, index: number) => string | number;
  pageSizeOptions?: number[];
  initialPageSize?: number;
  emptyMessage?: string;
};

export function SortableDataTable<T>({
  data,
  columns,
  getRowId,
  pageSizeOptions = [50, 100, 500],
  initialPageSize = 50,
  emptyMessage = "No data to display.",
}: SortableDataTableProps<T>) {
  const [sortColumnId, setSortColumnId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(1);

  const sortedData = useMemo(() => {
    if (!sortColumnId) return data;
    const column = columns.find(c => c.id === sortColumnId);
    if (!column || !column.sortValue) return data;

    const sorted = [...data].sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);

      if (av instanceof Date) {
        if (bv instanceof Date) return av.getTime() - bv.getTime();
        return 1;
      }
      if (bv instanceof Date) return -1;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return -1;
      if (av > bv) return 1;
      return 0;
    });

    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [data, columns, sortColumnId, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageItems = sortedData.slice(start, start + pageSize);

  const handleHeaderClick = (columnId: string, sortable: boolean) => {
    if (!sortable) return;
    setPage(1);
    setSortColumnId(prev => {
      if (prev !== columnId) {
        setSortDirection("asc");
        return columnId;
      }
      setSortDirection(prevDir => (prevDir === "asc" ? "desc" : "asc"));
      return columnId;
    });
  };

  const rangeLabel =
    sortedData.length === 0
      ? "0 of 0"
      : `${start + 1}-${Math.min(start + pageSize, sortedData.length)} of ${sortedData.length}`;

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => {
                const sortable = !!column.sortValue;
                const isActive = sortColumnId === column.id;
                const icon = !sortable ? null : !isActive ? (
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                ) : sortDirection === "asc" ? (
                  <ArrowUp className="ml-1 h-3 w-3" />
                ) : (
                  <ArrowDown className="ml-1 h-3 w-3" />
                );
                const alignClass =
                  column.align === "right"
                    ? "text-right"
                    : column.align === "center"
                      ? "text-center"
                      : "";
                return (
                  <TableHead key={column.id} className={alignClass}>
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => handleHeaderClick(column.id, sortable)}
                        className="inline-flex items-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground hover:text-primary"
                      >
                        <span>{column.header}</span>
                        {icon}
                      </button>
                    ) : (
                      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {column.header}
                      </span>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!pageItems.length ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-6 text-center text-xs text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((row, index) => (
                <TableRow key={getRowId(row, start + index)}>
                  {columns.map(column => {
                    const alignClass =
                      column.align === "right"
                        ? "text-right"
                        : column.align === "center"
                          ? "text-center"
                          : "";
                    return (
                      <TableCell key={column.id} className={alignClass}>
                        {column.accessor(row)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={value => {
              const nextSize = Number(value) || pageSizeOptions[0];
              setPageSize(nextSize);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[80px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map(size => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span>{rangeLabel}</span>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              disabled={currentPage === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              {"<"}
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              disabled={currentPage === pageCount}
              onClick={() => setPage(p => Math.min(pageCount, p + 1))}
            >
              {">"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

