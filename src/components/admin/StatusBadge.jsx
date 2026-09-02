import { Badge } from "@/components/ui/badge";
const map = {
    pending: { label: "Pending", className: "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-300" },
    approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300" },
    active: { label: "Active", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300" },
    paid: { label: "Paid", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300" },
    completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300" },
    resolved: { label: "Resolved", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300" },
    rejected: { label: "Rejected", className: "bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-300" },
    cancelled: { label: "Cancelled", className: "bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-300" },
    failed: { label: "Failed", className: "bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-300" },
    suspended: { label: "Suspended", className: "bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-300" },
    refunded: { label: "Refunded", className: "bg-violet-100 text-violet-800 hover:bg-violet-100 dark:bg-violet-500/20 dark:text-violet-300" },
    in_progress: { label: "In Progress", className: "bg-sky-100 text-sky-800 hover:bg-sky-100 dark:bg-sky-500/20 dark:text-sky-300" },
    open: { label: "Open", className: "bg-sky-100 text-sky-800 hover:bg-sky-100 dark:bg-sky-500/20 dark:text-sky-300" },
};
export function StatusBadge({ status }) {
    const cfg = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
    return <Badge className={cfg.className + " border-transparent font-medium"}>{cfg.label}</Badge>;
}
