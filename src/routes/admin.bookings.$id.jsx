import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, XCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency-context";

export const Route = createFileRoute("/admin/bookings/$id")({
    component: BookingDetail,
});

function getBookingTimeline(booking) {
    const created = booking?.createdAt || "Initial request";
    const eventDate = booking?.eventDate || "Event day";
    const status = booking?.status || "pending";
    return [
        { date: created, label: "Booking Request Placed" },
        { date: status === "confirmed" || status === "completed" ? "Confirmed" : "Pending", label: "Caterer Confirmation" },
        { date: status === "completed" ? "Paid & Reconciled" : "Pending Deposit", label: "Payment Settlement" },
        { date: eventDate, label: "Event Service & Delivery" },
    ];
}

function BookingDetail() {
    const { id } = Route.useParams();
    const { fmt } = useCurrency();
    const { data: apiBooking } = useQuery({
        queryKey: ["admin-booking-detail", id],
        queryFn: async () => {
            try {
                const res = await fetch(`http://localhost:8000/bookings/${id}`);
                if (res.ok) return await res.json();
            } catch (e) {}
            return null;
        },
    });

    const b = apiBooking ? {
        id: apiBooking.id,
        eventType: apiBooking.event || "Event",
        eventDate: apiBooking.date || "Scheduled Date",
        guests: apiBooking.guests || 0,
        amount: apiBooking.total || 0,
        status: apiBooking.status || "confirmed",
        customer: apiBooking.customer_name || "Customer",
        customerId: apiBooking.customer_id || "CU-1",
        caterer: apiBooking.caterer_name || "Caterer Profile",
        catererId: apiBooking.caterer_id || "c1",
        createdAt: apiBooking.created_at ? new Date(apiBooking.created_at).toLocaleDateString() : "Recently",
    } : {
        id,
        eventType: "Booking",
        eventDate: "-",
        guests: 0,
        amount: 0,
        status: "pending",
        customer: "Loading...",
        customerId: "CU-1",
        caterer: "Loading...",
        catererId: "c1",
        createdAt: "-",
    };

    return (<>
      <PageHeader title={`Booking ${b.id}`} description={`${b.eventType} · ${b.eventDate}`} actions={<>
            <Button variant="outline" asChild><Link to="/admin/bookings"><ArrowLeft className="mr-2 h-4 w-4"/> Back</Link></Button>
            <Button variant="outline" onClick={() => toast("Dispute resolution initiated")}><ShieldAlert className="mr-2 h-4 w-4"/> Resolve Dispute</Button>
            <Button variant="destructive" onClick={() => toast.error("Booking cancelled")}><XCircle className="mr-2 h-4 w-4"/> Cancel Booking</Button>
          </>}/>
      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Overview</CardTitle>
            <StatusBadge status={b.status}/>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Event type" value={b.eventType}/>
            <Row label="Event date" value={b.eventDate}/>
            <Row label="Guests" value={b.guests.toString()}/>
            <Row label="Amount" value={fmt(b.amount)}/>
            <Row label="Commission" value={fmt(Math.floor(b.amount * 0.1))}/>
            <Row label="Created" value={b.createdAt}/>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{b.customer}</p>
            <p className="text-muted-foreground">{b.customerId}</p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/customers/$id" params={{ id: String(b.customerId) }}>View profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assigned Caterer</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{b.caterer}</p>
            <p className="text-muted-foreground">{b.catererId}</p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/caterers/$id" params={{ id: String(b.catererId) }}>View profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l pl-6">
              {getBookingTimeline(b).map((t, i) => (<li key={i} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary"/>
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.date}</p>
                </li>))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </>);
}
function Row({ label, value }) {
    return (<div className="flex justify-between border-b py-1 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>);
}
