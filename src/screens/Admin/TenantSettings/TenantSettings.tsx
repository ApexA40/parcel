import { useState } from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useBranding } from "../../../contexts/BrandingContext";
import { useToast } from "../../../components/ui/toast";
import { Building2, Save } from "lucide-react";

export const TenantSettings = (): JSX.Element => {
    const { branding, setTenantBranding } = useBranding();
    const { showToast } = useToast();

    const [form, setForm] = useState({
        companyName: branding.companyName,
        logoUrl: branding.logoUrl || "",
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        faviconUrl: branding.faviconUrl || "",
    });

    const handleSave = () => {
        setTenantBranding({
            companyName: form.companyName,
            logoUrl: form.logoUrl || undefined,
            primaryColor: form.primaryColor,
            secondaryColor: form.secondaryColor,
            faviconUrl: form.faviconUrl || undefined,
        });
        showToast("Tenant settings saved successfully.", "success");
    };

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <Card className="border border-[#d1d1d1] bg-white">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-[#ea690c]" />
                            <h2 className="text-lg font-bold text-neutral-800">Tenant Branding</h2>
                        </div>
                        <p className="text-sm text-[#5d5d5d]">
                            Set the default branding for your tenant. All branches will inherit these settings unless they override them.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-semibold text-neutral-800 mb-1.5 block">Company Name</Label>
                                <Input
                                    value={form.companyName}
                                    onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                                    placeholder="e.g. M&M Logistics"
                                    className="border-[#d1d1d1] focus:border-[#ea690c]"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-neutral-800 mb-1.5 block">Logo URL</Label>
                                <Input
                                    value={form.logoUrl}
                                    onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                                    placeholder="https://example.com/logo.png"
                                    className="border-[#d1d1d1] focus:border-[#ea690c]"
                                />
                                {form.logoUrl && (
                                    <img src={form.logoUrl} alt="Logo preview" className="mt-2 h-12 w-12 object-contain rounded-lg border border-[#d1d1d1]" />
                                )}
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-neutral-800 mb-1.5 block">Favicon URL</Label>
                                <Input
                                    value={form.faviconUrl}
                                    onChange={e => setForm(f => ({ ...f, faviconUrl: e.target.value }))}
                                    placeholder="https://example.com/favicon.ico"
                                    className="border-[#d1d1d1] focus:border-[#ea690c]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-semibold text-neutral-800 mb-1.5 block">Primary Color</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={form.primaryColor}
                                            onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                                            className="h-10 w-10 rounded-lg border border-[#d1d1d1] cursor-pointer p-0.5"
                                        />
                                        <Input
                                            value={form.primaryColor}
                                            onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                                            className="border-[#d1d1d1] font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm font-semibold text-neutral-800 mb-1.5 block">Secondary Color</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={form.secondaryColor}
                                            onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))}
                                            className="h-10 w-10 rounded-lg border border-[#d1d1d1] cursor-pointer p-0.5"
                                        />
                                        <Input
                                            value={form.secondaryColor}
                                            onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))}
                                            className="border-[#d1d1d1] font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button onClick={handleSave} className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2">
                                <Save className="w-4 h-4" /> Save Tenant Settings
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
