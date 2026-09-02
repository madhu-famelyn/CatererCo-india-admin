import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
export function DataTable({ data, columns, searchKeys, pageSize = 10, toolbar, empty = "No results found.", }) {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const filtered = useMemo(() => {
        if (!query || !searchKeys?.length)
            return data;
        const q = query.toLowerCase();
        return data.filter((row) => searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q)));
    }, [data, query, searchKeys]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const current = Math.min(page, totalPages);
    const pageData = filtered.slice((current - 1) * pageSize, current * pageSize);
    return (<div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {searchKeys?.length ? (<div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
            <Input placeholder="Search..." value={query} onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
            }} className="pl-8"/>
          </div>) : <div />}
        {toolbar && <div className="flex flex-wrap gap-2">{toolbar}</div>}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (<TableHead key={c.key} className={c.className}>
                  {c.header}
                </TableHead>))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (<TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {empty}
                </TableCell>
              </TableRow>) : (pageData.map((row, i) => (<TableRow key={row.id ?? i}>
                  {columns.map((c) => (<TableCell key={c.key} className={c.className}>
                      {c.render ? c.render(row) : row[c.key]}
                    </TableCell>))}
                </TableRow>)))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {(current - 1) * pageSize + 1}-{Math.min(current * pageSize, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={current === 1}>
            <ChevronLeft className="h-4 w-4"/>
          </Button>
          <span>
            Page {current} / {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={current === totalPages}>
            <ChevronRight className="h-4 w-4"/>
          </Button>
        </div>
      </div>
    </div>);
}
