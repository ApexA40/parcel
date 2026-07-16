import { useRef, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useBranding } from "../../contexts/BrandingContext";
import { useToast } from "../../components/ui/toast";
import { cn } from "../../lib/utils";
import {
    Building2, Clock, ImageIcon, Mail, Paintbrush,
    Phone, Printer, RotateCcw, Save, UploadCloud, X,
} from "lucide-react";

const inputCls =
    "h-10 rounded-lg border-[#dcdcdc] bg-white shadow-none " +
    "focus-visible:ring-2 focus-visible:ring-[#ea690c]/20 focus-visible:border-[#ea690c]";

const labelCls = "text-[13px] font-medium text-neutral-700 mb-1.5 block";
const hintCls = "text-xs text-[#9a9a9a] mt-1.5";

type TabId = "identity" | "info" | "print";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "identity", label: "Visual Identity", icon: Paintbrush },
    { id: "info", label: "Branch Info", icon: Building2 },
    { id: "print", label: "Printing", icon: Printer },
];

interface IconInputProps extends React.ComponentProps<typeof Input> {
    icon: React.ComponentType<{ className?: string }>;
}

const IconInput = ({ icon: Icon, className, ...props }: IconInputProps) => (
    <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8a8a8]" />
        <Input {...props} className={cn(inputCls, "pl-9", className)} />
    </div>
);

