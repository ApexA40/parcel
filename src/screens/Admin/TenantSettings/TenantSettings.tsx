import { useRef, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useBranding } from "../../../contexts/BrandingContext";
import { useToast } from "../../../components/ui/toast";
import { cn } from "../../../lib/utils";
import {
    Building2, ImageIcon, Palette, Save, UploadCloud, RotateCcw,
    Globe, AlertCircle,
} from "lucide-react";

const inputCls =
    "h-10 rounded-lg border-[#dcdcdc] bg-white shadow-none " +
    "focus-visible:ring-2 focus-visible:ring-[#ea690c]/20 focus-visible:border-[#ea690c]";
const labelCls = "text-[13px] font-medium text-neutral-700 mb-1.5 block";
const hintCls = "text-xs text-[#9a9a9a] mt-1.5";

type TabId = "identity" | "branding";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "identity", label: "Company Identity", icon: Building2 },
    { id: "branding", label: "Brand Colors", icon: Palette },
];

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
    const [activeTab, setActiveTab] = useState<TabId>("identity");

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

    const handleReset = () => {
        setForm({
            companyName: branding.companyName,
            logoUrl: branding.logoUrl || "",
            faviconUrl: branding.faviconUrl || "",
            primaryColor: branding.primaryColor,
            secondaryColor: branding.secondaryColor,
        });
        setLogoPreview(branding.logoUrl || "");
        showToast("Changes discarded.", "success");
    };

    return (
        <div className="w-full">
            <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:w-[80%] lg:max-w-none lg:px-0 lg:py-8">

                {/* Actions + unsaved indicator */}
                <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        {isDirty && (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                                <AlertCircle className="h-3 w-3" />
                                Unsaved changes
                            </div>
                        )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleReset}
                            disabled={!isDirty}
                            className="gap-1.5 rounded-lg border-[#dcdcdc] text-neutral-600 hover:bg-gray-100 disabled:opacity-40"
                        >
                            <RotateCcw className="h-3.5 w-3.5" /> Discard
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!isDirty}
                            className="gap-2 rounded-lg bg-[#ea690c] px-5 text-white shadow-sm hover:bg-[#ea690c]/90 disabled:opacity-40"
                        >
                            <Save className="h-4 w-4" /> Save Settings
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex w-full border-b border-[#e3e3e3]">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setActiveTab(id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px",
                                activeTab === id
                                    ? "border-[#ea690c] text-[#ea690c]"
                                    : "border-transparent text-[#7d7d7d] hover:text-neutral-800 hover:border-[#dcdcdc]"
                            )}
                        >
                            <Icon className={cn("h-4 w-4", activeTab === id ? "text-[#ea690c]" : "text-[#a8a8a8]")} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Panel */}
                <div className="rounded-2xl border border-[#e3e3e3] bg-white p-5 shadow-sm sm:p-7">

                    {/* ═══ Company Identity ═══ */}
                    {activeTab === "identity" && (
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-10">
                            <div className="space-y-8 lg:col-span-3">

                                {/* Company Name */}
                                <div>
                                    <Label className={labelCls}>Company Name</Label>
                                    <Input
                                        value={form.companyName}
                                        onChange={e => setField("companyName", e.target.value)}
                                        placeholder="e.g. M&M Logistics"
                                        className={cn(inputCls, "max-w-sm")}
                                    />
                                    <p className={hintCls}>Shown in the sidebar and on printed materials.</p>
                                </div>

                                {/* Logo */}
                                <div>
                                    <Label className={labelCls}>Company Logo</Label>
                                    <p className={hintCls + " mb-3"}>Used across the platform and on printed labels.</p>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

                                    {logoPreview ? (
                                        <div className="flex items-center gap-4 rounded-2xl border border-[#e3e3e3] bg-[#fafafa] p-4">
                                            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e3e3e3] bg-white shadow-sm">
                                                <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain p-1.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-neutral-800 truncate">
                                                    {logoPreview.startsWith("data:") ? "Uploaded image" : logoPreview}
                                                </p>
                                                <p className="text-xs text-[#9a9a9a] mt-0.5">Logo is set and ready to use</p>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-medium text-[#ea690c] hover:underline">
                                                        Replace
                                                    </button>
                                                    <span className="text-[#dcdcdc]">·</span>
                                                    <button type="button" onClick={handleRemoveLogo} className="text-xs font-medium text-red-500 hover:underline">
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                                            onDragLeave={() => setDragActive(false)}
                                            onDrop={handleDrop}
                                            className={cn(
                                                "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-10 transition-colors",
                                                dragActive
                                                    ? "border-[#ea690c] bg-orange-50/40"
                                                    : "border-[#dcdcdc] bg-[#fafafa] hover:border-[#ea690c]/50 hover:bg-orange-50/20"
                                            )}
                                        >
                                            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl border", dragActive ? "border-[#ea690c]/30 bg-orange-50" : "border-[#e3e3e3] bg-white")}>
                                                <UploadCloud className={cn("h-5 w-5", dragActive ? "text-[#ea690c]" : "text-[#b0b0b0]")} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-neutral-700">
                                                    Click to upload <span className="font-normal text-[#9a9a9a]">or drag &amp; drop</span>
                                                </p>
                                                <p className="text-xs text-[#a8a8a8] mt-0.5">PNG, JPG or SVG · Max 2MB</p>
                                            </div>
                                        </button>
                                    )}

                                    <div className="mt-3">
                                        <Input
                                            value={logoPreview.startsWith("data:") ? "" : form.logoUrl}
                                            onChange={e => { setField("logoUrl", e.target.value); setLogoPreview(e.target.value); }}
                                            placeholder="Or paste an image URL…"
                                            className={cn(inputCls, "h-9 text-sm")}
                                        />
                                    </div>
                                </div>

                                {/* Favicon */}
                                <div>
                                    <Label className={labelCls}>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Globe className="h-3.5 w-3.5 text-[#a0a0a0]" /> Favicon URL
                                        </span>
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

                            {/* Right: live preview */}
                            <div className="lg:col-span-2">
                                <div className="lg:sticky lg:top-24">
                                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#a0a0a0]">Sidebar Preview</p>
                                    <div className="overflow-hidden rounded-xl border border-[#e3e3e3] shadow-sm">
                                        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10" style={{ backgroundColor: form.primaryColor }}>
                                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/95 shadow">
                                                {logoPreview
                                                    ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-0.5" />
                                                    : <ImageIcon className="h-4 w-4 text-gray-400" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-white leading-tight">
                                                    {form.companyName || "Company Name"}
                                                </p>
                                                <p className="text-[10px] text-white/60 uppercase tracking-wider">Parcel Delivery</p>
                                            </div>
                                        </div>
                                        <div className="bg-white px-3 py-3 space-y-1">
                                            {["Parcel Search", "Parcel Intake", "Active Deliveries"].map((item, i) => (
                                                <div
                                                    key={item}
                                                    className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2", i !== 0 && "bg-transparent")}
                                                    style={i === 0 ? { backgroundColor: form.primaryColor } : {}}
                                                >
                                                    <div className={cn("h-2 w-2 rounded-full flex-shrink-0", i === 0 ? "bg-white/60" : "bg-[#dcdcdc]")} />
                                                    <span className={cn("text-xs font-medium", i === 0 ? "text-white" : "text-[#7d7d7d]")}>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t border-[#f0f0f0] bg-white px-3 py-2.5">
                                            <div className="flex items-center gap-2 rounded-lg bg-[#fafafa] px-3 py-2">
                                                <div className="h-2 w-2 rounded-full bg-red-300" />
                                                <span className="text-xs font-medium text-[#9a9a9a]">Logout</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs leading-relaxed text-[#9a9a9a]">
                                        Branches inherit these settings unless a branch manager overrides them.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ Brand Colors ═══ */}
                    {activeTab === "branding" && (
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-10">
                            <div className="space-y-6 lg:col-span-3">
                                <ColorField
                                    label="Primary Color"
                                    hint="Used for buttons, active nav items, and key accents."
                                    value={form.primaryColor}
                                    onChange={v => setField("primaryColor", v)}
                                />
                                <ColorField
                                    label="Secondary Color"
                                    hint="Used for secondary UI elements and badges."
                                    value={form.secondaryColor}
                                    onChange={v => setField("secondaryColor", v)}
                                />
                            </div>

                            {/* Right: color preview */}
                            <div className="lg:col-span-2">
                                <div className="lg:sticky lg:top-24">
                                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#a0a0a0]">Color Preview</p>
                                    <div className="overflow-hidden rounded-xl border border-[#e3e3e3] bg-white shadow-sm">
                                        <div className="px-4 py-3.5" style={{ backgroundColor: form.primaryColor }}>
                                            <p className="text-sm font-semibold text-white">{form.companyName || "Company Name"}</p>
                                            <p className="text-[10px] text-white/60 mt-0.5">Primary color applied</p>
                                        </div>
                                        <div className="space-y-3 p-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: form.primaryColor }}>
                                                    Primary Button
                                                </span>
                                                <span className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: form.secondaryColor }}>
                                                    Secondary Button
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: `${form.primaryColor}1a`, color: form.primaryColor }}>
                                                    Primary Badge
                                                </span>
                                                <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: `${form.secondaryColor}1a`, color: form.secondaryColor }}>
                                                    Secondary Badge
                                                </span>
                                            </div>
                                            <div className="rounded-lg border border-neutral-100 p-3">
                                                <div className="mb-2 h-2 w-20 rounded" style={{ backgroundColor: `${form.primaryColor}33` }} />
                                                <div className="h-2 w-32 rounded bg-neutral-100" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
