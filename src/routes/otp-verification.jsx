import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useState } from "react";
export const Route = createFileRoute("/otp-verification")({
    component: OtpPage,
});
function OtpPage() {
    const navigate = useNavigate();
    const [code, setCode] = useState("");
    return (<div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <p className="text-sm text-muted-foreground">Enter the 6-digit code we sent to your email.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/change-password" });
        }}>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (<InputOTPSlot key={i} index={i}/>))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button className="w-full" type="submit" disabled={code.length < 6}>
              Verify
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Didn't get it? <button type="button" className="text-primary hover:underline">Resend code</button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>);
}
