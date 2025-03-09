"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface DataTableProps {
  data: Record<string, number> | undefined;
  title: string;
  isWordFrequency?: boolean;
}

export default function DataTable({ data, title, isWordFrequency = false }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");

  if (!data) return <p>No data available</p>;

  const filterData = (data: Record<string, number>): [string, number][] => {
    const filtered = Object.entries(data || {})
      .filter(([key]) => key.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b[1] - a[1]);

    // Only limit word frequency data
    if (isWordFrequency) {
      return filtered.slice(0, 200);
    }

    return filtered;
  };

  const filteredData = filterData(data);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map(([name, count]) => (
                <TableRow key={name}>
                  <TableCell>{name}</TableCell>
                  <TableCell className="text-right">
                    {isWordFrequency
                      ? count // For word frequency, always show as integer
                      : typeof count === "number" && count % 1 === 0
                      ? count
                      : count.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4">
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {isWordFrequency && <p className="text-sm text-muted-foreground text-right">Showing top 200 results</p>}
    </div>
  );
}
