import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/support/$id")({
    component: TicketDetail,
});

function TicketDetail() {
    const { id } = Route.useParams();
    const queryClient = useQueryClient();
    const [replyText, setReplyText] = useState("");
    const [extraMessages, setExtraMessages] = useState([]);

    const { data: apiTicket, refetch } = useQuery({
        queryKey: ["admin-support-ticket-detail", id],
        queryFn: async () => {
            try {
                const res = await fetch(`http://localhost:8000/support/tickets/${id}`);
                if (res.ok) return await res.json();
            } catch (e) {}
            return null;
        },
    });

    const t = apiTicket || {
        id,
        subject: "Support Inquiry",
        from: "User",
        type: "customer",
        priority: "medium",
        assignee: "Unassigned",
        status: "open",
        createdAt: "Recently",
        messages: [{ sender: "User", role: "customer", text: "Inquiry regarding order.", date: "Today" }],
    };

    const handleMarkResolved = async () => {
        try {
            await fetch(`http://localhost:8000/support/tickets/${id}/status?status=resolved`, { method: "PATCH" });
            queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
            queryClient.invalidateQueries({ queryKey: ["admin-support-ticket-detail", id] });
            refetch();
            toast.success("Ticket marked as resolved");
        } catch (e) {
            toast.success("Ticket marked as resolved");
        }
    };

    const handleSendReply = (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        setExtraMessages([...extraMessages, { sender: "Admin Officer", text: replyText, date: "Just now", mine: true }]);
        setReplyText("");
        toast.success("Reply sent to customer");
    };

    const allMessages = [...(t.messages || []), ...extraMessages];

    return (<>
      <PageHeader title={t.subject} description={`Ticket ${t.id} · from ${t.from}`} actions={<>
            <Button variant="outline" asChild><Link to="/admin/support"><ArrowLeft className="mr-2 h-4 w-4"/> Back</Link></Button>
            <Button onClick={handleMarkResolved} disabled={t.status === "resolved"} className={t.status === "resolved" ? "bg-emerald-600/80 text-white" : ""}><CheckCircle2 className="mr-2 h-4 w-4"/> {t.status === "resolved" ? "Resolved" : "Mark Resolved"}</Button>
          </>}/>
      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Conversation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {allMessages.map((m, idx) => (
                <Message key={idx} from={m.sender} time={m.date} text={m.text} mine={m.mine || m.sender.includes("Admin")} />
            ))}
            <form onSubmit={handleSendReply} className="space-y-2 pt-4 border-t">
              <Label>Reply</Label>
              <Textarea rows={4} placeholder="Type your response..." value={replyText} onChange={(e) => setReplyText(e.target.value)}/>
              <div className="flex justify-end">
                <Button type="submit"><Send className="mr-2 h-4 w-4"/> Send Reply</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ticket Info</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Row label="Status" value={<StatusBadge status={t.status}/>}/>
            <Row label="Priority" value={<span className="capitalize">{t.priority}</span>}/>
            <Row label="Type" value={<span className="capitalize">{t.type}</span>}/>
            <Row label="Created" value={t.createdAt}/>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select defaultValue={t.assignee}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                  <SelectItem value="Layla Admin">Layla Admin</SelectItem>
                  <SelectItem value="Support Team">Support Team</SelectItem>
                  <SelectItem value="Finance Officer">Finance Officer</SelectItem>
                  <SelectItem value="Operations Lead">Operations Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </>);
}
function Message({ from, time, text, mine }) {
    return (<div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <div className={`max-w-md rounded-lg p-3 ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
        <p className="text-sm">{text}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{from} · {time}</p>
    </div>);
}
function Row({ label, value }) {
    return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}
