import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ChefHat, Users, Sparkles, CalendarCheck, Wallet, Star, BarChart3, FileText, Bell, LifeBuoy, Shield, Settings, UtensilsCrossed, } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, } from "@/components/ui/sidebar";
const groups = [
    {
        label: "Overview",
        items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true }],
    },
    {
        label: "Marketplace",
        items: [
            { title: "Caterers", url: "/admin/caterers", icon: ChefHat },
            { title: "Customers", url: "/admin/customers", icon: Users },
            { title: "Bookings", url: "/admin/bookings", icon: CalendarCheck },
            { title: "Payments", url: "/admin/payments", icon: Wallet },
            { title: "Reviews", url: "/admin/reviews", icon: Star },
        ],
    },
    {
        label: "Insights",
        items: [{ title: "Analytics", url: "/admin/analytics", icon: BarChart3 }],
    },
    {
        label: "Platform",
        items: [
            { title: "CMS", url: "/admin/cms", icon: FileText },
            { title: "Notifications", url: "/admin/notifications", icon: Bell },
            { title: "Support", url: "/admin/support", icon: LifeBuoy },
            { title: "Roles & Permissions", url: "/admin/roles", icon: Shield },
            { title: "Settings", url: "/admin/settings", icon: Settings },
        ],
    },
];
export function AdminSidebar() {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const isActive = (url, exact) => exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");
    return (<Sidebar collapsible="icon" className="border-r border-white/5">
      <SidebarHeader className="border-b border-white/5">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-primary">
            <UtensilsCrossed className="h-4 w-4"/>
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-display text-sm font-semibold tracking-tight">CatererCo</span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Admin Console
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (<SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => (<SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>))}
      </SidebarContent>
    </Sidebar>);
}
