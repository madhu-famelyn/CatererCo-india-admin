import { Outlet, createFileRoute, Link, useMatch } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency-context";

export const Route = createFileRoute("/admin/bookings")({
    component: BookingsPage,
});
function BookingsPage() {
    const [status, setStatus] = useState("all");
    const queryClient = useQueryClient();
    const { fmt } = useCurrency();
    const matchChild = useMatch({ from: "/admin/bookings/$id", shouldThrow: false });

    const { data: apiBookings = [] } = useQuery({
        queryKey: ["admin-all-bookings"],
        queryFn: async () => {
            try {
                const res = await fetch("http://localhost:8000/bookings/admin/all");
                if (res.ok) return await res.json();
            } catch (e) {}
            return [];
        },
        refetchInterval: 5000,
    });

    if (matchChild) {
        return <Outlet />;
    }

    const handleDeleteBooking = async (id) => {
        if (!confirm(`Are you sure you want to delete booking "${id}"?`)) return;
        try {
            await fetch(`http://localhost:8000/bookings/${id}`, { method: "DELETE" });
            queryClient.invalidateQueries({ queryKey: ["admin-all-bookings"] });
            queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
            toast.success(`Booking ${id} deleted successfully`);
        } catch (e) {
            toast.error("Failed to delete booking");
        }
    };

    const filtered = status === "all" ? apiBookings : apiBookings.filter((b) => b.status === status);
    const columns = [
        { key: "id", header: "Booking" },
        { key: "customer", header: "Customer" },
        { key: "caterer", header: "Caterer" },
        { key: "eventType", header: "Event" },
        { key: "eventDate", header: "Date" },
        { key: "guests", header: "Guests" },
        { key: "amount", header: "Amount", render: (r) => fmt(r.amount) },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status}/> },
        {
            key: "actions",
            header: "Actions",
            className: "text-right pr-6 w-48",
            render: (r) => (<div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/bookings/$id" params={{ id: r.id }}>
              <Eye className="mr-1 h-4 w-4"/> View
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600" onClick={() => handleDeleteBooking(r.id)}>
            <Trash2 className="h-3.5 w-3.5 mr-1"/> Delete
          </Button>
        </div>),
        },
    ];
    return (<>
      <PageHeader title="Bookings" description="Track every booking across the marketplace."/>
      <div className="p-6">
        <DataTable data={filtered} columns={columns} searchKeys={["id", "customer", "caterer", "eventType"]} toolbar={<Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Status"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>}/>
      </div>
    </>);
}
