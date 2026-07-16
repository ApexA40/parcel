import { useRef, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useBranding } from "../../contexts/BrandingContext";
import { useToast } from "../../components/ui/toast";
import {
    Building2, Clock, ImageIcon, Mail, Paintbrush,
    Phone, Printer, RotateCcw, Save, Upload, X,
} from "lucide-react";

const DEFAULT_PRIMARY = "#ea690c";
const DEFAULT_SECONDARY = "#1e40af";

interface SectionCardProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    children: React.ReactNode;
}

const SectionCard = ({ icon: Icon, title, description, children }: SectionCardProps) => (
    <Card className="border border-[#d1d1d1] bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 sm:px-6 border-b border-[#ececec]">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50">
                <Icon className="h-[18px] w-[18px] text-[#ea690c]" />
            </div>
            <div className="min-w-0">
                <h2 className="text-sm font-semibold text-neutral-800">{title}</h2>
                <p className="text-xs text-[#8a8a8a] mt-0.5">{description}</p>
            </div>
        </div>
        <CardContent className="p-5 sm:p-6">{children}</CardContent>
    </Card>
);

interface ColorFieldProps {
    label: string;
    hint: string;
    value: string;
    onChange: (value: string) => void;
}

const ColorField = ({ label, hint, value, onChange }: ColorFieldProps) => (
    <div>
        <Label className="text-sm font-medium text-neutral-800 mb-1.5 block">{label}</Label>
        <div className="flex items-center gap-2">
            <label
                className="relative h-9 w-9 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border border-[#d1d1d1] shadow-sm"
                style={{ backgroundColor: value }}
            >
                <input
                    type="color"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label={label}
                />
            </label>
            <Input
                value={value}
                onChange={e => onChange(e.target.value)}
                className="border-[#d1d1d1] font-mono text-sm uppercase"
            />
        </div>
        <p className="text-xs text-[#9a9a9a] mt-1.5">{hint}</p>
    </div>
);

