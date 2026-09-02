import { useState, useEffect } from "react";
import { Outlet, createFileRoute, Link } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";
export const Route = createFileRoute("/admin")({
    component: AdminLayout,
});

function AdminLayout() {
    const [adminName, setAdminName] = useState("Sonu Sah");

    useEffect(() => {
        const updateAdminName = () => {
            try {
                const saved = localStorage.getItem("admin_profile");
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.fullName) setAdminName(parsed.fullName);
                }
            } catch (e) {}
        };
        updateAdminName();
        window.addEventListener("storage", updateAdminName);
        window.addEventListener("admin_profile_updated", updateAdminName);
        const interval = setInterval(updateAdminName, 500);
        return () => {
            window.removeEventListener("storage", updateAdminName);
            window.removeEventListener("admin_profile_updated", updateAdminName);
            clearInterval(interval);
        };
    }, []);

    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsList, setNotificationsList] = useState([]);

    const fetchLiveNotifications = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch("http://localhost:8000/notifications", {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setNotificationsList(
                        data.map((n) => ({
                            id: n.id,
                            title: n.title || "Notification Alert",
                            message: n.body || n.message || "",
                            time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
                        }))
                    );
                    const unread = data.filter((n) => n.unread !== false).length;
                    setUnreadCount(unread);
                }
            }
        } catch (e) {
            // Silently handle transient connection errors during server reloads or background polling
        }
    };

    useEffect(() => {
        fetchLiveNotifications();
        const interval = setInterval(fetchLiveNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    const markAllRead = () => {
        setUnreadCount(0);
    };

    const initials = adminName
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase() || "AU";

    return (<SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AdminSidebar />
        <div className="relative flex flex-1 flex-col">
          {/* subtle top vignette */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(to_bottom,oklch(1_0_0/0.02),transparent)]"/>

          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-white/5 bg-background/70 px-4 backdrop-blur-xl">
            <SidebarTrigger className="hover:bg-white/5"/>
            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
              <Input placeholder="Search caterers, bookings, customers…" className="border-white/5 bg-white/[0.03] pl-8 placeholder:text-muted-foreground/70 focus-visible:border-primary/40 focus-visible:ring-primary/20"/>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hover:bg-accent">
                    <Bell className="h-4 w-4"/>
                    {unreadCount > 0 && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"/>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      <span className="font-bold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs font-semibold text-primary hover:underline">
                        Mark read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
                    {notificationsList.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        No new notifications.
                      </div>
                    ) : (
                      notificationsList.map((n) => (
                        <div key={n.id} className="p-3 hover:bg-muted/50 transition cursor-pointer text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-foreground">{n.title}</p>
                            <span className="text-[10px] text-muted-foreground">{n.time}</span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-border p-2 text-center bg-muted/20">
                    <Link to="/admin/notifications" className="text-xs font-semibold text-primary hover:underline block py-1">
                      Open Notification Center →
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2 hover:bg-white/5">
                    <Avatar className="h-7 w-7 ring-2 ring-primary/30">
                      <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium sm:inline">{adminName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/admin/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/change-password">Change Password</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/login">Sign out</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="relative flex-1">
            <Outlet />
          </main>
        </div>
        <Toaster />
      </div>
    </SidebarProvider>);
}
