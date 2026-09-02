import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Download, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency-context";

export const Route = createFileRoute("/admin/analytics")({
    component: AnalyticsPage,
});

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#0ea5e9", "#a855f7"];

function EmptyChart({ label }) {
    return (
        <div className="h-72 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <BarChart2 className="h-8 w-8 opacity-30" />
            <p className="text-sm">{label || "No data yet"}</p>
        </div>
    );
}

function AnalyticsPage() {
    const { fmt } = useCurrency();

    const { data: apiDashboard } = useQuery({
        queryKey: ["admin-dashboard-analytics"],
        queryFn: async () => {
            try {
                const res = await fetch("http://localhost:8000/dashboard/admin");
                if (res.ok) return await res.json();
            } catch (e) {}
            return null;
        },
        refetchInterval: 30000,
    });

    const { data: caterersList = [] } = useQuery({
        queryKey: ["admin-caterers-analytics"],
        queryFn: async () => {
            try {
                const res = await fetch("http://localhost:8000/caterers?include_unverified=true");
                if (res.ok) return await res.json();
            } catch (e) {}
            return [];
        },
    });

    const { data: bookingsList = [] } = useQuery({
        queryKey: ["admin-bookings-analytics"],
        queryFn: async () => {
            try {
                const res = await fetch("http://localhost:8000/bookings?limit=1000");
                if (res.ok) return await res.json();
            } catch (e) {}
            return [];
        },
    });

    // Real data from API
    const liveRevenueOverview = apiDashboard?.revenueOverview || [];
    const liveBookingTrends = apiDashboard?.bookingTrends || [];

    // Derive customer growth from bookings by month
    const customerGrowthReal = (() => {
        if (!bookingsList.length) return [];
        const byMonth = {};
        bookingsList.forEach((b) => {
            const d = b.event_date || b.created_at || "";
            const month = d.slice(0, 7); // "YYYY-MM"
            if (month) byMonth[month] = (byMonth[month] || 0) + 1;
        });
        return Object.entries(byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-12)
            .map(([month, bookings]) => ({
                month: new Date(month + "-01").toLocaleString("default", { month: "short", year: "2-digit" }),
                bookings,
            }));
    })();

    // Derive event type distribution from real bookings
    const eventTypeData = (() => {
        if (!bookingsList.length) return [];
        const counts = {};
        bookingsList.forEach((b) => {
            const type = b.event_type || b.eventType || "Other";
            counts[type] = (counts[type] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    })();

    // Derive cuisine distribution from real caterers
    const cuisineData = (() => {
        if (!caterersList.length) return [];
        const counts = {};
        caterersList.forEach((c) => {
            const cuisines = Array.isArray(c.cuisines) ? c.cuisines : (c.cuisine ? [c.cuisine] : []);
            cuisines.forEach((cu) => { counts[cu] = (counts[cu] || 0) + 1; });
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    })();

    // Top caterers from real data
    const topCaterers = caterersList
        .map((c) => ({
            id: c.id,
            name: c.name || "Caterer",
            city: c.city || c.emirate || "—",
            bookings: c.bookings ?? 0,
            revenue: c.revenue ?? 0,
            rating: c.rating ?? "—",
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    const handleExportReport = () => {
        const headers = ["Section", "Metric_Or_Name", "Value_Or_Bookings", "Extra_Info_Or_Revenue"];
        const rows = [
            ...liveRevenueOverview.map((r) => ["Monthly Revenue", r.month, fmt(r.revenue), `Commission: ${fmt(r.commission || 0)}`]),
            ...liveBookingTrends.map((b) => ["Booking Trends", b.month, `${b.bookings} Bookings`, "-"]),
            ...topCaterers.map((c) => ["Top Caterer", `"${c.name.replace(/"/g, '""')}"`, `${c.bookings} Bookings`, fmt(c.revenue)]),
        ];
        if (!rows.length) { toast.info("No data to export yet."); return; }
        const csvString = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `analytics_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Analytics CSV exported!");
    };

    return (<>
      <PageHeader
        title="Analytics"
        description="Live revenue, growth and marketplace performance from real data."
        actions={<Button variant="outline" onClick={handleExportReport}><Download className="mr-2 h-4 w-4"/>Export Report</Button>}
      />
      <div className="grid gap-6 p-6 lg:grid-cols-2">

        <Card>
          <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            {liveRevenueOverview.length ? (
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={liveRevenueOverview}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
                    <XAxis dataKey="month" fontSize={12}/>
                    <YAxis fontSize={12}/>
                    <Tooltip formatter={(v) => fmt(v)}/>
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyChart label="No revenue data yet" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Booking Trends</CardTitle></CardHeader>
          <CardContent>
            {liveBookingTrends.length ? (
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={liveBookingTrends}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
                    <XAxis dataKey="month" fontSize={12}/>
                    <YAxis fontSize={12}/>
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#0ea5e9" radius={[6, 6, 0, 0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyChart label="No booking data yet" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bookings by Month</CardTitle></CardHeader>
          <CardContent>
            {customerGrowthReal.length ? (
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={customerGrowthReal}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
                    <XAxis dataKey="month" fontSize={12}/>
                    <YAxis fontSize={12}/>
                    <Tooltip />
                    <Line type="monotone" dataKey="bookings" stroke="#ec4899" strokeWidth={2}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyChart label="No booking history yet" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Event Type Distribution</CardTitle></CardHeader>
          <CardContent>
            {eventTypeData.length ? (
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={eventTypeData} dataKey="value" nameKey="name" outerRadius={90} label>
                      {eventTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyChart label="No event bookings yet" />}
          </CardContent>
        </Card>

        {cuisineData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Cuisine Distribution (Caterers)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={cuisineData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
                    <XAxis type="number" fontSize={12}/>
                    <YAxis dataKey="name" type="category" fontSize={12} width={110}/>
                    <Tooltip />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Top Performing Caterers</CardTitle></CardHeader>
          <CardContent>
            {topCaterers.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr><th className="pb-3">Caterer</th><th>City</th><th>Bookings</th><th>Revenue</th><th>Rating</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {topCaterers.map((c) => (
                      <tr key={c.id}>
                        <td className="py-3 font-medium">{c.name}</td>
                        <td>{c.city}</td>
                        <td>{c.bookings}</td>
                        <td>{fmt(c.revenue)}</td>
                        <td>{c.rating !== "—" ? `⭐ ${c.rating}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <BarChart2 className="h-8 w-8 opacity-30"/>
                <p className="text-sm">No caterers registered yet</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </>);
}