export const BranchSettings = (): JSX.Element => {
    const { branding, setBranchBranding, resetBranchBranding } = useBranding();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        branchName: branding.branchName || "",
        logoUrl: branding.logoUrl || "",
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        branchAddress: branding.branchAddress || "",
        branchPhone: branding.branchPhone || "",
        branchEmail: branding.branchEmail || "",
        operatingHours: branding.operatingHours || "",
        companyTagline: branding.companyTagline || "",
        printFooterNote: branding.printFooterNote || "",
    });

    const [logoPreview, setLogoPreview] = useState<string>(branding.logoUrl || "");

    const savedValues = {
        branchName: branding.branchName || "",
        logoUrl: branding.logoUrl || "",
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        branchAddress: branding.branchAddress || "",
        branchPhone: branding.branchPhone || "",
        branchEmail: branding.branchEmail || "",
        operatingHours: branding.operatingHours || "",
        companyTagline: branding.companyTagline || "",
        printFooterNote: branding.printFooterNote || "",
    };
    const isDirty = (Object.keys(form) as Array<keyof typeof form>).some(
        key => form[key] !== savedValues[key]
    );

    const setField = <K extends keyof typeof form>(key: K, value: string) =>
        setForm(f => ({ ...f, [key]: value }));

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { showToast("Please select a valid image file.", "error"); return; }
        if (file.size > 2 * 1024 * 1024) { showToast("Image must be under 2MB.", "error"); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = ev.target?.result as string;
            setLogoPreview(base64);
            setForm(f => ({ ...f, logoUrl: base64 }));
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setLogoPreview("");
        setForm(f => ({ ...f, logoUrl: "" }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = () => {
        setBranchBranding({
            branchName: form.branchName || undefined,
            logoUrl: form.logoUrl || undefined,
            primaryColor: form.primaryColor,
            secondaryColor: form.secondaryColor,
            branchAddress: form.branchAddress || undefined,
            branchPhone: form.branchPhone || undefined,
            branchEmail: form.branchEmail || undefined,
            operatingHours: form.operatingHours || undefined,
            companyTagline: form.companyTagline || undefined,
            printFooterNote: form.printFooterNote || undefined,
        });
        showToast("Branch settings saved successfully.", "success");
    };

    const handleReset = () => {
        resetBranchBranding();
        setForm({
            branchName: "", logoUrl: "", primaryColor: DEFAULT_PRIMARY, secondaryColor: DEFAULT_SECONDARY,
            branchAddress: "", branchPhone: "", branchEmail: "", operatingHours: "",
            companyTagline: "", printFooterNote: "",
        });
        setLogoPreview("");
        showToast("Branch settings reset to defaults.", "success");
    };

    return (
        <div className="w-full min-h-full flex flex-col">
            <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

                {/* ── Page header ── */}
                <div className="mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">Branch Settings</h1>
                    <p className="text-sm text-[#7a7a7a] mt-1">
                        Manage your branch's identity, contact details, and print settings.
                    </p>
                </div>

                <div className="flex flex-col gap-5">

                    {/* ── Visual identity ── */}
                    <SectionCard
                        icon={Paintbrush}
                        title="Visual Identity"
                        description="Logo, branch name and brand colours shown across the app"
                    >
                        <div className="space-y-6">
                            <div>
                                <Label className="text-sm font-medium text-neutral-800 mb-1.5 block">Branch Name</Label>
                                <Input
                                    value={form.branchName}
                                    onChange={e => setField("branchName", e.target.value)}
                                    placeholder="e.g. Kumasi Branch"
                                    className="border-[#d1d1d1] max-w-sm"
                                />
                                <p className="text-xs text-[#9a9a9a] mt-1.5">Shown in the navbar and on printed labels.</p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium text-neutral-800 mb-1.5 block">Branch Logo</Label>
                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#d1d1d1] bg-gray-50">
                                        {logoPreview
                                            ? <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain p-1.5" />
                                            : <ImageIcon className="h-8 w-8 text-[#c4c4c4]" />}
                                    </div>
                                    <div className="w-full max-w-sm space-y-2">
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                        <div className="flex items-center gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-[#d1d1d1] text-neutral-700 hover:bg-gray-50 gap-1.5"
                                            >
                                                <Upload className="h-3.5 w-3.5" /> Upload Image
                                            </Button>
                                            {logoPreview && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveLogo}
                                                    className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                                                >
                                                    <X className="h-3.5 w-3.5" /> Remove
                                                </button>
                                            )}
                                        </div>
                                        <Input
                                            value={logoPreview.startsWith("data:") ? "" : form.logoUrl}
                                            onChange={e => { setField("logoUrl", e.target.value); setLogoPreview(e.target.value); }}
                                            placeholder="Or paste an image URL..."
                                            className="border-[#d1d1d1] text-sm"
                                        />
                                        <p className="text-xs text-[#9a9a9a]">PNG, JPG or SVG · Max 2MB</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ColorField
                                    label="Primary Color"
                                    hint="Buttons, accents and highlights."
                                    value={form.primaryColor}
                                    onChange={v => setField("primaryColor", v)}
                                />
                                <ColorField
                                    label="Secondary Color"
                                    hint="Secondary UI elements."
                                    value={form.secondaryColor}
                                    onChange={v => setField("secondaryColor", v)}
                                />
                            </div>

                            <div className="rounded-lg border border-[#ececec] bg-gray-50/60 p-4">
                                <p className="text-xs font-medium text-[#8a8a8a] uppercase tracking-wide mb-3">Preview</p>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm" style={{ backgroundColor: form.primaryColor }}>
                                        Primary Button
                                    </span>
                                    <span className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm" style={{ backgroundColor: form.secondaryColor }}>
                                        Secondary Button
                                    </span>
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* ── Branch information ── */}
                    <SectionCard
                        icon={Building2}
                        title="Branch Information"
                        description="Contact details and operating hours"
                    >
                        <div className="space-y-5">
                            <div>
                                <Label className="text-sm font-medium text-neutral-800 mb-1.5 flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-[#9a9a9a]" /> Physical Address
                                </Label>
                                <Input
                                    value={form.branchAddress}
                                    onChange={e => setField("branchAddress", e.target.value)}
                                    placeholder="e.g. 12 Adum Street, Kumasi, Ghana"
                                    className="border-[#d1d1d1]"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <Label className="text-sm font-medium text-neutral-800 mb-1.5 flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5 text-[#9a9a9a]" /> Phone Number
                                    </Label>
                                    <Input
                                        type="tel"
                                        value={form.branchPhone}
                                        onChange={e => setField("branchPhone", e.target.value)}
                                        placeholder="e.g. +233 24 000 0000"
                                        className="border-[#d1d1d1]"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-neutral-800 mb-1.5 flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5 text-[#9a9a9a]" /> Email Address
                                    </Label>
                                    <Input
                                        type="email"
                                        value={form.branchEmail}
                                        onChange={e => setField("branchEmail", e.target.value)}
                                        placeholder="e.g. kumasi@mnm.com"
                                        className="border-[#d1d1d1]"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-neutral-800 mb-1.5 flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-[#9a9a9a]" /> Operating Hours
                                </Label>
                                <Input
                                    value={form.operatingHours}
                                    onChange={e => setField("operatingHours", e.target.value)}
                                    placeholder="e.g. Mon – Fri: 8am – 6pm · Sat: 9am – 2pm"
                                    className="border-[#d1d1d1]"
                                />
                                <p className="text-xs text-[#9a9a9a] mt-1.5">Shown on printed labels and customer-facing pages.</p>
                            </div>
                        </div>
                    </SectionCard>

                    {/* ── Print settings ── */}
                    <SectionCard
                        icon={Printer}
                        title="Print Settings"
                        description="Text shown on labels and manifests"
                    >
                        <div className="space-y-5">
                            <div>
                                <Label className="text-sm font-medium text-neutral-800 mb-1.5 block">Company Tagline</Label>
                                <Input
                                    value={form.companyTagline}
                                    onChange={e => setField("companyTagline", e.target.value)}
                                    placeholder="e.g. Parcel Delivery System"
                                    className="border-[#d1d1d1]"
                                />
                                <p className="text-xs text-[#9a9a9a] mt-1.5">Appears below the company name on printed labels and manifests.</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-neutral-800 mb-1.5 block">Footer Note</Label>
                                <Input
                                    value={form.printFooterNote}
                                    onChange={e => setField("printFooterNote", e.target.value)}
                                    placeholder="e.g. For inquiries, contact M&M Parcel Services"
                                    className="border-[#d1d1d1]"
                                />
                                <p className="text-xs text-[#9a9a9a] mt-1.5">Printed at the bottom of every label and manifest.</p>
                            </div>

                            <div className="rounded-lg border border-[#ececec] bg-gray-50/60 p-4">
                                <p className="text-xs font-medium text-[#8a8a8a] uppercase tracking-wide mb-3">Label Header Preview</p>
                                <div className="max-w-sm border-2 border-black bg-white p-3">
                                    <div className="flex items-center justify-center gap-3 border-b-2 border-black pb-2">
                                        {logoPreview
                                            ? <img src={logoPreview} alt="Logo" className="h-10 w-10 object-contain" />
                                            : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200">
                                                    <ImageIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                            )}
                                        <div>
                                            <p className="text-base font-bold leading-tight text-black">{form.branchName || "Branch Name"}</p>
                                            <p className="text-xs text-black">{form.companyTagline || "Parcel Delivery System"}</p>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-center text-[10px] text-black">{form.printFooterNote || "For inquiries, contact M&M Parcel Services"}</p>
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                </div>
            </div>

            {/* ── Sticky action bar ── */}
            <div className="sticky bottom-0 z-10 border-t border-[#e5e5e5] bg-white/95 backdrop-blur-sm">
                <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center gap-1.5 text-sm font-medium text-[#8a8a8a] hover:text-neutral-700 transition-colors"
                    >
                        <RotateCcw className="h-3.5 w-3.5" /> Reset to Defaults
                    </button>
                    <div className="flex items-center gap-3">
                        {isDirty && (
                            <span className="hidden sm:flex items-center gap-1.5 text-xs text-[#9a9a9a]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#ea690c]" /> Unsaved changes
                            </span>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={!isDirty}
                            className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 gap-2"
                        >
                            <Save className="h-4 w-4" /> Save Settings
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