export const BranchSettings = (): JSX.Element => {
    const { branding, setBranchBranding, resetBranchBranding } = useBranding();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<TabId>("identity");
    const [dragActive, setDragActive] = useState(false);

    const [form, setForm] = useState({
        branchName: branding.branchName || "",
        logoUrl: branding.logoUrl || "",
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
        setBranchBranding({
            branchName: form.branchName || undefined,
            logoUrl: form.logoUrl || undefined,
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
            branchName: "", logoUrl: "",
            branchAddress: "", branchPhone: "", branchEmail: "", operatingHours: "",
            companyTagline: "", printFooterNote: "",
        });
        setLogoPreview("");
        showToast("Branch settings reset to defaults.", "success");
    };

    return (
        <div className="w-full">
            <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:w-[80%] lg:max-w-none lg:px-0 lg:py-8">

                {/* ── Page header with actions ── */}
                <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Branch Settings</h1>
                        <p className="mt-1 text-sm text-[#7d7d7d]">
                            Customise how your branch appears in the app and on printed materials.
                        </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleReset}
                            className="gap-1.5 rounded-lg border-[#dcdcdc] text-neutral-600 hover:bg-gray-100"
                        >
                            <RotateCcw className="h-3.5 w-3.5" /> Reset
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!isDirty}
                            className="relative gap-2 rounded-lg bg-[#ea690c] px-5 text-white shadow-sm hover:bg-[#ea690c]/90"
                        >
                            <Save className="h-4 w-4" /> Save Settings
                            {isDirty && (
                                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#1e40af]" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="mb-6 flex w-full rounded-xl bg-[#ececec] p-1 sm:w-auto sm:self-start sm:inline-flex">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setActiveTab(id)}
                            className={cn(
                                "flex flex-1 items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all sm:flex-initial sm:px-4 sm:text-sm",
                                activeTab === id
                                    ? "bg-white text-neutral-900 shadow-sm"
                                    : "text-[#7d7d7d] hover:text-neutral-800"
                            )}
                        >
                            <Icon className={cn("hidden h-4 w-4 sm:block", activeTab === id ? "text-[#ea690c]" : "text-[#a8a8a8]")} />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                {/* ── Panel ── */}
                <div className="rounded-2xl border border-[#e3e3e3] bg-white p-5 shadow-sm sm:p-7">

                    {/* ═══ Visual Identity ═══ */}
                    {activeTab === "identity" && (
                        <div className="grid grid-cols-1 gap-7 lg:grid-cols-5 lg:gap-10">
                            <div className="space-y-7 lg:col-span-3">
                            <div>
                                <Label className={labelCls}>Branch Logo</Label>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
                                    <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#e3e3e3] bg-[#fafafa]">
                                        {logoPreview
                                            ? <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain p-2" />
                                            : <ImageIcon className="h-8 w-8 text-[#cfcfcf]" />}
                                    </div>
                                    <div className="flex-1">
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                                            onDragLeave={() => setDragActive(false)}
                                            onDrop={handleDrop}
                                            className={cn(
                                                "flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed transition-colors",
                                                dragActive
                                                    ? "border-[#ea690c] bg-orange-50/60"
                                                    : "border-[#dcdcdc] bg-white hover:border-[#ea690c]/50 hover:bg-orange-50/30"
                                            )}
                                        >
                                            <UploadCloud className={cn("h-6 w-6", dragActive ? "text-[#ea690c]" : "text-[#b0b0b0]")} />
                                            <span className="text-sm font-medium text-neutral-700">
                                                Click to upload <span className="font-normal text-[#9a9a9a]">or drag &amp; drop</span>
                                            </span>
                                            <span className="text-xs text-[#a8a8a8]">PNG, JPG or SVG · Max 2MB</span>
                                        </button>
                                        <div className="mt-2 flex items-center gap-3">
                                            <Input
                                                value={logoPreview.startsWith("data:") ? "" : form.logoUrl}
                                                onChange={e => { setField("logoUrl", e.target.value); setLogoPreview(e.target.value); }}
                                                placeholder="Or paste an image URL..."
                                                className={cn(inputCls, "h-9 text-sm")}
                                            />
                                            {logoPreview && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveLogo}
                                                    className="flex flex-shrink-0 items-center gap-1 text-xs font-medium text-red-500 transition-colors hover:text-red-700"
                                                >
                                                    <X className="h-3.5 w-3.5" /> Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label className={labelCls}>Branch Name</Label>
                                <Input
                                    value={form.branchName}
                                    onChange={e => setField("branchName", e.target.value)}
                                    placeholder="e.g. Kumasi Branch"
                                    className={cn(inputCls, "max-w-sm")}
                                />
                                <p className={hintCls}>Shown in the navbar and on printed labels.</p>
                            </div>

                            </div>

                            {/* Live brand preview */}
                            <div className="lg:col-span-2">
                                <div className="lg:sticky lg:top-24">
                                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#a0a0a0]">Live Preview</p>
                                <div className="overflow-hidden rounded-xl border border-[#e3e3e3]">
                                    <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: branding.primaryColor }}>
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/95">
                                            {logoPreview
                                                ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-0.5" />
                                                : <ImageIcon className="h-4 w-4 text-gray-400" />}
                                        </div>
                                        <span className="truncate text-sm font-semibold text-white">
                                            {form.branchName || "Branch Name"}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2.5 bg-[#fafafa] px-4 py-3.5">
                                        <span className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: branding.primaryColor }}>
                                            Primary Button
                                        </span>
                                        <span className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: branding.secondaryColor }}>
                                            Secondary Button
                                        </span>
                                        <span
                                            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                            style={{ backgroundColor: `${branding.secondaryColor}1a`, color: branding.secondaryColor }}
                                        >
                                            Status Badge
                                        </span>
                                    </div>
                                </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ Branch Info ═══ */}
                    {activeTab === "info" && (
                        <div className="space-y-6">
                            <div>
                                <Label className={labelCls}>Physical Address</Label>
                                <IconInput
                                    icon={Building2}
                                    value={form.branchAddress}
                                    onChange={e => setField("branchAddress", e.target.value)}
                                    placeholder="e.g. 12 Adum Street, Kumasi, Ghana"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <Label className={labelCls}>Phone Number</Label>
                                    <IconInput
                                        icon={Phone}
                                        type="tel"
                                        value={form.branchPhone}
                                        onChange={e => setField("branchPhone", e.target.value)}
                                        placeholder="+233 24 000 0000"
                                    />
                                </div>
                                <div>
                                    <Label className={labelCls}>Email Address</Label>
                                    <IconInput
                                        icon={Mail}
                                        type="email"
                                        value={form.branchEmail}
                                        onChange={e => setField("branchEmail", e.target.value)}
                                        placeholder="kumasi@mnm.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className={labelCls}>Operating Hours</Label>
                                <IconInput
                                    icon={Clock}
                                    value={form.operatingHours}
                                    onChange={e => setField("operatingHours", e.target.value)}
                                    placeholder="e.g. Mon – Fri: 8am – 6pm · Sat: 9am – 2pm"
                                />
                                <p className={hintCls}>Shown on printed labels and customer-facing pages.</p>
                            </div>
                        </div>
                    )}

                    {/* ═══ Printing ═══ */}
                    {activeTab === "print" && (
                        <div className="grid grid-cols-1 gap-7 lg:grid-cols-5 lg:gap-10">
                            <div className="space-y-6 lg:col-span-3">
                            <div>
                                <Label className={labelCls}>Company Tagline</Label>
                                <Input
                                    value={form.companyTagline}
                                    onChange={e => setField("companyTagline", e.target.value)}
                                    placeholder="e.g. Parcel Delivery System"
                                    className={inputCls}
                                />
                                <p className={hintCls}>Appears below the company name on printed labels and manifests.</p>
                            </div>
                            <div>
                                <Label className={labelCls}>Footer Note</Label>
                                <Input
                                    value={form.printFooterNote}
                                    onChange={e => setField("printFooterNote", e.target.value)}
                                    placeholder="e.g. For inquiries, contact M&M Parcel Services"
                                    className={inputCls}
                                />
                                <p className={hintCls}>Printed at the bottom of every label and manifest.</p>
                            </div>
                            </div>

                            <div className="lg:col-span-2">
                                <div className="lg:sticky lg:top-24">
                                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#a0a0a0]">Label Header Preview</p>
                                <div className="rounded-xl bg-[#fafafa] p-5 sm:p-6">
                                    <div className="mx-auto max-w-sm border-2 border-black bg-white p-3 shadow-sm">
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
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
