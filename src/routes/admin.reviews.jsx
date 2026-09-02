import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, ImageIcon, Flag, Check, X, MessageSquareOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reviews")({
    component: ReviewsPage,
});

function ReviewsPage() {
    const queryClient = useQueryClient();

    const { data: liveReviews = [], isLoading } = useQuery({
        queryKey: ["admin-reviews-list"],
        queryFn: async () => {
            try {
                const res = await fetch("http://localhost:8000/reviews");
                if (res.ok) return await res.json();
            } catch (e) {}
            return [];
        },
        refetchInterval: 5000,
    });

    const handleRemove = async (review) => {
        const rawId = review.rawId || String(review.id).replace("REV-", "");
        if (!confirm(`Are you sure you want to remove this review by ${review.author}?`)) return;
        try {
            await fetch(`http://localhost:8000/reviews/${rawId}`, { method: "DELETE" });
            queryClient.invalidateQueries({ queryKey: ["admin-reviews-list"] });
            toast.success("Review removed successfully");
        } catch (e) {
            toast.error("Failed to remove review");
        }
    };

    const handleApprove = async (review) => {
        const rawId = review.rawId || String(review.id).replace("REV-", "");
        try {
            await fetch(`http://localhost:8000/reviews/${rawId}/status?status=approved`, { method: "PATCH" });
            queryClient.invalidateQueries({ queryKey: ["admin-reviews-list"] });
            toast.success("Review approved");
        } catch (e) {
            toast.error("Failed to approve review");
        }
    };

    const filters = {
        all: liveReviews,
        caterer: liveReviews.filter((r) => r.targetType === "caterer"),
        customer: liveReviews.filter((r) => r.targetType === "customer"),
        reported: liveReviews.filter((r) => r.reported),
    };
    return (<>
      <PageHeader title="Review Moderation" description="Approve, remove or investigate reported reviews."/>
      <div className="p-6">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({filters.all.length})</TabsTrigger>
            <TabsTrigger value="caterer">Caterer Reviews ({filters.caterer.length})</TabsTrigger>
            <TabsTrigger value="customer">Customer Reviews ({filters.customer.length})</TabsTrigger>
            <TabsTrigger value="reported">Reported ({filters.reported.length})</TabsTrigger>
          </TabsList>
          {Object.keys(filters).map((k) => (<TabsContent key={k} value={k} className="mt-4">
              {filters[k].length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {filters[k].map((r) => (<Card key={r.id}>
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{r.author}</p>
                            <p className="text-xs text-muted-foreground">
                              on <span className="font-medium text-foreground">{r.target}</span> · {r.date}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}/>))}
                          </div>
                        </div>
                        <p className="text-sm">{r.content}</p>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={r.status}/>
                          {r.images > 0 && <Badge variant="outline"><ImageIcon className="mr-1 h-3 w-3"/> {r.images} photos</Badge>}
                          {r.reported && <Badge variant="destructive"><Flag className="mr-1 h-3 w-3"/> Reported</Badge>}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleRemove(r)}><X className="mr-1 h-4 w-4"/> Remove</Button>
                          <Button size="sm" onClick={() => handleApprove(r)} disabled={r.status === "approved"} className={r.status === "approved" ? "bg-emerald-600 text-white" : ""}>
                            <Check className="mr-1 h-4 w-4"/> {r.status === "approved" ? "Approved" : "Approve"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>))}
                </div>
              ) : (
                <Card className="p-12 text-center text-muted-foreground">
                  <MessageSquareOff className="mx-auto mb-3 h-10 w-10 opacity-40"/>
                  <p className="font-medium">No reviews found in this section.</p>
                  <p className="text-xs mt-1">Customer reviews submitted for caterers will appear here for moderation.</p>
                </Card>
              )}
            </TabsContent>))}
        </Tabs>
      </div>
    </>);
}
