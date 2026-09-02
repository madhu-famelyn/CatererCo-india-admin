import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

import { Save, Sparkles, CheckCircle2, IndianRupee } from "lucide-react";
import { toast } from "sonner";


export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

const DEFAULT_SETTINGS = {
  platformName: "CatererCo",
  supportEmail: "support@catererco.in",
  bookingCutoffHours: 24,
  maintenanceMode: false,
  commissionRate: 10,
  minPayout: 5000,
  payoutSchedule: "weekly",
  // India Tax Settings
  gstRate: 18,
  gstNumber: "27AABCU9603R1ZX",
  cgstRate: 9,
  sgstRate: 9,
  igstRate: 18,
  panNumber: "",
  includeGstInDisplay: true,
  stateCode: "MH",
  // Currency — fixed to INR for India
  currency: "INR",
  currencyPosition: "prefix",
  aedToInrRate: 22.77,
  numberFormat: "indian",
  // AI Settings
  aiModel: "google/gemini-2.5-flash",
  autoApproveThreshold: 95,
  autoReprocessLowConfidence: true,
  // Notifications
  emailNotifications: true,
  smsNotifications: true,
  pushNotifications: true,
  weeklyDigest: true,
  // Security
  require2FA: true,
  forcePasswordRotation: false,
  sessionTimeout: 60,
  allowedIpRanges: "",
};

