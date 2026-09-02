import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, UserPlus, Pencil, Loader2, Key } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/roles")({
    component: RolesPage,
});

const ACCESS_POINTS = [
    { id: "caterers", label: "Caterers Management & Approval" },
    { id: "bookings", label: "Bookings & Customer Orders" },
    { id: "payments", label: "Payments, Payouts & Refunds" },
    { id: "support", label: "Support Inbox & Ticket Resolutions" },
    { id: "analytics", label: "Analytics & Export Reports" },
    { id: "cms", label: "CMS Banners & FAQ Manager" },
    { id: "roles", label: "Roles & Admin Access Control" },
];

const SYSTEM_PERMISSION_GROUPS = [
    { group: "Dashboard", items: ["View dashboard", "Export dashboard"] },
    { group: "Caterers", items: ["View caterers", "Approve caterers", "Reject caterers", "Request documents"] },
    { group: "Customers", items: ["View customers", "Suspend customers", "Reactivate customers"] },
    { group: "Bookings", items: ["View bookings", "Cancel bookings", "Resolve disputes"] },
    { group: "Payments", items: ["View payments", "Process refunds", "Manage payouts"] },
    { group: "CMS", items: ["Edit landing page", "Edit FAQs", "Edit policies"] },
    { group: "Settings", items: ["Edit platform settings", "Manage security"] },
];

function normalizePermissionLabel(p) {
    if (!p) return p;
    const str = String(p).toLowerCase();
    if (str.includes("caterer")) return "Caterers Management & Approval";
    if (str.includes("booking")) return "Bookings & Customer Orders";
    if (str.includes("payment") || str.includes("payout") || str.includes("refund")) return "Payments, Payouts & Refunds";
    if (str.includes("support")) return "Support Inbox & Ticket Resolutions";
    if (str.includes("analytic") || str.includes("export")) return "Analytics & Export Reports";
    if (str.includes("cms") || str.includes("banner") || str.includes("faq")) return "CMS Banners & FAQ Manager";
    if (str.includes("role") || str.includes("permission")) return "Roles & Admin Access Control";
    return p;
}

