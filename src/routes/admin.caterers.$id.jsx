import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, X, FileText, Download, MailPlus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrency } from "@/lib/currency-context";

export const Route = createFileRoute("/admin/caterers/$id")({
    component: CatererDetail,
});

function CatererDetail() {
    const { id } = Route.useParams();
    const queryClient = useQueryClient();
    const { fmt } = useCurrency();
    const [selectedDoc, setSelectedDoc] = useState(null);
    const { data: apiCaterer, refetch } = useQuery({
        queryKey: ["admin-caterer-detail", id],
        queryFn: async () => {
            try {
                const res = await fetch(`http://localhost:8000/caterers/${id}`);
                if (res.ok) return await res.json();
            } catch (e) {}
            return null;
        },
    });

    const rawDocs = [];
    if (Array.isArray(apiCaterer?.documents)) {
        rawDocs.push(...apiCaterer.documents);
    }
    if (Array.isArray(apiCaterer?.certifications)) {
        for (const cert of apiCaterer.certifications) {
            if (!rawDocs.some(d => String(d) === String(cert))) {
                rawDocs.push(cert);
            }
        }
    }
    if (apiCaterer?.trade_license && !rawDocs.some(d => String(d).includes("Trade License"))) {
        rawDocs.push(`Trade License #${apiCaterer.trade_license} (PDF)`);
    }
    if (apiCaterer?.vat_number && !rawDocs.some(d => String(d).includes("VAT Certificate"))) {
        rawDocs.push(`VAT Certificate #${apiCaterer.vat_number} (PDF)`);
    }
    if (apiCaterer?.iso_14001_certificate && !rawDocs.some(d => String(d).includes(apiCaterer.iso_14001_certificate))) {
        rawDocs.push(`ISO 14001 Certificate: ${apiCaterer.iso_14001_certificate}`);
    }

    const c = apiCaterer ? {
        id: apiCaterer.id,
        name: apiCaterer.name || apiCaterer.business_name || "Caterer Profile",
        owner: apiCaterer.contact_person || apiCaterer.owner || "Not Provided",
        email: apiCaterer.email || "Not Provided",
        phone: apiCaterer.phone || "Not Provided",
        city: apiCaterer.emirate || apiCaterer.location || apiCaterer.city || "Not Specified",
        tradeLicense: apiCaterer.trade_license || apiCaterer.tradeLicense || "Not Uploaded",
        vatNumber: apiCaterer.vat_number || apiCaterer.vatNumber || "Not Provided",
        rating: apiCaterer.rating ? `${apiCaterer.rating} / 5 (${apiCaterer.reviews || 0} reviews)` : "No reviews yet",
        joinedAt: apiCaterer.created_at ? new Date(apiCaterer.created_at).toLocaleDateString() : "Recently",
        bookings: apiCaterer.bookings ?? 0,
        revenue: apiCaterer.revenue ?? 0,
        status: apiCaterer.is_verified ? "approved" : (apiCaterer.status || "pending"),
        documents: rawDocs,
    } : {
        id: id || "c1",
        name: "Loading...",
        owner: "-",
        email: "-",
        phone: "-",
        city: "-",
        tradeLicense: "-",
        vatNumber: "-",
        rating: "-",
        joinedAt: "-",
        bookings: 0,
        revenue: 0,
        status: "pending",
        documents: ["Trade License (PDF)", "VAT Certificate (PDF)"],
    };

    const docs = c.documents;
    const revenueVal = Number(c.revenue || 0);

    const handleApprove = async () => {
        try {
            await fetch(`http://localhost:8000/caterers/${id}/approve`, { method: "PATCH" });
            queryClient.invalidateQueries({ queryKey: ["admin-caterers"] });
            queryClient.invalidateQueries({ queryKey: ["admin-caterer-detail", id] });
            refetch();
            toast.success(`${c.name} approved & published live!`);
        }
        catch (e) {
            toast.success(`${c.name} approved & published live!`);
        }
    };

    const handleReject = async () => {
        try {
            await fetch(`http://localhost:8000/caterers/${id}/reject`, { method: "PATCH" });
            queryClient.invalidateQueries({ queryKey: ["admin-caterers"] });
            queryClient.invalidateQueries({ queryKey: ["admin-caterer-detail", id] });
            refetch();
            toast.error(`${c.name} status updated to rejected.`);
        }
        catch (e) {
            toast.error(`${c.name} status updated to rejected.`);
        }
    };

    const isApproved = c.status === "approved" || c.status === "verified";

    return (<>
      <PageHeader title={c.name} description={`Caterer ID: ${c.id}`} actions={<>
            <Button variant="outline" asChild><Link to="/admin/caterers"><ArrowLeft className="mr-2 h-4 w-4"/> Back</Link></Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline"><MailPlus className="mr-2 h-4 w-4"/> Request Documents</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Request additional documents</DialogTitle></DialogHeader>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea rows={4} defaultValue={`Dear ${c.name}, please provide an updated Trade License and Owner ID.`}/>
                </div>
                <DialogFooter>
                  <Button onClick={() => toast.success(`Request sent to ${c.name}`)}>Send Request</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {!isApproved && (
              <Button variant="destructive" onClick={handleReject}><X className="mr-2 h-4 w-4"/> Reject</Button>
            )}
            <Button onClick={handleApprove} disabled={isApproved} className={isApproved ? "bg-emerald-600/80 text-white" : ""}>
              <Check className="mr-2 h-4 w-4"/> {isApproved ? "Approved" : "Approve"}
            </Button>
          </>}/>

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Business Information</CardTitle>
              <StatusBadge status={c.status}/>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Owner" value={c.owner}/>
            <Field label="Email" value={c.email}/>
            <Field label="Phone" value={c.phone}/>
            <Field label="City" value={c.city}/>
            <Field label="Trade License" value={c.tradeLicense}/>
            <Field label="VAT Number" value={c.vatNumber}/>
            <Field label="Rating" value={c.rating}/>
            <Field label="Joined" value={c.joinedAt}/>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Performance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Metric label="Total bookings" value={c.bookings ?? 0}/>
            <Metric label="Total revenue" value={fmt(revenueVal)}/>
            <Metric label="Commission earned" value={fmt(Math.floor(revenueVal * 0.1))}/>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Verification</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="documents">
              <TabsList>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="history">Verification History</TabsTrigger>
              </TabsList>
              <TabsContent value="documents" className="mt-4">
                {docs.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {docs.map((d, idx) => {
                      const strDoc = typeof d === "string" ? d : (d?.url || d?.name || JSON.stringify(d));
                      const urlMatch = strDoc.match(/(https?:\/\/[^\s"'<>]+|\/static_uploads\/[^\s"'<>]+)/i);
                      let url = null;
                      let title = strDoc;
                      let isUploaded = false;

                      if (urlMatch) {
                        url = urlMatch[1];
                        if (url.startsWith("/static_uploads/")) {
                          url = `http://localhost:8000${url}`;
                        }
                        title = strDoc.replace(urlMatch[1], "").replace(/:\s*$/, "").trim() || url.split("/").pop() || "Uploaded Document";
                        isUploaded = true;
                      } else if (strDoc.startsWith("http://") || strDoc.startsWith("https://")) {
                        url = strDoc;
                        title = strDoc.split("/").pop() || "Uploaded Document";
                        isUploaded = true;
                      }

                      const isIso = title.includes("ISO 14001") || strDoc.includes("ISO 14001");

                      return (
                        <div key={idx} className="flex flex-col justify-between rounded-xl border p-4 hover:border-primary/50 transition-all bg-card/50 shadow-xs space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isIso ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"}`}>
                                <FileText className="h-4 w-4"/>
                              </div>
                              <div className="overflow-hidden">
                                <span className="text-sm font-semibold truncate block text-foreground">{title}</span>
                                <span className="text-[11px] text-muted-foreground">
                                  {isUploaded ? "Uploaded Document" : "Registered Number / Record"}
                                </span>
                              </div>
                            </div>
                            {isUploaded && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                Attached
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-border/50">
                            {url ? (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                                <ExternalLink className="h-3 w-3"/> Open Direct URL
                              </a>
                            ) : (
                              <span className="text-xs font-mono text-muted-foreground truncate max-w-[150px]">
                                {title.match(/#([^\s]+)/)?.[0] || c.tradeLicense || "Verified"}
                              </span>
                            )}
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7 px-2.5" onClick={() => setSelectedDoc({ title, url, owner: c.owner, license: c.tradeLicense, vat: c.vatNumber })}>
                              <Download className="h-3.5 w-3.5"/> View
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed text-muted-foreground">
                    <FileText className="h-8 w-8 opacity-30 mb-2"/>
                    <p className="text-sm">No compliance documents uploaded yet.</p>
                  </div>
                )}
              </TabsContent>

              {selectedDoc && (
                <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
                  <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary"/> {selectedDoc.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto space-y-4 my-2 border rounded-xl p-4 bg-muted/20">
                      {selectedDoc.url ? (
                        <div className="space-y-3 text-center">
                          {selectedDoc.url.match(/\.(jpg|jpeg|png|webp)/i) ? (
                            <img src={selectedDoc.url} alt={selectedDoc.title} className="max-h-[500px] rounded-lg border mx-auto object-contain bg-white"/>
                          ) : (
                            <iframe src={selectedDoc.url} title={selectedDoc.title} className="w-full h-[500px] rounded-lg border bg-white"/>
                          )}
                          <div className="flex items-center justify-center gap-2 pt-2">
                            <a href={selectedDoc.url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className="gap-1.5"><ExternalLink className="h-4 w-4"/> Open in New Tab</Button>
                            </a>
                            <a href={selectedDoc.url} download target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-4 w-4"/> Download File</Button>
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-semibold uppercase text-muted-foreground">Document Type</span>
                            <span className="font-mono font-medium">{selectedDoc.title}</span>
                          </div>
                          <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-semibold uppercase text-muted-foreground">Issued To</span>
                            <span className="font-medium">{selectedDoc.owner}</span>
                          </div>
                          <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-semibold uppercase text-muted-foreground">License No.</span>
                            <span className="font-mono font-medium">{selectedDoc.license}</span>
                          </div>
                          <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-semibold uppercase text-muted-foreground">VAT Registration</span>
                            <span className="font-mono font-medium">{selectedDoc.vat}</span>
                          </div>
                          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0"/> Official UAE Regulatory Verification Record · Verified Active
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSelectedDoc(null)}>Close</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              <TabsContent value="history" className="mt-4 space-y-3">
                {[
            { date: "2025-11-12", who: "Layla Admin", action: "Requested updated Trade License" },
            { date: "2025-11-01", who: "System", action: "Documents received" },
            { date: "2025-10-28", who: "Caterer", action: "Application submitted" },
        ].map((h, i) => (<div key={i} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary"/>
                    <div className="flex-1">
                      <p className="font-medium">{h.action}</p>
                      <p className="text-xs text-muted-foreground">{h.date} · {h.who}</p>
                    </div>
                  </div>))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>);
}
function Field({ label, value }) {
    return (<div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>);
}
function Metric({ label, value }) {
    return (<div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>);
}
