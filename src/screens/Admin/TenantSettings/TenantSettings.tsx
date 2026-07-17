import { useRef, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useBranding } from "../../../contexts/BrandingContext";
import { useToast } from "../../../components/ui/toast";
import { cn } from "../../../lib/utils";
import {
    Building2, ImageIcon, Palette, Save, UploadCloud, X, Globe,
} from "lucide-react";

const inputCls =
    "h-10 rounded-lg border-[#dcdcdc] bg-white shadow-none " +
    "focus-visible:ring-2 focus-visible:ring-[#ea690c]/20 focus-visible:border-[#ea690c]";
const labelCls = "text-[13px] font-medium text-neutral-700 mb-1.5 block";
const hintCls = "text-xs text-[#9a9a9a] mt-1.5";

interface SectionCardProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    children: React.ReactNode;
}

const SectionCard = ({ icon: Icon, title, description, children }: SectionCardProps) => (
    <div className="overflow-hidden rounded-2xl border border-[#e3e3e3] bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#ececec] px-5 py-4 sm:px-6">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50">
                <Icon className="h-[18px] w-[18px] text-[#ea690c]" />
            </div>
            <div className="min-w-0">
                <h2 className="text-sm font-semibold text-neutral-800">{title}</h2>
                <p className="mt-0.5 text-xs text-[#8a8a8a]">{description}</p>
            </div>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
    </div>
);

interface ColorFieldProps {
    label: string;
    hint: string;
    value: string;
    onChange: (value: string) => void;
}

const ColorField = ({ label, hint, value, onChange }: ColorFieldProps) => (
    <div>
        <Label className={labelCls}>{label}</Label>
        <div className="flex items-center gap-2.5">
            <label
                className="relative h-10 w-10 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-inset ring-black/10 transition-transform hover:scale-105"
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
            <Input value={value} onChange={e => onChange(e.target.value)} className={cn(inputCls, "font-mono text-sm uppercase")} />
        </div>
        <p className={hintCls}>{hint}</p>
    </div>
);