const INDIAN_STATES = [
  { code: "AN", name: "Andaman & Nicobar Islands" },
  { code: "AP", name: "Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh" },
  { code: "AS", name: "Assam" },
  { code: "BR", name: "Bihar" },
  { code: "CH", name: "Chandigarh" },
  { code: "CG", name: "Chhattisgarh" },
  { code: "DN", name: "Dadra & Nagar Haveli" },
  { code: "DD", name: "Daman & Diu" },
  { code: "DL", name: "Delhi" },
  { code: "GA", name: "Goa" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JK", name: "Jammu & Kashmir" },
  { code: "JH", name: "Jharkhand" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "LA", name: "Ladakh" },
  { code: "LD", name: "Lakshadweep" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "MZ", name: "Mizoram" },
  { code: "NL", name: "Nagaland" },
  { code: "OD", name: "Odisha" },
  { code: "PY", name: "Puducherry" },
  { code: "PB", name: "Punjab" },
  { code: "RJ", name: "Rajasthan" },
  { code: "SK", name: "Sikkim" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TG", name: "Telangana" },
  { code: "TR", name: "Tripura" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "UK", name: "Uttarakhand" },
  { code: "WB", name: "West Bengal" },
];

function SettingsPage() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("admin_system_settings");
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // When GST rate changes, auto-split into CGST/SGST halves
  const handleGstRateChange = (val) => {
    const rate = Number(val);
    updateSetting("gstRate", rate);
    updateSetting("cgstRate", rate / 2);
    updateSetting("sgstRate", rate / 2);
    updateSetting("igstRate", rate);
  };

  const handleSave = (categoryName = "Settings") => {
    try {
      localStorage.setItem("admin_system_settings", JSON.stringify(settings));
      window.dispatchEvent(new StorageEvent("storage", {
        key: "admin_system_settings",
        newValue: JSON.stringify(settings),
      }));
      toast.success(`${categoryName} saved successfully!`);
    } catch (e) {
      toast.error("Failed to save settings.");
    }
  };

  return (
    <>
      <PageHeader title="System Settings" description="Configure platform-wide preferences, AI engine, GST & Indian tax standards." />
      <div className="p-6">
        <Tabs defaultValue="ai">
          <TabsList className="w-full justify-start flex-wrap gap-1 h-auto p-1.5 bg-muted/60">
            <TabsTrigger value="ai" className="gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> AI Configuration
            </TabsTrigger>
            <TabsTrigger value="platform">Platform</TabsTrigger>
            <TabsTrigger value="commission">Commission</TabsTrigger>
            <TabsTrigger value="tax" className="gap-1">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-400" /> GST &amp; Tax
            </TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* AI Settings Tab */}
          <TabsContent value="ai" className="mt-4">
            <SettingsCard title="AI Extraction & Recommendation Configuration" onSave={() => handleSave("AI Configuration")}>
              <Field label="Menu Extraction & Parsing Model">
                <Select value={settings.aiModel} onValueChange={(val) => updateSetting("aiModel", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Ultra Fast)</SelectItem>
                    <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro (High Accuracy)</SelectItem>
                    <SelectItem value="openai/gpt-5">GPT-5 (Experimental)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Auto-Approve Menu Threshold (%)">
                <Input
                  type="number"
                  min={50}
                  max={100}
                  value={settings.autoApproveThreshold}
                  onChange={(e) => updateSetting("autoApproveThreshold", Number(e.target.value))}
                />
              </Field>

              <Toggle
                label="Enable Auto-Reprocess on Low Confidence Scores"
                checked={settings.autoReprocessLowConfidence}
                onCheckedChange={(val) => updateSetting("autoReprocessLowConfidence", val)}
              />

              <div className="md:col-span-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-400 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300">Active Engine: </span>
                  Current AI model is active across Menu PDF Parser, Menu Builder recommendations, and Quotation auto-checkers.
                </div>
              </div>
            </SettingsCard>
          </TabsContent>

          {/* Platform Tab */}
          <TabsContent value="platform" className="mt-4">
            <SettingsCard title="Platform Configuration" onSave={() => handleSave("Platform Configuration")}>
              <Field label="Platform Name">
                <Input value={settings.platformName} onChange={(e) => updateSetting("platformName", e.target.value)} />
              </Field>
              <Field label="Support Email">
                <Input value={settings.supportEmail} onChange={(e) => updateSetting("supportEmail", e.target.value)} />
              </Field>
              <Field label="Booking Cutoff (hours)">
                <Input
                  type="number"
                  value={settings.bookingCutoffHours}
                  onChange={(e) => updateSetting("bookingCutoffHours", Number(e.target.value))}
                />
              </Field>
              <Toggle
                label="Maintenance Mode"
                checked={settings.maintenanceMode}
                onCheckedChange={(val) => updateSetting("maintenanceMode", val)}
              />
            </SettingsCard>
          </TabsContent>

          {/* Commission Tab */}
          <TabsContent value="commission" className="mt-4">
            <SettingsCard title="Commission Settings" onSave={() => handleSave("Commission Settings")}>
              <Field label="Standard Commission Rate">
                <div className="space-y-2">
                  <Slider
                    value={[settings.commissionRate]}
                    onValueChange={(val) => updateSetting("commissionRate", val[0])}
                    max={30}
                    step={0.5}
                  />
                  <p className="text-xs text-muted-foreground">Current Rate: {settings.commissionRate}%</p>
                </div>
              </Field>
              <Field label="Minimum Payout (₹)">
                <Input
                  type="number"
                  value={settings.minPayout}
                  onChange={(e) => updateSetting("minPayout", Number(e.target.value))}
                />
              </Field>
              <Field label="Payout Schedule">
                <Select value={settings.payoutSchedule} onValueChange={(val) => updateSetting("payoutSchedule", val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </SettingsCard>
          </TabsContent>

          {/* GST & Tax Tab (India Standard) */}
          <TabsContent value="tax" className="mt-4">
            <div className="space-y-4">
              {/* GST Info Banner */}
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-4 flex items-start gap-3">
                <IndianRupee className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-300">India GST Standards (Goods &amp; Services Tax)</p>
                  <p className="text-xs text-orange-400/80 mt-1">
                    Configure GST rates as per Indian tax law. CGST + SGST = Intra-state. IGST = Inter-state transactions.
                    Standard catering service rate is 5% or 18% depending on service type.
                  </p>
                </div>
              </div>

              <SettingsCard title="GST Configuration" onSave={() => handleSave("GST & Tax Settings")}>
                <Field label="GST Registration Number (GSTIN)">
                  <Input
                    placeholder="e.g. 27AABCU9603R1ZX"
                    value={settings.gstNumber}
                    onChange={(e) => updateSetting("gstNumber", e.target.value.toUpperCase())}
                    className="font-mono"
                    maxLength={15}
                  />
                  <p className="text-xs text-muted-foreground mt-1">15-character GSTIN format</p>
                </Field>

                <Field label="PAN Number">
                  <Input
                    placeholder="e.g. AABCU9603R"
                    value={settings.panNumber}
                    onChange={(e) => updateSetting("panNumber", e.target.value.toUpperCase())}
                    className="font-mono"
                    maxLength={10}
                  />
                </Field>

                <Field label="Business State">
                  <Select value={settings.stateCode} onValueChange={(val) => updateSetting("stateCode", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {INDIAN_STATES.map((s) => (
                        <SelectItem key={s.code} value={s.code}>
                          {s.code} — {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Standard GST Rate (%)">
                  <Select
                    value={String(settings.gstRate)}
                    onValueChange={(val) => handleGstRateChange(val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% — Exempt (e.g. basic food)</SelectItem>
                      <SelectItem value="5">5% — Restaurant / Catering services (non-AC)</SelectItem>
                      <SelectItem value="12">12% — Works contract services</SelectItem>
                      <SelectItem value="18">18% — Catering with AC / Alcohol service</SelectItem>
                      <SelectItem value="28">28% — Luxury / five-star catering</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                {/* GST Breakdown display */}
                <div className="md:col-span-2 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-white/10 bg-muted/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">CGST</p>
                    <p className="text-lg font-semibold text-foreground">{settings.cgstRate}%</p>
                    <p className="text-[10px] text-muted-foreground">Intra-state (Centre)</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-muted/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">SGST</p>
                    <p className="text-lg font-semibold text-foreground">{settings.sgstRate}%</p>
                    <p className="text-[10px] text-muted-foreground">Intra-state (State)</p>
                  </div>
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-3 text-center">
                    <p className="text-xs text-orange-400">IGST</p>
                    <p className="text-lg font-semibold text-orange-300">{settings.igstRate}%</p>
                    <p className="text-[10px] text-orange-400/70">Inter-state</p>
                  </div>
                </div>

                <Toggle
                  label="Include GST in displayed prices (inclusive pricing)"
                  checked={settings.includeGstInDisplay}
                  onCheckedChange={(val) => updateSetting("includeGstInDisplay", val)}
                />
              </SettingsCard>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-4">
            <SettingsCard title="Notification Settings" onSave={() => handleSave("Notification Settings")}>
              <Toggle
                label="Email notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(val) => updateSetting("emailNotifications", val)}
              />
              <Toggle
                label="SMS notifications"
                checked={settings.smsNotifications}
                onCheckedChange={(val) => updateSetting("smsNotifications", val)}
              />
              <Toggle
                label="Push notifications"
                checked={settings.pushNotifications}
                onCheckedChange={(val) => updateSetting("pushNotifications", val)}
              />
              <Toggle
                label="Weekly summary digest"
                checked={settings.weeklyDigest}
                onCheckedChange={(val) => updateSetting("weeklyDigest", val)}
              />
            </SettingsCard>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-4">
            <SettingsCard title="Security Settings" onSave={() => handleSave("Security Settings")}>
              <Toggle
                label="Require 2FA for admin accounts"
                checked={settings.require2FA}
                onCheckedChange={(val) => updateSetting("require2FA", val)}
              />
              <Toggle
                label="Force password rotation every 90 days"
                checked={settings.forcePasswordRotation}
                onCheckedChange={(val) => updateSetting("forcePasswordRotation", val)}
              />
              <Field label="Session timeout (minutes)">
                <Input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting("sessionTimeout", Number(e.target.value))}
                />
              </Field>
              <Field label="Allowed IP ranges">
                <Input
                  placeholder="e.g. 192.168.1.0/24"
                  value={settings.allowedIpRanges}
                  onChange={(e) => updateSetting("allowedIpRanges", e.target.value)}
                />
              </Field>
            </SettingsCard>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function SettingsCard({ title, children, onSave }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {children}
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={onSave} className="bg-primary text-primary-foreground">
            <Save className="mr-2 h-4 w-4" /> Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <Label className="text-sm cursor-pointer">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
