import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable } from "@/components/admin/DataTable";
import { Send, Pencil, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/notifications")({
    component: NotificationsPage,
});

const defaultEmailTemplates = [
    { id: "T-1", name: "Welcome Email", subject: "Welcome to CatererCo India!", updatedAt: "2026-07-01", body: "Hello {{name}},\n\nWelcome to CatererCo India! Discover top-rated caterers and request custom quotes instantly.\n\nBest regards,\nCatererCo Team" },
    { id: "T-2", name: "Booking Confirmation", subject: "Your Catering Booking #ID is Confirmed", updatedAt: "2026-07-10", body: "Hello {{name}},\n\nYour catering booking #{{booking_id}} has been confirmed by {{caterer_name}}.\n\nBest regards,\nCatererCo Team" },
    { id: "T-3", name: "Quotation Received", subject: "New Custom Catering Quotation", updatedAt: "2026-07-12", body: "Hello {{name}},\n\nYou have received a new custom catering quotation.\n\nBest regards,\nCatererCo Team" },
    { id: "T-4", name: "Verification Approved", subject: "Your Caterer Account is Approved!", updatedAt: "2026-07-15", body: "Congratulations {{caterer_name}},\n\nYour partner application has been approved! You are now live on CatererCo.\n\nBest regards,\nCatererCo Team" },
];

function NotificationsPage() {
    const queryClient = useQueryClient();
    const [audience, setAudience] = useState("customers");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    const [templates, setTemplates] = useState(defaultEmailTemplates);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [tplName, setTplName] = useState("");
    const [tplSubject, setTplSubject] = useState("");
    const [tplBody, setTplBody] = useState("");

    const [isSavingTemplate, setIsSavingTemplate] = useState(false);

    const handleOpenEdit = (t) => {
        setEditingTemplate(t);
        setTplName(t.name);
        setTplSubject(t.subject);
        setTplBody(t.body || "");
    };

    const handleSaveTemplate = (e) => {
        e.preventDefault();
        setIsSavingTemplate(true);
        setTemplates((prev) => prev.map((item) => item.id === editingTemplate.id ? { ...item, name: tplName, subject: tplSubject, body: tplBody, updatedAt: new Date().toISOString().slice(0, 10) } : item));
        toast.success(`Email template '${tplName}' updated successfully!`);
        setTimeout(() => {
            setIsSavingTemplate(false);
            setEditingTemplate(null);
        }, 300);
    };

    const { data: apiNotifications = [] } = useQuery({
        queryKey: ["admin-notifications-history"],
        queryFn: async () => {
            try {
                const res = await fetch("http://localhost:8000/notifications");
                if (res.ok) return await res.json();
            } catch (e) {}
            return [];
        },
        refetchInterval: 5000,
    });

    const handleSendNotification = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            toast.error("Please provide both title and message");
            return;
        }

        setIsSending(true);
        try {
            const res = await fetch("http://localhost:8000/notifications/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channel: "email", audience, title, message }),
            });
            if (res.ok) {
                const data = await res.json();
                toast.success(data.message || "Notification email broadcasted successfully!");
                setTitle("");
                setMessage("");
                queryClient.invalidateQueries({ queryKey: ["admin-notifications-history"] });
            } else {
                toast.error("Failed to dispatch notification email");
            }
        } catch (err) {
            toast.error("Error connecting to notification service");
        } finally {
            setIsSending(false);
        }
    };

    const liveHistory = apiNotifications.map((n) => ({
        id: `N-${100 + n.id}`,
        title: n.title || n.message || "Notification Alert",
        channel: "Email",
        audience: audience.toUpperCase(),
        sentAt: n.created_at ? new Date(n.created_at).toLocaleString() : "Recently",
    }));

    const templateCols = [
        { key: "id", header: "ID" },
        { key: "name", header: "Template" },
        { key: "subject", header: "Subject" },
        { key: "updatedAt", header: "Updated" },
        {
            key: "actions",
            header: "Actions",
            className: "text-right pr-6 w-48",
            render: (r) => (
                <div className="flex justify-end">
                    <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(r)}>
                        <Pencil className="mr-1 h-4 w-4"/> Edit
                    </Button>
                </div>
            ),
        },
    ];
    const historyCols = [
        { key: "id", header: "ID" },
        { key: "title", header: "Title" },
        { key: "channel", header: "Channel" },
        { key: "audience", header: "Audience" },
        { key: "sentAt", header: "Sent At" },
    ];

    return (<>
      <PageHeader title="Notification Center" description="Templates, announcements and delivery history."/>
      <div className="p-6">
        <Tabs defaultValue="send">
          <TabsList>
            <TabsTrigger value="send">Send Email Notification</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Compose Email Announcement</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger className="w-full md:w-72"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customers">All Customers</SelectItem>
                      <SelectItem value="caterers">All Caterers</SelectItem>
                      <SelectItem value="admins">Admins Only</SelectItem>
                      <SelectItem value="all">All Registered Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject / Email Title</Label>
                  <Input placeholder="e.g. Special Offer or Important Update" value={title} onChange={(e) => setTitle(e.target.value)}/>
                </div>
                <div className="space-y-2">
                  <Label>Email Content</Label>
                  <Textarea rows={6} placeholder="Write your message here... Sent directly to recipient inboxes." value={message} onChange={(e) => setMessage(e.target.value)}/>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSendNotification} disabled={isSending}>
                    {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                    {isSending ? "Dispatching Email..." : "Send Email Broadcast"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <DataTable data={templates} columns={templateCols} searchKeys={["name", "subject"]}/>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <DataTable data={liveHistory} columns={historyCols} searchKeys={["title", "audience"]}/>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTemplate} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <Label>Template Name</Label>
              <Input value={tplName} onChange={(e) => setTplName(e.target.value)}/>
            </div>
            <div className="space-y-1.5">
              <Label>Default Subject Line</Label>
              <Input value={tplSubject} onChange={(e) => setTplSubject(e.target.value)}/>
            </div>
            <div className="space-y-1.5">
              <Label>Email Body Template</Label>
              <Textarea rows={7} value={tplBody} onChange={(e) => setTplBody(e.target.value)}/>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
              <Button type="submit" disabled={isSavingTemplate}>
                {isSavingTemplate ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                {isSavingTemplate ? "Saving..." : "Save Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>);
}
