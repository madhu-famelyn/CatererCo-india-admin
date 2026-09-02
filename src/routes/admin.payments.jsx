import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, ArrowDownToLine } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/lib/currency-context";

export const Route = createFileRoute("/admin/payments")({
    component: PaymentsPage,
});

function PaymentsPage() {
    const { fmt } = useCurrency();
    const { data: apiBookings = [] } = useQuery({
        queryKey: ["admin-all-bookings-payments"],
        queryFn: async () => {
            try {
                const res = await fetch("http://localhost:8000/bookings/admin/all");
                if (res.ok) return await res.json();
            } catch (e) {}
            return [];
        },
        refetchInterval: 5000,
    });

    const livePayments = apiBookings.map((b) => ({
        id: `PAY-${String(b.id || "").replace('BK-', '')}`,
        bookingId: b.id,
        customer: b.customer || "Customer",
        caterer: b.caterer || "Caterer",
        amount: b.amount || 0,
        commission: Math.round((b.amount || 0) * 0.1),
        method: "Online Payment",
        date: b.eventDate || b.created_at || "Recent",
        status: b.status === "completed" || b.status === "confirmed" ? "completed" : "pending",
    }));

    const liveSettlements = apiBookings.map((b, i) => {
        const gross = b.amount || 0;
        const comm = Math.round(gross * 0.1);
        return {
            id: `SET-${700 + i}`,
            caterer: b.caterer || "Caterer",
            period: b.eventDate ? new Date(b.eventDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "Current",
            gross,
            commission: comm,
            net: gross - comm,
            status: b.status === "completed" ? "completed" : "pending",
        };
    });

    const liveRefunds = apiBookings.filter((b) => b.status === "cancelled").map((b, i) => ({
        id: `REF-${900 + i}`,
        bookingId: b.id,
        customer: b.customer || "Customer",
        amount: b.amount || 0,
        reason: b.cancellation_reason || "Customer cancellation request",
        date: b.eventDate || b.created_at || "Recent",
        status: "pending",
    }));

    const totalRevenue = livePayments.reduce((s, p) => s + p.amount, 0);
    const totalCommission = livePayments.reduce((s, p) => s + p.commission, 0);
    const pendingPayouts = liveSettlements.filter((s) => s.status === "pending").reduce((s, x) => s + x.net, 0);

    const paymentCols = [
        { key: "id", header: "Payment" },
        { key: "bookingId", header: "Booking" },
        { key: "customer", header: "Customer" },
        { key: "caterer", header: "Caterer" },
        { key: "amount", header: "Amount", render: (r) => fmt(r.amount) },
        { key: "commission", header: "Commission", render: (r) => fmt(r.commission) },
        { key: "method", header: "Method" },
        { key: "date", header: "Date" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status}/> },
    ];
    const settlementCols = [
        { key: "id", header: "Settlement" },
        { key: "caterer", header: "Caterer" },
        { key: "period", header: "Period" },
        { key: "gross", header: "Gross", render: (r) => fmt(r.gross) },
        { key: "commission", header: "Commission", render: (r) => fmt(r.commission) },
        { key: "net", header: "Net Payout", render: (r) => fmt(r.net) },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status}/> },
        {
            key: "actions",
            header: "Actions",
            className: "text-right pr-6 w-48",
            render: (r) => r.status === "pending" ? (<div className="flex justify-end"><Button size="sm" onClick={() => toast.success(`Payout ${r.id} released`)}>Release payout</Button></div>) : <div className="text-right"><span className="text-xs text-muted-foreground">Released</span></div>,
        },
    ];
    const refundCols = [
        { key: "id", header: "Refund" },
        { key: "bookingId", header: "Booking" },
        { key: "customer", header: "Customer" },
        { key: "amount", header: "Amount", render: (r) => fmt(r.amount) },
        { key: "reason", header: "Reason" },
        { key: "date", header: "Date" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status}/> },
        {
            key: "actions",
            header: "Actions",
            className: "text-right pr-6 w-48",
            render: (r) => r.status === "pending" ? (<div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={() => toast.error("Refund rejected")}>Reject</Button>
          <Button size="sm" onClick={() => toast.success("Refund approved")}>Approve</Button>
        </div>) : null,
        },
    ];
    return (<>
      <PageHeader title="Payments" description="Track commissions, settlements, refunds and payouts."/>
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total Payments" value={fmt(totalRevenue)} icon={Wallet}/>
          <StatCard label="Commission Earned" value={fmt(totalCommission)} icon={TrendingUp}/>
          <StatCard label="Pending Payouts" value={fmt(pendingPayouts)} icon={ArrowDownToLine}/>
        </div>

        <Card>
          <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Transactions</TabsTrigger>
                <TabsTrigger value="settlements">Settlements</TabsTrigger>
                <TabsTrigger value="refunds">Refunds</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <DataTable data={livePayments} columns={paymentCols} searchKeys={["id", "customer", "caterer", "bookingId"]}/>
              </TabsContent>
              <TabsContent value="settlements" className="mt-4">
                <DataTable data={liveSettlements} columns={settlementCols} searchKeys={["id", "caterer"]}/>
              </TabsContent>
              <TabsContent value="refunds" className="mt-4">
                <DataTable data={liveRefunds} columns={refundCols} searchKeys={["id", "customer", "bookingId"]}/>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>);
}
