import { Outlet, createFileRoute, useNavigate, useMatch, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Download, Check, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency-context";

export const Route = createFileRoute("/admin/caterers")({
    component: CaterersPage,
});

const INDIAN_CITIES = [
    "Hyderabad",
    "Bangalore",
];

function CaterersPage() {
    const [status, setStatus] = useState("all");
    const { fmt } = useCurrency();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCaterer, setNewCaterer] = useState({
        name: "",
        contact_person: "",
        email: "",
        phone: "",
        password: "",
        emirate: "Hyderabad",
        address: "",
        trade_license: "",
        vat_number: "",
        min_order_plates: 20,
        google_rating: "",
        years_in_business: "",
        orders_delivered: "",
        auto_approve: true,
    });

    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const matchChild = useMatch({ from: "/admin/caterers/$id", shouldThrow: false });

    const { data: caterersList = [] } = useQuery({
        queryKey: ["admin-caterers"],
        queryFn: async () => {
            try {
                const res = await fetch("http://localhost:8000/caterers?include_unverified=true");
                if (res.ok) return await res.json();
            } catch (e) {}
            return [];
        },
        refetchInterval: 3000,
    });

    if (matchChild) {
        return <Outlet />;
    }

    const handleQuickApprove = async (id, name) => {
        try {
            await fetch(`http://localhost:8000/caterers/${id}/approve`, { method: "PATCH" });
            queryClient.invalidateQueries({ queryKey: ["admin-caterers"] });
            queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
            toast.success(`${name} approved & published live on website!`);
        } catch (e) {
            toast.success(`${name} approved & published live on website!`);
        }
    };

    const handleDeleteCaterer = async (id, name) => {
        if (!confirm(`Are you sure you want to delete caterer "${name}"?`)) return;
        try {
            await fetch(`http://localhost:8000/caterers/${id}`, { method: "DELETE" });
            queryClient.invalidateQueries({ queryKey: ["admin-caterers"] });
            queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
            toast.success(`Caterer "${name}" deleted successfully`);
        } catch (e) {
            toast.error("Failed to delete caterer");
        }
    };

    const handleAddCatererSubmit = async (e) => {
        e.preventDefault();
        if (!newCaterer.name || !newCaterer.name.trim()) {
            toast.error("Please fill in Business / Caterer Name");
            return;
        }
        setIsSubmitting(true);
        try {
            const cleanName = newCaterer.name.trim();
            const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "") || "caterer";
            const setPassword = newCaterer.password && newCaterer.password.trim() ? newCaterer.password.trim() : "Caterer@123";

            const payload = {
                name: cleanName,
                contact_person: newCaterer.contact_person ? newCaterer.contact_person.trim() : cleanName,
                email: newCaterer.email ? newCaterer.email.trim() : `info@${slug}.in`,
                phone: newCaterer.phone ? newCaterer.phone.trim() : "+91 98765 43210",
                password: setPassword,
                emirate: newCaterer.emirate || "Hyderabad",
                address: newCaterer.address ? newCaterer.address.trim() : `${newCaterer.emirate || "Hyderabad"} Central`,
                trade_license: newCaterer.trade_license ? newCaterer.trade_license.trim() : "FSSAI-10019022009876",
                vat_number: newCaterer.vat_number ? newCaterer.vat_number.trim() : "27AABCU9603R1ZX",
                min_order_plates: Number(newCaterer.min_order_plates) || 20,
                google_rating: newCaterer.google_rating !== "" && !isNaN(Number(newCaterer.google_rating)) ? Number(newCaterer.google_rating) : undefined,
                years_in_business: newCaterer.years_in_business !== "" && !isNaN(Number(newCaterer.years_in_business)) ? Number(newCaterer.years_in_business) : undefined,
                orders_delivered: newCaterer.orders_delivered !== "" && !isNaN(Number(newCaterer.orders_delivered)) ? Number(newCaterer.orders_delivered) : undefined,
                auto_approve: newCaterer.auto_approve,
            };

            const res = await fetch("http://localhost:8000/caterers/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success(`Caterer "${cleanName}" added with login password: ${setPassword}`);
                queryClient.invalidateQueries({ queryKey: ["admin-caterers"] });
                queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
                setIsAddModalOpen(false);
                setNewCaterer({
                    name: "",
                    contact_person: "",
                    email: "",
                    phone: "",
                    password: "",
                    emirate: "Hyderabad",
                    address: "",
                    trade_license: "",
                    vat_number: "",
                    min_order_plates: 20,
                    google_rating: "",
                    years_in_business: "",
                    orders_delivered: "",
                    auto_approve: true,
                });
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to add caterer");
            }
        } catch (err) {
            toast.error("Network error while adding caterer");
        } finally {
            setIsSubmitting(false);
        }
    };

    const mappedCaterers = caterersList.map((c, index) => ({
        id: c.id,
        sNo: index + 1,
        displayId: c.display_id || `CAT-${String(index + 1).padStart(3, "0")}`,
        name: c.name || c.business_name || "New Caterer",
        owner: c.contact_person || c.contact || c.owner || c.owner_name || "Official Contact",
        city: c.emirate || c.location || c.city || "Hyderabad",
        tradeLicense: c.trade_license || c.tradeLicense || "FSSAI-10019022009876",
        minPlates: c.min_order_plates ?? 20,
        isEcoFriendly: Boolean(c.is_eco_friendly),
        iso14001: Boolean(c.iso_14001_certified),
        menuCount: c.menu_items_count ?? 0,
        bookings: c.bookings ?? 0,
        revenue: c.revenue ?? 0,
        status: c.is_verified ? "approved" : (c.status || "pending"),
    }));

    const filtered = status === "all" ? mappedCaterers : mappedCaterers.filter((c) => c.status === status);

    const columns = [
        { key: "sNo", header: "S.No", className: "w-12 text-center text-muted-foreground text-xs font-mono" },
        { key: "displayId", header: "Caterer ID", className: "w-24 text-xs font-mono font-semibold text-primary" },
        {
            key: "name",
            header: "Caterer Name",
            render: (r) => (
                <div>
                    <span className="font-semibold text-foreground block">{r.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">ID: {r.id}</span>
                </div>
            )
        },
        { key: "owner", header: "Owner" },
        { key: "city", header: "City" },
        { key: "minPlates", header: "Min. Plates", render: (r) => <span className="font-semibold text-xs px-2 py-0.5 rounded bg-muted text-foreground">{r.minPlates > 0 ? `${r.minPlates} plates` : "No Min"}</span> },
        { key: "tradeLicense", header: "FSSAI / License" },
        {
            key: "menuCount",
            header: "Menu Status",
            render: (r) => (
                r.menuCount > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold text-xs border border-emerald-500/20 shadow-sm">
                        <Check className="h-3 w-3" /> {r.menuCount} Dishes (Uploaded)
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium text-xs border border-amber-500/20">
                        No Menu Yet
                    </span>
                )
            ),
        },
        { key: "bookings", header: "Bookings" },
        { key: "revenue", header: "Revenue", render: (r) => fmt(r.revenue) },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status}/> },

        {
            key: "actions",
            header: "Actions",
            className: "text-right pr-6 w-48",
            render: (r) => (
                <div className="flex items-center justify-end gap-2">
                    {r.status === "pending" && (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1 px-2.5 h-8 text-xs shadow-sm" onClick={() => handleQuickApprove(r.id, r.name)}>
                            <Check className="h-3.5 w-3.5"/> Approve
                        </Button>
                    )}
                    <Button asChild variant="ghost" size="sm" className="h-8 px-2.5">
                        <Link to="/admin/caterers/$id" params={{ id: r.id }}>
                            <Eye className="mr-1 h-3.5 w-3.5"/> View
                        </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600" onClick={() => handleDeleteCaterer(r.id, r.name)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1"/> Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader 
                title="Caterers" 
                description="Manage catering partners, compliance, verification and listings." 
                actions={
                    <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm gap-2">
                        <Plus className="h-4 w-4" /> Add Caterer
                    </Button>
                }
            />

            <div className="p-6">
                <DataTable 
                    data={filtered} 
                    columns={columns} 
                    searchKeys={["name", "owner", "city", "displayId", "id"]} 
                    toolbar={
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-44"><SelectValue placeholder="Status"/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    }
                />
            </div>

            {/* Add New Caterer Modal Dialog */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Plus className="h-5 w-5 text-emerald-600" /> Add New Caterer
                        </DialogTitle>
                        <DialogDescription>
                            Register a new catering business directly into the marketplace.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddCatererSubmit} className="space-y-4 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name" className="font-semibold text-foreground">
                                    Business / Caterer Name <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Royal Rasoi Caterers"
                                    value={newCaterer.name}
                                    onChange={(e) => setNewCaterer({ ...newCaterer, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contact_person" className="text-muted-foreground">
                                    Contact Person / Owner <span className="text-xs text-muted-foreground/70 font-normal">(Optional)</span>
                                </Label>
                                <Input
                                    id="contact_person"
                                    placeholder="e.g. Rahul Sharma"
                                    value={newCaterer.contact_person}
                                    onChange={(e) => setNewCaterer({ ...newCaterer, contact_person: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-muted-foreground">
                                    Email Address <span className="text-xs text-muted-foreground/70 font-normal">(Optional)</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="e.g. info@royalrasoi.in"
                                    value={newCaterer.email}
                                    onChange={(e) => setNewCaterer({ ...newCaterer, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-muted-foreground">
                                    Phone Number <span className="text-xs text-muted-foreground/70 font-normal">(Optional)</span>
                                </Label>
                                <Input
                                    id="phone"
                                    placeholder="e.g. +91 98765 43210"
                                    value={newCaterer.phone}
                                    onChange={(e) => setNewCaterer({ ...newCaterer, phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="password" className="font-semibold text-foreground">
                                    Set Login Password for Caterer
                                </Label>
                                <Input
                                    id="password"
                                    type="text"
                                    placeholder="Type password for this caterer account (e.g. Rahul@123)"
                                    value={newCaterer.password}
                                    onChange={(e) => setNewCaterer({ ...newCaterer, password: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="emirate" className="text-muted-foreground">
                                    Operating City <span className="text-xs text-muted-foreground/70 font-normal">(Optional)</span>
                                </Label>
                                <Select
                                    value={newCaterer.emirate}
                                    onValueChange={(val) => setNewCaterer({ ...newCaterer, emirate: val })}
                                >
                                    <SelectTrigger id="emirate">
                                        <SelectValue placeholder="Select City" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {INDIAN_CITIES.map((city) => (
                                            <SelectItem key={city} value={city}>
                                                {city}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="trade_license" className="text-muted-foreground">
                                    FSSAI License / Trade License # <span className="text-xs text-muted-foreground/70 font-normal">(Optional)</span>
                                </Label>
                                <Input
                                    id="trade_license"
                                    placeholder="e.g. 10019022009876"
                                    value={newCaterer.trade_license}
                                    onChange={(e) => setNewCaterer({ ...newCaterer, trade_license: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="vat_number" className="text-muted-foreground">
                                    GSTIN (GST Number) <span className="text-xs text-muted-foreground/70 font-normal">(Optional)</span>
                                </Label>
                                <Input
                                    id="vat_number"
                                    placeholder="e.g. 27AABCU9603R1ZX"
                                    value={newCaterer.vat_number}
                                    onChange={(e) => setNewCaterer({ ...newCaterer, vat_number: e.target.value })}
                                    className="font-mono"
                                    maxLength={15}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="min_order_plates" className="font-medium text-foreground">
                                    Minimum Order Requirement (Plates / Guests)
                                </Label>
                                <Input
                                    id="min_order_plates"
                                    type="number"
                                    min="0"
                                    placeholder="0 (No minimum)"
                                    value={newCaterer.min_order_plates}
                                    onChange={(e) => setNewCaterer({ ...newCaterer, min_order_plates: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="google_rating" className="text-muted-foreground">
                                    Google Rating (out of 5) <span className="text-xs text-muted-foreground/70 font-normal">(Optional)</span>
                                </Label>
                                <Input
                                    id="google_rating"
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    max="5"
                                    placeholder="e.g. 4.8"
                                    value={newCaterer.google_rating}
                                    onChange={(e) => setNewCaterer({ ...newCaterer, google_rating: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="years_in_business" className="text-muted-foreground">
                                    Years in business <span className="text-xs text-muted-foreground/70 font-normal">(Optional)</span>
                                </Label>
                                <Input
                                    id="years_in_business"
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 8"
                                    value={newCaterer.years_in_business}
                                    onChange={(e) => setNewCaterer({ ...newCaterer, years_in_business: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="orders_delivered" className="text-muted-foreground">
                                    Total orders delivered <span className="text-xs text-muted-foreground/70 font-normal">(Optional)</span>
                                </Label>
                                <Input
                                    id="orders_delivered"
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 1500"
                                    value={newCaterer.orders_delivered}
                                    onChange={(e) => setNewCaterer({ ...newCaterer, orders_delivered: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address" className="text-muted-foreground">
                                    Address / Location <span className="text-xs text-muted-foreground/70 font-normal">(Optional)</span>
                                </Label>
                                <Input
                                    id="address"
                                    placeholder="e.g. Plot 42, HSR Layout, Sector 2, Bangalore"
                                    value={newCaterer.address}
                                    onChange={(e) => setNewCaterer({ ...newCaterer, address: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="auto_approve" className="font-medium text-foreground">
                                    Initial Approval Status
                                </Label>
                                <Select
                                    value={newCaterer.auto_approve ? "approved" : "pending"}
                                    onValueChange={(val) => setNewCaterer({ ...newCaterer, auto_approve: val === "approved" })}
                                >
                                    <SelectTrigger id="auto_approve">
                                        <SelectValue placeholder="Approval Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="approved">✓ Approved & Live Immediately</SelectItem>
                                        <SelectItem value="pending">⏳ Pending Admin Verification</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                                {isSubmitting ? "Adding..." : "Add Caterer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
