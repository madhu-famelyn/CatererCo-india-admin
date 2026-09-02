import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Save, Trash2, Globe, HelpCircle, Layers, FileText, Phone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cms")({
  component: CmsPage,
});

const BLANK_CMS = {
  hero: {
    headline: "",
    subheadline: "",
    description: "",
    primaryCta: "",
    secondaryCta: "",
  },
  banners: [],
  faqs: [],
  about: "",
  terms: "",
  privacy: "",
  contact: {
    email: "",
    phone: "",
    address: "",
  },
};

function CmsPage() {
  const [cms, setCms] = useState(() => {
    try {
      const saved = localStorage.getItem("admin_cms_content");
      if (saved) return { ...BLANK_CMS, ...JSON.parse(saved) };
    } catch (e) {}
    return BLANK_CMS;
  });

  const [isSaving, setIsSaving] = useState(false);

  const updateHero = (field, value) => {
    setCms((prev) => ({ ...prev, hero: { ...prev.hero, [field]: value } }));
  };

  const updateContact = (field, value) => {
    setCms((prev) => ({ ...prev, contact: { ...prev.contact, [field]: value } }));
  };

  const updateField = (field, value) => {
    setCms((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (sectionName = "Content") => {
    setIsSaving(true);
    try {
      localStorage.setItem("admin_cms_content", JSON.stringify(cms));
      toast.success(`${sectionName} saved successfully!`);
    } catch (e) {
      toast.error("Failed to save content.");
    } finally {
      setTimeout(() => setIsSaving(false), 300);
    }
  };

  // Banner Handlers
  const handleAddBanner = () => {
    const newB = {
      id: String(Date.now()),
      title: "",
      cta: "",
      active: true,
    };
    setCms((prev) => ({ ...prev, banners: [...prev.banners, newB] }));
    toast.success("New banner added. Fill in title & button text.");
  };

  const handleDeleteBanner = (id) => {
    setCms((prev) => ({ ...prev, banners: prev.banners.filter((b) => b.id !== id) }));
    toast.success("Banner removed.");
  };

  const handleToggleBanner = (id, active) => {
    setCms((prev) => ({
      ...prev,
      banners: prev.banners.map((b) => (b.id === id ? { ...b, active } : b)),
    }));
  };

  // FAQ Handlers
  const handleAddFaq = () => {
    const newF = {
      id: String(Date.now()),
      q: "",
      a: "",
    };
    setCms((prev) => ({ ...prev, faqs: [...prev.faqs, newF] }));
    toast.success("New FAQ item added. Type question & answer.");
  };

  const handleDeleteFaq = (id) => {
    setCms((prev) => ({ ...prev, faqs: prev.faqs.filter((f) => f.id !== id) }));
    toast.success("FAQ item deleted.");
  };

  const handleUpdateFaq = (id, field, value) => {
    setCms((prev) => ({
      ...prev,
      faqs: prev.faqs.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    }));
  };

  return (
    <>
      <PageHeader title="Content Management System (CMS)" description="Configure public website content, promotional banners, FAQs, and policies." />
      <div className="p-6">
        <Tabs defaultValue="landing">
          <TabsList className="w-full justify-start flex-wrap gap-1 h-auto p-1.5 bg-muted/60">
            <TabsTrigger value="landing" className="gap-1">
              <Globe className="h-3.5 w-3.5" /> Landing Page
            </TabsTrigger>
            <TabsTrigger value="banners" className="gap-1">
              <Layers className="h-3.5 w-3.5" /> Banners ({cms.banners.length})
            </TabsTrigger>
            <TabsTrigger value="faqs" className="gap-1">
              <HelpCircle className="h-3.5 w-3.5" /> FAQs ({cms.faqs.length})
            </TabsTrigger>
            <TabsTrigger value="about">About Us</TabsTrigger>
            <TabsTrigger value="terms">Terms</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="contact" className="gap-1">
              <Phone className="h-3.5 w-3.5" /> Contact Info
            </TabsTrigger>
          </TabsList>

          {/* Landing Page Hero Tab */}
          <TabsContent value="landing" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Homepage Hero & Main Banner Text</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input placeholder="Enter hero headline..." value={cms.hero.headline} onChange={(e) => updateHero("headline", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Subheadline</Label>
                  <Input placeholder="Enter subheadline..." value={cms.hero.subheadline} onChange={(e) => updateHero("subheadline", e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description Text</Label>
                  <Textarea rows={4} placeholder="Enter homepage description..." value={cms.hero.description} onChange={(e) => updateHero("description", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Primary CTA Button Label</Label>
                  <Input placeholder="e.g. Get a Quotation" value={cms.hero.primaryCta} onChange={(e) => updateHero("primaryCta", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Secondary CTA Button Label</Label>
                  <Input placeholder="e.g. Browse Caterers" value={cms.hero.secondaryCta} onChange={(e) => updateHero("secondaryCta", e.target.value)} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button disabled={isSaving} onClick={() => handleSave("Homepage Hero Content")}>
                    <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Landing Page"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Banners Tab */}
          <TabsContent value="banners" className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Manage promotional banners displayed at the top of customer pages.</p>
              <Button onClick={handleAddBanner} size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> Add Banner
              </Button>
            </div>

            {cms.banners.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground border-dashed">
                No promotional banners added yet. Click <span className="font-semibold text-foreground">+ Add Banner</span> above to create one.
              </Card>
            ) : (
              cms.banners.map((b) => (
                <Card key={b.id}>
                  <CardContent className="flex items-center justify-between p-4 gap-4">
                    <div className="flex-1 grid gap-2 md:grid-cols-2">
                      <Input
                        value={b.title}
                        onChange={(e) =>
                          setCms((prev) => ({
                            ...prev,
                            banners: prev.banners.map((x) => (x.id === b.id ? { ...x, title: e.target.value } : x)),
                          }))
                        }
                        placeholder="Enter Banner Title (e.g. Special Discount Offer)"
                      />
                      <Input
                        value={b.cta}
                        onChange={(e) =>
                          setCms((prev) => ({
                            ...prev,
                            banners: prev.banners.map((x) => (x.id === b.id ? { ...x, cta: e.target.value } : x)),
                          }))
                        }
                        placeholder="CTA Button Text (e.g. Book Now)"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <Switch checked={b.active} onCheckedChange={(val) => handleToggleBanner(b.id, val)} />
                        {b.active ? "Active" : "Hidden"}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteBanner(b.id)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {cms.banners.length > 0 && (
              <div className="flex justify-end">
                <Button disabled={isSaving} onClick={() => handleSave("Promotional Banners")}>
                  <Save className="mr-2 h-4 w-4" /> Save Banners
                </Button>
              </div>
            )}
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Add or edit Frequently Asked Questions visible on the Customer Portal.</p>
              <Button onClick={handleAddFaq} size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> Add FAQ Item
              </Button>
            </div>

            {cms.faqs.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground border-dashed">
                No FAQ items added yet. Click <span className="font-semibold text-foreground">+ Add FAQ Item</span> above to create one.
              </Card>
            ) : (
              cms.faqs.map((f) => (
                <Card key={f.id}>
                  <CardContent className="space-y-2.5 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        value={f.q}
                        onChange={(e) => handleUpdateFaq(f.id, "q", e.target.value)}
                        className="font-medium text-sm"
                        placeholder="Enter Question (e.g. How do I request a quote?)"
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteFaq(f.id)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      value={f.a}
                      onChange={(e) => handleUpdateFaq(f.id, "a", e.target.value)}
                      placeholder="Enter Answer details..."
                    />
                  </CardContent>
                </Card>
              ))
            )}

            {cms.faqs.length > 0 && (
              <div className="flex justify-end">
                <Button disabled={isSaving} onClick={() => handleSave("FAQs")}>
                  <Save className="mr-2 h-4 w-4" /> Save FAQs
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Policy Pages Tabs (About, Terms, Privacy) */}
          {["about", "terms", "privacy"].map((key) => (
            <TabsContent key={key} value={key} className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{key} Page Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    rows={12}
                    value={cms[key]}
                    onChange={(e) => updateField(key, e.target.value)}
                    placeholder={`Enter content & guidelines for ${key} page...`}
                  />
                  <div className="flex justify-end">
                    <Button disabled={isSaving} onClick={() => handleSave(`${key.toUpperCase()} Page`)}>
                      <Save className="mr-2 h-4 w-4" /> Save {key.toUpperCase()} Page
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}

          {/* Contact Tab */}
          <TabsContent value="contact" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Official Email</Label>
                  <Input placeholder="e.g. contact@catererco.com" value={cms.contact.email} onChange={(e) => updateContact("email", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Support Number</Label>
                  <Input placeholder="e.g. +971 4 000 0000" value={cms.contact.phone} onChange={(e) => updateContact("phone", e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Headquarters Address</Label>
                  <Textarea rows={3} placeholder="Enter physical office address..." value={cms.contact.address} onChange={(e) => updateContact("address", e.target.value)} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button disabled={isSaving} onClick={() => handleSave("Contact Information")}>
                    <Save className="mr-2 h-4 w-4" /> Save Contact Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
