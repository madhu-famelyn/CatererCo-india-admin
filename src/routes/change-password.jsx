import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
export const Route = createFileRoute("/change-password")({
    component: ChangePasswordPage,
});
function ChangePasswordPage() {
    const navigate = useNavigate();
    const [p1, setP1] = useState("");
    const [p2, setP2] = useState("");
    return (<div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <p className="text-sm text-muted-foreground">Choose a strong password you don't use elsewhere.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            if (p1 !== p2)
                return toast.error("Passwords do not match");
            toast.success("Password updated");
            navigate({ to: "/login" });
        }}>
            <div className="space-y-2">
              <Label htmlFor="p1">New password</Label>
              <Input id="p1" type="password" value={p1} onChange={(e) => setP1(e.target.value)} required/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p2">Confirm password</Label>
              <Input id="p2" type="password" value={p2} onChange={(e) => setP2(e.target.value)} required/>
            </div>
            <Button className="w-full" type="submit">Update password</Button>
          </form>
        </CardContent>
      </Card>
    </div>);
}
