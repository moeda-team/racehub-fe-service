import { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  mono?: boolean;
  bibcol?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  className?: string;
}

export default function DataTable<T>({
  columns,
  data,
  keyField,
  className = "",
}: DataTableProps<T>) {
  return (
    <div style={{ overflowX: "auto" }} className={className}>
      <table className="dtable">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={String(row[keyField])}>
              {columns.map((col) => {
                const cellClass = [
                  col.bibcol ? "bibcol" : "",
                  col.mono ? "mono" : "",
                  col.className ?? "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <td key={col.key} className={cellClass || undefined}>
                    {col.render(row)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
