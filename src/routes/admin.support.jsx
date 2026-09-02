import { Outlet, createFileRoute, Link, useMatch } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/support")({
    component: SupportPage,
});
const priorityStyle = {
    low: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
    medium: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    high: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    urgent: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

function SupportPage() {
    const [type, setType] = useState("all");
    const queryClient = useQueryClient();

    const { data: liveTickets = [] } = useQuery({
        queryKey: ["admin-support-tickets"],
        queryFn: async () => {
            try {
                const res = await fetch("http://localhost:8000/support/tickets");
                if (res.ok) return await res.json();
            } catch (e) {}
            return [];
        },
        refetchInterval: 5000,
    });

    const matchChild = useMatch({ from: "/admin/support/$id", shouldThrow: false });
    if (matchChild) {
        return <Outlet />;
    }

    const handleDeleteTicket = async (id, sub) => {
        if (!confirm(`Are you sure you want to delete support ticket "${sub}"?`)) return;
        try {
            await fetch(`http://localhost:8000/support/tickets/${id}`, { method: "DELETE" });
            queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
            toast.success(`Ticket ${id} deleted successfully`);
        } catch (e) {
            toast.error("Failed to delete ticket");
        }
    };

    const filtered = type === "all" ? liveTickets : liveTickets.filter((t) => t.type === type);
    const columns = [
        { key: "id", header: "Ticket" },
        { key: "subject", header: "Subject" },
        { key: "from", header: "From" },
        { key: "type", header: "Type", render: (r) => <Badge variant="outline" className="capitalize">{r.type}</Badge> },
        { key: "priority", header: "Priority", render: (r) => <Badge className={priorityStyle[r.priority] + " border-transparent capitalize"}>{r.priority}</Badge> },
        { key: "assignee", header: "Assignee" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status}/> },
        { key: "createdAt", header: "Created" },
        {
            key: "actions",
            header: "Actions",
            className: "text-right pr-6 w-48",
            render: (r) => (
                <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="ghost" size="sm">
                        <Link to="/admin/support/$id" params={{ id: r.id }}><Eye className="mr-1 h-4 w-4"/> Open</Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600" onClick={() => handleDeleteTicket(r.id, r.subject)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1"/> Delete
                    </Button>
                </div>
            ),
        },
    ];
    return (<>
      <PageHeader title="Support Tickets" description="Manage customer and caterer queries."/>
      <div className="p-6">
        <DataTable data={filtered} columns={columns} searchKeys={["id", "subject", "from", "assignee"]} toolbar={<Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Type"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="caterer">Caterer</SelectItem>
              </SelectContent>
            </Select>}/>
      </div>
    </>);
}
