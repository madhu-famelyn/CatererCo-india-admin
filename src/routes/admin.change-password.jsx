import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
export const Route = createFileRoute("/admin/change-password")({
    component: ChangePwd,
});
function ChangePwd() {
    const navigate = useNavigate();
    const [p1, setP1] = useState("");
    const [p2, setP2] = useState("");
    return (<div className="flex items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            if (p1 !== p2)
                return toast.error("Passwords do not match");
            toast.success("Password updated");
            navigate({ to: "/admin/profile" });
        }}>
            <div className="space-y-2"><Label>Current password</Label><Input type="password" required/></div>
            <div className="space-y-2"><Label>New password</Label><Input type="password" value={p1} onChange={(e) => setP1(e.target.value)} required/></div>
            <div className="space-y-2"><Label>Confirm new password</Label><Input type="password" value={p2} onChange={(e) => setP2(e.target.value)} required/></div>
            <Button className="w-full" type="submit">Update password</Button>
          </form>
        </CardContent>
      </Card>
    </div>);
}
