import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Ban, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency-context";

export const Route = createFileRoute("/admin/customers/$id")({
    component: CustomerDetail,
});

function CustomerDetail() {
    const { id } = Route.useParams();
    const { fmt } = useCurrency();
    const cleanId = String(id).replace(/^CU-0*/i, "") || String(id);

    const { data: rawUser = null } = useQuery({
        queryKey: ["admin-user-detail", id],
        queryFn: async () => {
            try {
                const res = await fetch(`http://localhost:8000/users/${id}`);
                if (res.ok) return await res.json();
            } catch (e) {}

            try {
                const resAll = await fetch("http://localhost:8000/users");
                if (resAll.ok) {
                    const all = await resAll.json();
                    return all.find((u) => 
                        String(u.id) === String(id) || 
                        String(u.id) === cleanId || 
                        String(u.email).toLowerCase() === String(id).toLowerCase()
                    ) || null;
                }
            } catch (e) {}
            return null;
        },
    });

    const { data: apiBookings = [] } = useQuery({
        queryKey: ["admin-customer-bookings", id],
        queryFn: async () => {
            try {
                const res = await fetch("http://localhost:8000/bookings/admin/all");
                if (res.ok) return await res.json();
            } catch (e) {}
            return [];
        },
    });

    const custBookings = apiBookings.filter((b) => {
        if (rawUser) {
            if (b.customer_id && String(b.customer_id) === String(rawUser.id)) return true;
            if (b.customer_email && String(b.customer_email).toLowerCase() === String(rawUser.email).toLowerCase()) return true;
            if (b.customer && String(b.customer).toLowerCase().includes(String(rawUser.first_name || "").toLowerCase())) return true;
        }
        return String(b.customer).toLowerCase().includes(c?.name?.toLowerCase() || "") || String(b.id).includes(cleanId);
    });

    const bookingCity = custBookings?.[0]?.emirate || custBookings?.[0]?.address;

    const c = rawUser ? {
        id: `CU-${String(rawUser.id).padStart(3, "0")}`,
        name: `${rawUser.first_name || ""} ${rawUser.last_name || ""}`.trim() || rawUser.email || "Customer Account",
        email: rawUser.email || "—",
        phone: rawUser.phone || "—",
        city: rawUser.city || rawUser.preferred_emirate || bookingCity || "—",
        joinedAt: rawUser.created_at ? new Date(rawUser.created_at).toLocaleDateString() : "—",
        totalSpent: rawUser.total_spent ?? 0,
        totalBookings: rawUser.bookings_count ?? 0,
        status: rawUser.is_verified ? "active" : "pending",
    } : {
        id: `CU-${id}`,
        name: "Customer Account",
        email: "—",
        phone: "—",
        city: bookingCity || "—",
        joinedAt: "—",
        totalSpent: 0,
        totalBookings: 0,
        status: "active",
    };

    return (<>
      <PageHeader title={c.name} description={c.email} actions={<>
            <Button variant="outline" asChild><Link to="/admin/customers"><ArrowLeft className="mr-2 h-4 w-4"/> Back</Link></Button>
            {c.status === "suspended" ? (<Button onClick={() => toast.success("Customer reactivated")}><RotateCcw className="mr-2 h-4 w-4"/> Reactivate</Button>) : (<Button variant="destructive" onClick={() => toast.error("Customer suspended")}><Ban className="mr-2 h-4 w-4"/> Suspend</Button>)}
          </>}/>
      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile</CardTitle>
              <StatusBadge status={c.status}/>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Phone:</span> {c.phone}</p>
            <p><span className="text-muted-foreground">City:</span> {c.city}</p>
            <p><span className="text-muted-foreground">Joined:</span> {c.joinedAt}</p>
            <p><span className="text-muted-foreground">Total spent:</span> {fmt(c.totalSpent)}</p>
            <p><span className="text-muted-foreground">Total bookings:</span> {c.totalBookings}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="bookings">
              <TabsList>
                <TabsTrigger value="bookings">Booking History</TabsTrigger>
                <TabsTrigger value="quotations">Saved Quotations</TabsTrigger>
                <TabsTrigger value="disputes">Disputes</TabsTrigger>
              </TabsList>
              <TabsContent value="bookings" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead><TableHead>Caterer</TableHead><TableHead>Event</TableHead>
                      <TableHead>Amount</TableHead><TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {custBookings.length > 0 ? custBookings.map((b) => (<TableRow key={b.id}>
                        <TableCell>{b.id}</TableCell><TableCell>{b.caterer}</TableCell>
                        <TableCell>{b.eventType}</TableCell><TableCell>{fmt(b.amount)}</TableCell>
                        <TableCell><StatusBadge status={b.status}/></TableCell>
                      </TableRow>)) : (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No bookings recorded yet.</TableCell></TableRow>
                      )}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="quotations" className="mt-4 text-sm text-muted-foreground">
                <p>No saved quotations.</p>
              </TabsContent>
              <TabsContent value="disputes" className="mt-4 text-sm text-muted-foreground">
                <p>No open disputes.</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>);
}