function RolesPage() {
    const queryClient = useQueryClient();
    const [inviteOpen, setInviteOpen] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("Super Admin");
    const [selectedPermissions, setSelectedPermissions] = useState([
        "Caterers Management & Approval",
        "Bookings & Customer Orders",
        "Payments, Payouts & Refunds",
    ]);

    const [editingUser, setEditingUser] = useState(null);
    const [editPermissions, setEditPermissions] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: rawUsers = [] } = useQuery({
        queryKey: ["admin-roles-users"],
        queryFn: async () => {
            try {
                const res = await fetch("http://localhost:8000/users");
                if (res.ok) return await res.json();
            } catch (e) {}
            return [];
        },
        refetchInterval: 5000,
    });

    const liveAdminUsers = rawUsers
        .filter((u) => u.role === "admin" || u.role === "ADMIN" || u.role === "superadmin" || u.role === "support" || u.role === "operations" || u.role === "finance")
        .map((u) => {
            const userPerms = u.permissions && u.permissions.length > 0
                ? Array.from(new Set(u.permissions.map(normalizePermissionLabel)))
                : [
                    "Caterers Management & Approval",
                    "Bookings & Customer Orders",
                    "Payments, Payouts & Refunds",
                ];
            return {
                id: u.id,
                name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
                email: u.email,
                role: (u.role || "Admin").toUpperCase(),
                permissions: userPerms,
                lastLogin: "Active",
                status: u.is_verified ? "active" : "pending",
            };
        });

    const systemRoles = [
        {
            id: "R-1",
            name: "Super Admin",
            users: rawUsers.filter((u) => u.role?.toLowerCase() === "superadmin" || u.role?.toLowerCase() === "admin").length,
            permissions: "All Access (42)",
            description: "Full unrestricted access to all modules and configurations."
        },
        {
            id: "R-2",
            name: "Support Manager",
            users: rawUsers.filter((u) => u.role?.toLowerCase() === "support").length,
            permissions: "18 Permissions",
            description: "Manages support tickets, complaints, and customer/caterer communications."
        },
        {
            id: "R-3",
            name: "Operations Lead",
            users: rawUsers.filter((u) => u.role?.toLowerCase() === "operations").length,
            permissions: "22 Permissions",
            description: "Handles bookings, caterer verifications, menu approvals, and order logistics."
        },
        {
            id: "R-4",
            name: "Finance Officer",
            users: rawUsers.filter((u) => u.role?.toLowerCase() === "finance").length,
            permissions: "14 Permissions",
            description: "Manages payments, payouts, settlements, invoices, and refunds."
        },
    ];

    const togglePermission = (label, isEdit = false) => {
        if (isEdit) {
            setEditPermissions((prev) =>
                prev.includes(label) ? prev.filter((p) => p !== label) : [...prev, label]
            );
        } else {
            setSelectedPermissions((prev) =>
                prev.includes(label) ? prev.filter((p) => p !== label) : [...prev, label]
            );
        }
    };

    const handleDeleteUser = async (id, userName) => {
        if (!confirm(`Are you sure you want to revoke access and remove admin "${userName}"?`)) return;
        try {
            await fetch(`http://localhost:8000/users/${id}`, { method: "DELETE" });
            queryClient.invalidateQueries({ queryKey: ["admin-roles-users"] });
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            toast.success(`Access revoked for "${userName}"`);
        } catch (e) {
            toast.error("Failed to remove admin");
        }
    };

    const handleInviteAdmin = async (e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) {
            toast.error("Please fill in full name and email address");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("http://localhost:8000/users/invite-admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    role,
                    permissions: selectedPermissions,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(data.message || `Access email dispatched to ${email}!`);
                setName("");
                setEmail("");
                setInviteOpen(false);
                queryClient.invalidateQueries({ queryKey: ["admin-roles-users"] });
            } else {
                toast.error("Failed to send admin invitation email");
            }
        } catch (err) {
            toast.error("Error connecting to server");
        } finally {
            setIsSubmitting(false);
        }
    };

    const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);

    const handleSaveEditPermissions = async (e) => {
        e.preventDefault();
        setIsUpdatingPermissions(true);
        try {
            const res = await fetch(`http://localhost:8000/users/${editingUser.id}/permissions`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ permissions: editPermissions }),
            });
            if (res.ok) {
                toast.success(`Access permissions updated for ${editingUser.name}!`);
                queryClient.invalidateQueries({ queryKey: ["admin-roles-users"] });
                setEditingUser(null);
            } else {
                toast.error("Failed to update access permissions");
            }
        } catch (err) {
            toast.error("Error connecting to server");
        } finally {
            setIsUpdatingPermissions(false);
        }
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        const userPerms = (user.permissions || []).map(normalizePermissionLabel);
        setEditPermissions(userPerms);
    };

    const userCols = [
        { key: "name", header: "Name" },
        { key: "email", header: "Email" },
        { key: "role", header: "Role" },
        {
            key: "permissions",
            header: "Granted Access Points",
            render: (r) => (
                <div className="flex flex-wrap gap-1.5 max-w-sm py-1">
                    {r.permissions.map((p) => (
                        <Badge
                            key={p}
                            variant="outline"
                            className="text-xs font-semibold py-1 px-2.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1.5 shadow-sm"
                        >
                            <Key className="h-3 w-3 text-emerald-500"/> {p}
                        </Badge>
                    ))}
                </div>
            ),
        },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status}/> },
        {
            key: "actions",
            header: "Actions",
            className: "text-right pr-6 w-48",
            render: (r) => (
                <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => handleOpenEdit(r)}>
                        <Pencil className="mr-1 h-3.5 w-3.5"/> Edit Access
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600" onClick={() => handleDeleteUser(r.id, r.name)}>
                        <Trash2 className="mr-1 h-3.5 w-3.5"/> Revoke
                    </Button>
                </div>
            ),
        },
    ];

    const roleCols = [
        { key: "name", header: "Role" },
        { key: "users", header: "Users Assigned" },
        { key: "permissions", header: "Permissions" },
        { key: "description", header: "Description" },
    ];

    return (<>
      <PageHeader title="Roles & Permissions" description="Manage real system admin accounts, roles, and access control." actions={
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="mr-2 h-4 w-4"/> Invite Admin</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Invite New Administrator & Assign Access</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInviteAdmin} className="space-y-4 my-2">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input placeholder="e.g. Rahul Sharma" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input type="email" placeholder="rahul@catererco.in" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                      <SelectItem value="Operations Lead">Operations Lead</SelectItem>
                      <SelectItem value="Finance Officer">Finance Officer</SelectItem>
                      <SelectItem value="Support Manager">Support Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Access Permissions</Label>
                  <div className="grid gap-2 bg-muted/40 p-3 rounded-xl border border-border/60">
                    {ACCESS_POINTS.map((ap) => {
                      const isChecked = selectedPermissions.includes(ap.label);
                      return (
                        <label
                          key={ap.id}
                          className="flex items-center gap-2.5 text-xs font-medium cursor-pointer select-none hover:text-primary transition-colors"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => togglePermission(ap.label)}
                          />
                          <span>{ap.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Sending...</> : "Send Invite"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }/>
      <div className="p-6">
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Admin Accounts ({liveAdminUsers.length})</TabsTrigger>
            <TabsTrigger value="roles">System Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permissions Matrix</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4">
            <DataTable data={liveAdminUsers} columns={userCols} searchKeys={["name", "email", "role"]}/>
          </TabsContent>
          <TabsContent value="roles" className="mt-4">
            <DataTable data={systemRoles} columns={roleCols} searchKeys={["name"]}/>
          </TabsContent>
          <TabsContent value="permissions" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Access Control Matrix</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {SYSTEM_PERMISSION_GROUPS.map((g) => (<div key={g.group} className="rounded-lg border p-4">
                    <p className="mb-3 text-sm font-semibold">{g.group}</p>
                    <div className="space-y-2">
                      {g.items.map((it) => (<label key={it} className="flex items-center gap-2 text-sm">
                          <Checkbox defaultChecked/> {it}
                        </label>))}
                    </div>
                  </div>))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Edit Access Permissions for {editingUser?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEditPermissions} className="space-y-4 my-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Granted Access Checkboxes</Label>
              <div className="grid gap-2 bg-muted/40 p-3 rounded-xl border border-border/60">
                {ACCESS_POINTS.map((ap) => {
                  const isChecked = editPermissions.includes(ap.label);
                  return (
                    <label
                      key={ap.id}
                      className="flex items-center gap-2.5 text-xs font-medium cursor-pointer select-none hover:text-primary transition-colors"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => togglePermission(ap.label, true)}
                      />
                      <span>{ap.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button type="submit" disabled={isUpdatingPermissions}>
                {isUpdatingPermissions ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : "Save Permissions"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>);
}
