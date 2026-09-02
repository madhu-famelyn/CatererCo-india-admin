import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
export const Route = createFileRoute("/forgot-password")({
    component: ForgotPassword,
});
function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    return (<div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <p className="text-sm text-muted-foreground">We'll email you a verification code.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/otp-verification" });
        }}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
            </div>
            <Button className="w-full" type="submit">Send code</Button>
            <p className="text-center text-xs text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">Back to login</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>);
}
