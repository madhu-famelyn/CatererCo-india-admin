import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, KeyRound, Eye, EyeOff, ShieldCheck, Mail, User, Phone, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/profile")({
  component: ProfilePage,
});

const DEFAULT_PROFILE = {
  fullName: "Sonu Sah",
  email: "admin@catererco.ae",
  phone: "+971 50 123 4567",
  role: "Super Admin",
  language: "English",
  timezone: "Asia/Dubai (GMT+4)",
  photoUrl: "",
};

function getInitials(name) {
  if (!name) return "AU";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ProfilePage() {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("admin_profile");
      if (saved) return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_PROFILE;
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateProfileField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = (e) => {
    e?.preventDefault();
    if (!profile.email.trim() || !profile.email.includes("@")) {
      toast.error("Please enter a valid login email address.");
      return;
    }
    if (!profile.fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    setIsSaving(true);
    try {
      localStorage.setItem("admin_profile", JSON.stringify(profile));
      window.dispatchEvent(new Event("admin_profile_updated"));
      toast.success("Profile & login email updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile.");
    } finally {
      setTimeout(() => setIsSaving(false), 300);
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    try {
      localStorage.setItem("admin_password", newPassword);
      toast.success("Password updated successfully! You can now use your new password.");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error("Failed to update password.");
    }
  };

  return (
    <>
      <PageHeader title="Admin Profile & Account Settings" description="Update your personal profile, login email, and security password." />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        {/* Left Column: Avatar & Quick Info */}
        <Card className="h-fit">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-primary/20 shadow-md">
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {getInitials(profile.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white shadow-md">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>

            <div>
              <p className="text-lg font-bold">{profile.fullName || "Admin User"}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                <Mail className="h-3 w-3 text-primary" /> {profile.email}
              </p>
              <span className="inline-block mt-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {profile.role}
              </span>
            </div>

            <div className="w-full pt-2 space-y-2 border-t border-border mt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 text-xs"
                onClick={() => setShowPasswordModal(true)}
              >
                <KeyRound className="h-4 w-4 text-amber-500" /> Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Edit Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Account Information & Login Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Admin Username / Name</Label>
                  <Input
                    value={profile.fullName}
                    onChange={(e) => updateProfileField("fullName", e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    Login Email Address <span className="text-xs font-normal text-amber-500">(Used to Sign In)</span>
                  </Label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateProfileField("email", e.target.value)}
                    placeholder="admin@catererco.ae"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => updateProfileField("phone", e.target.value)}
                    placeholder="+971 50 000 0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>System Role</Label>
                  <Input value={profile.role} disabled className="bg-muted/50 cursor-not-allowed font-medium text-muted-foreground" />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground font-semibold">
                  <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Profile Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Dialog Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition"
            >
              <X className="h-4 w-4" />
            </button>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Change Admin Password</h3>
                  <p className="text-xs text-muted-foreground">Update password for account {profile.email}</p>
                </div>
              </div>

              <div className="space-y-3">

                <div className="space-y-1.5">
                  <Label className="text-xs">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setShowPasswordModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="text-xs bg-primary text-primary-foreground">
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