export const TenantSettings = (): JSX.Element => {
    const { branding, setTenantBranding } = useBranding();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const [form, setForm] = useState({
        companyName: branding.companyName,
        logoUrl: branding.logoUrl || "",
        faviconUrl: branding.faviconUrl || "",
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
    });

    const [logoPreview, setLogoPreview] = useState<string>(branding.logoUrl || "");

    const saved = {
        companyName: branding.companyName,
        logoUrl: branding.logoUrl || "",
        faviconUrl: branding.faviconUrl || "",
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
    };
    const isDirty = (Object.keys(form) as Array<keyof typeof form>).some(k => form[k] !== saved[k]);

    const setField = <K extends keyof typeof form>(key: K, value: string) =>
        setForm(f => ({ ...f, [key]: value }));

    const processLogoFile = (file: File) => {
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processLogoFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processLogoFile(file);
    };

    const handleRemoveLogo = () => {
        setLogoPreview("");
        setForm(f => ({ ...f, logoUrl: "" }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = () => {
        setTenantBranding({
            companyName: form.companyName,
            logoUrl: form.logoUrl || undefined,
            faviconUrl: form.faviconUrl || undefined,
            primaryColor: form.primaryColor,
            secondaryColor: form.secondaryColor,
        });
        showToast("Tenant settings saved successfully.", "success");
    };

    return (
        <div className="w-full">
            <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

                {/* ── Header ── */}
                <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Tenant Settings</h1>
                        <p className="mt-1 text-sm text-[#7d7d7d]">
                            Company-wide branding your branches inherit unless they override it.
                        </p>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={!isDirty}
                        className="relative shrink-0 gap-2 rounded-lg bg-[#ea690c] px-5 text-white shadow-sm hover:bg-[#ea690c]/90"
                    >
                        <Save className="h-4 w-4" /> Save Changes
                        {isDirty && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#1e40af]" />}
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                    {/* Left column */}
                    <div className="space-y-5 lg:col-span-3">
                        <SectionCard icon={Building2} title="Company Identity" description="Name and logo shown across the platform">
                            <div className="space-y-6">
                                <div>
                                    <Label className={labelCls}>Company Name</Label>
                                    <Input
                                        value={form.companyName}
                                        onChange={e => setField("companyName", e.target.value)}
                                        placeholder="e.g. M&M Logistics"
                                        className={cn(inputCls, "max-w-sm")}
                                    />
                                </div>

                                <div>
                                    <Label className={labelCls}>Company Logo</Label>
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e3e3e3] bg-[#fafafa]">
                                            {logoPreview
                                                ? <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain p-1.5" />
                                                : <ImageIcon className="h-7 w-7 text-[#cfcfcf]" />}
                                        </div>
                                        <div className="w-full max-w-sm">
                                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                                                onDragLeave={() => setDragActive(false)}
                                                onDrop={handleDrop}
                                                className={cn(
                                                    "flex h-20 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition-colors",
                                                    dragActive ? "border-[#ea690c] bg-orange-50/60" : "border-[#dcdcdc] hover:border-[#ea690c]/50 hover:bg-orange-50/30"
                                                )}
                                            >
                                                <UploadCloud className={cn("h-5 w-5", dragActive ? "text-[#ea690c]" : "text-[#b0b0b0]")} />
                                                <span className="text-xs font-medium text-neutral-600">Click to upload or drag &amp; drop</span>
                                            </button>
                                            <div className="mt-2 flex items-center gap-3">
                                                <Input
                                                    value={logoPreview.startsWith("data:") ? "" : form.logoUrl}
                                                    onChange={e => { setField("logoUrl", e.target.value); setLogoPreview(e.target.value); }}
                                                    placeholder="Or paste an image URL..."
                                                    className={cn(inputCls, "h-9 text-sm")}
                                                />
                                                {logoPreview && (
                                                    <button type="button" onClick={handleRemoveLogo} className="flex flex-shrink-0 items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700">
                                                        <X className="h-3.5 w-3.5" /> Remove
                                                    </button>
                                                )}
                                            </div>
                                            <p className={hintCls}>PNG, JPG or SVG · Max 2MB</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label className={labelCls}>
                                        <span className="inline-flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-[#a0a0a0]" /> Favicon URL</span>
                                    </Label>
                                    <Input
                                        value={form.faviconUrl}
                                        onChange={e => setField("faviconUrl", e.target.value)}
                                        placeholder="https://example.com/favicon.ico"
                                        className={cn(inputCls, "max-w-sm")}
                                    />
                                    <p className={hintCls}>Shown in the browser tab.</p>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard icon={Palette} title="Brand Colors" description="Applied across buttons, accents and highlights">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <ColorField label="Primary Color" hint="Buttons, accents and highlights." value={form.primaryColor} onChange={v => setField("primaryColor", v)} />
                                <ColorField label="Secondary Color" hint="Secondary UI elements." value={form.secondaryColor} onChange={v => setField("secondaryColor", v)} />
                            </div>
                        </SectionCard>
                    </div>

                    {/* Right column — live preview */}
                    <div className="lg:col-span-2">
                        <div className="lg:sticky lg:top-24">
                            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#a0a0a0]">Live Preview</p>
                            <div className="overflow-hidden rounded-2xl border border-[#e3e3e3] bg-white shadow-sm">
                                <div className="flex items-center gap-3 px-4 py-3.5" style={{ backgroundColor: form.primaryColor }}>
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/95">
                                        {logoPreview
                                            ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-0.5" />
                                            : <ImageIcon className="h-4 w-4 text-gray-400" />}
                                    </div>
                                    <span className="truncate text-sm font-semibold text-white">{form.companyName || "Company Name"}</span>
                                </div>
                                <div className="space-y-3 p-4">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <span className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: form.primaryColor }}>Primary</span>
                                        <span className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: form.secondaryColor }}>Secondary</span>
                                        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: `${form.secondaryColor}1a`, color: form.secondaryColor }}>Badge</span>
                                    </div>
                                    <div className="rounded-lg border border-neutral-100 p-3">
                                        <div className="mb-2 h-2 w-20 rounded bg-neutral-200" />
                                        <div className="h-2 w-32 rounded" style={{ backgroundColor: `${form.primaryColor}33` }} />
                                    </div>
                                </div>
                            </div>
                            <p className="mt-3 text-xs leading-relaxed text-[#9a9a9a]">
                                Branches inherit these settings unless a branch manager overrides them in Branch Settings.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
