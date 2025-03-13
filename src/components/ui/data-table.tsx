
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableData } from "@/types/chat";

interface DataTableProps {
  tableData: TableData;
}

export function DataTable({ tableData }: DataTableProps) {
  const { columns, data, title, description } = tableData;

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm animate-fade-in">
      {title && (
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-medium">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id} className="font-medium">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex} className="hover:bg-muted/50 transition-colors">
                {columns.map((column) => (
                  <TableCell key={`${rowIndex}-${column.id}`}>
                    {column.accessorKey ? row[column.accessorKey] : row[column.id]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
