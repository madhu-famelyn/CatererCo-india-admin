import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, UtensilsCrossed, ChefHat, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency-context";

export const Route = createFileRoute("/admin/menu-items")({
    component: AdminMenuItems,
});

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

function AdminMenuItems() {
    const qc = useQueryClient();
    const { fmt, config } = useCurrency();
    const [search, setSearch] = useState("");
    const [activeCaterer, setActiveCaterer] = useState("all");

    const { data: allMenus = [], isLoading } = useQuery({
        queryKey: ["admin-all-menus"],
        queryFn: async () => {
            const res = await fetch(`${BASE}/menu/all`);
            if (!res.ok) return [];
            return res.json();
        },
    });

    const deleteMut = useMutation({
        mutationFn: async (itemId) => {
            const res = await fetch(`${BASE}/admin/menu/${itemId}`, { method: "DELETE" });
            if (!res.ok && res.status !== 204) throw new Error("Delete failed");
        },
        onSuccess: () => {
            toast.success("Item deleted");
            qc.invalidateQueries({ queryKey: ["admin-all-menus"] });
        },
        onError: () => toast.error("Failed to delete item"),
    });

    const filtered = activeCaterer === "all"
        ? allMenus
        : allMenus.filter((c) => c.caterer_id === activeCaterer);

    const totalItems = allMenus.reduce((s, c) => s + Object.values(c.items).flat().length, 0);
    const avgItems = allMenus.length > 0 ? Math.round(totalItems / allMenus.length) : 0;

    return (
        <>
            <PageHeader
                title="Menu Items"
                description={`${totalItems} total items across ${allMenus.length} caterers`}
            />
            <div className="p-6 space-y-6">
                {/* Summary stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{allMenus.length}</div>
                            <div className="text-sm text-muted-foreground mt-1">Caterers with menus</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{totalItems}</div>
                            <div className="text-sm text-muted-foreground mt-1">Total menu items</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{avgItems}</div>
                            <div className="text-sm text-muted-foreground mt-1">Avg items per caterer</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Caterer filter tabs */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setActiveCaterer("all")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            activeCaterer === "all"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        All Caterers
                    </button>
                    {allMenus.map((c) => (
                        <button
                            key={c.caterer_id}
                            onClick={() => setActiveCaterer(c.caterer_id)}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                activeCaterer === c.caterer_id
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <ChefHat className="h-3 w-3" />
                            {c.caterer_name}
                            <span className={`rounded-full px-1.5 text-[10px] ${activeCaterer === c.caterer_id ? "bg-white/20" : "bg-background"}`}>
                                {Object.values(c.items).flat().length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search items..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-8">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading menu items…
                    </div>
                ) : filtered.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <UtensilsCrossed className="h-10 w-10 mb-3 opacity-40" />
                            <p className="text-sm">No menu items found.</p>
                            <p className="text-xs mt-1">Caterers can add items via their dashboard.</p>
                        </CardContent>
                    </Card>
                ) : (
                    filtered.map((catererMenu) => {
                        const allItems = Object.entries(catererMenu.items)
                            .flatMap(([cat, items]) => items.map((i) => ({ ...i, categoryLabel: cat })))
                            .filter(
                                (i) =>
                                    !search.trim() ||
                                    i.name.toLowerCase().includes(search.toLowerCase()) ||
                                    i.categoryLabel.toLowerCase().includes(search.toLowerCase())
                            );
                        if (allItems.length === 0) return null;
                        return (
                            <Card key={catererMenu.caterer_id}>
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <div className="flex items-center gap-2">
                                        <ChefHat className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-base">{catererMenu.caterer_name}</CardTitle>
                                        <Badge variant="secondary">{allItems.length} items</Badge>
                                    </div>
                                    <Button asChild variant="outline" size="sm">
                                        <Link to="/admin/caterers/$id" params={{ id: catererMenu.caterer_id }}>
                                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View Caterer
                                        </Link>
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-lg border overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50 border-b">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wide">Item</th>
                                                    <th className="px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wide">Category</th>
                                                    <th className="px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wide">Price ({config.symbol})</th>
                                                    <th className="px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wide">Veg</th>
                                                    <th className="px-4 py-2.5 text-right font-medium text-xs uppercase tracking-wide">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {allItems.map((item) => (
                                                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-2.5 font-medium">{item.name}</td>
                                                        <td className="px-4 py-2.5 text-muted-foreground">{item.categoryLabel}</td>
                                                        <td className="px-4 py-2.5">{item.price}</td>
                                                        <td className="px-4 py-2.5">
                                                            {item.veg ? (
                                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10">Veg</Badge>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 px-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                                                                disabled={deleteMut.isPending}
                                                                onClick={() => {
                                                                    if (confirm(`Delete "${item.name}"?`)) {
                                                                        deleteMut.mutate(item.id);
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </>
    );
}
