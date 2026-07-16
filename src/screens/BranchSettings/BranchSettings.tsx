// import { useState, useRef } from "react";
// import { Card, CardContent } from "../../components/ui/card";
// import { Button } from "../../components/ui/button";
// import { Input } from "../../components/ui/input";
// import { Label } from "../../components/ui/label";
// import { useBranding } from "../../contexts/BrandingContext";
// import { useToast } from "../../components/ui/toast";
// import {
//     Paintbrush, RotateCcw, Save, Upload, X, Building2,
//     Phone, Mail, Clock, Printer, ImageIcon, Settings,
// } from "lucide-react";

// export const BranchSettings = (): JSX.Element => {
//     const { branding, setBranchBranding, resetBranchBranding } = useBranding();
//     const { showToast } = useToast();
//     const fileInputRef = useRef<HTMLInputElement>(null);

//     const [form, setForm] = useState({
//         branchName: branding.branchName || "",
//         logoUrl: branding.logoUrl || "",
//         primaryColor: branding.primaryColor,
//         secondaryColor: branding.secondaryColor,
//         branchAddress: branding.branchAddress || "",
//         branchPhone: branding.branchPhone || "",
//         branchEmail: branding.branchEmail || "",
//         operatingHours: branding.operatingHours || "",
//         companyTagline: branding.companyTagline || "",
//         printFooterNote: branding.printFooterNote || "",
//     });

//     const [logoPreview, setLogoPreview] = useState<string>(branding.logoUrl || "");

//     const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (!file) return;
//         if (!file.type.startsWith("image/")) { showToast("Please select a valid image file.", "error"); return; }
//         if (file.size > 2 * 1024 * 1024) { showToast("Image must be under 2MB.", "error"); return; }
//         const reader = new FileReader();
//         reader.onload = (ev) => {
//             const base64 = ev.target?.result as string;
//             setLogoPreview(base64);
//             setForm(f => ({ ...f, logoUrl: base64 }));
//         };
//         reader.readAsDataURL(file);
//     };

//     const handleRemoveLogo = () => {
//         setLogoPreview("");
//         setForm(f => ({ ...f, logoUrl: "" }));
//         if (fileInputRef.current) fileInputRef.current.value = "";
//     };

//     const handleSave = () => {
//         setBranchBranding({
//             branchName: form.branchName || undefined,
//             logoUrl: form.logoUrl || undefined,
//             primaryColor: form.primaryColor,
//             secondaryColor: form.secondaryColor,
//             branchAddress: form.branchAddress || undefined,
//             branchPhone: form.branchPhone || undefined,
//             branchEmail: form.branchEmail || undefined,
//             operatingHours: form.operatingHours || undefined,
//             companyTagline: form.companyTagline || undefined,
//             printFooterNote: form.printFooterNote || undefined,
//         });
//         showToast("Branch settings saved successfully.", "success");
//     };

//     const handleReset = () => {
//         resetBranchBranding();
//         setForm({
//             branchName: "", logoUrl: "", primaryColor: "#ea690c", secondaryColor: "#1e40af",
//             branchAddress: "", branchPhone: "", branchEmail: "", operatingHours: "",
//             companyTagline: "", printFooterNote: "",
//         });
//         setLogoPreview("");
//         showToast("Branch settings reset to defaults.", "success");
//     };

//     return (
//         <div className="w-full min-h-screen bg-gray-50/50">
//             <div className="mx-auto max-w-4xl flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

//                 {/* ── Branding ── */}
//                 <Card className="border border-[#d1d1d1] bg-white rounded-2xl shadow-sm overflow-hidden">
//                     <div className="px-6 py-4 border-b border-[#d1d1d1] bg-gray-50/80 flex items-center gap-3">
//                         <div className="p-2.5 bg-orange-50 rounded-xl">
//                             <Paintbrush className="w-5 h-5 text-[#ea690c]" />
//                         </div>
//                         <div>
//                             <h2 className="text-base font-semibold text-neutral-800">Visual Identity</h2>
//                             <p className="text-xs text-[#5d5d5d]">Logo, branch name and brand colours</p>
//                         </div>
//                     </div>
//                     <CardContent className="p-6 space-y-6">

//                         {/* Branch name */}
//                         <div>
//                             <Label className="text-xs font-semibold text-neutral-800 mb-1.5 block">Branch Name</Label>
//                             <Input
//                                 value={form.branchName}
//                                 onChange={e => setForm(f => ({ ...f, branchName: e.target.value }))}
//                                 placeholder="e.g. Kumasi Branch"
//                                 className="border-[#d1d1d1] max-w-sm"
//                             />
//                             <p className="text-[11px] text-[#9a9a9a] mt-1">Shown in the navbar and on printed labels.</p>
//                         </div>

//                         {/* Logo */}
//                         <div>
//                             <Label className="text-xs font-semibold text-neutral-800 mb-1.5 block">Branch Logo</Label>
//                             <div className="flex items-start gap-4">
//                                 <div className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-[#d1d1d1] rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
//                                     {logoPreview
//                                         ? <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-1" />
//                                         : <ImageIcon className="w-8 h-8 text-[#9a9a9a]" />}
//                                 </div>
//                                 <div className="flex-1 space-y-2 max-w-sm">
//                                     <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
//                                     <button
//                                         onClick={() => fileInputRef.current?.click()}
//                                         className="flex items-center gap-2 px-4 py-2 border border-[#d1d1d1] rounded-lg text-sm font-medium text-neutral-700 hover:bg-gray-50 transition-colors w-full justify-center"
//                                     >
//                                         <Upload className="w-4 h-4" /> Upload from device
//                                     </button>
//                                     <Input
//                                         value={logoPreview.startsWith("data:") ? "" : form.logoUrl}
//                                         onChange={e => { setForm(f => ({ ...f, logoUrl: e.target.value })); setLogoPreview(e.target.value); }}
//                                         placeholder="Or paste image URL..."
//                                         className="border-[#d1d1d1] text-sm"
//                                     />
//                                     {logoPreview && (
//                                         <button onClick={handleRemoveLogo} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
//                                             <X className="w-3 h-3" /> Remove logo
//                                         </button>
//                                     )}
//                                     <p className="text-[11px] text-[#9a9a9a]">PNG, JPG or SVG · Max 2MB</p>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Colors */}
//                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//                             <div>
//                                 <Label className="text-xs font-semibold text-neutral-800 mb-1.5 block">Primary Color</Label>
//                                 <div className="flex items-center gap-2">
//                                     <input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} className="h-10 w-10 rounded-lg border border-[#d1d1d1] cursor-pointer p-0.5 flex-shrink-0" />
//                                     <Input value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} className="border-[#d1d1d1] font-mono text-sm" />
//                                 </div>
//                                 <p className="text-[11px] text-[#9a9a9a] mt-1">Buttons, accents, highlights.</p>
//                             </div>
//                             <div>
//                                 <Label className="text-xs font-semibold text-neutral-800 mb-1.5 block">Secondary Color</Label>
//                                 <div className="flex items-center gap-2">
//                                     <input type="color" value={form.secondaryColor} onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))} className="h-10 w-10 rounded-lg border border-[#d1d1d1] cursor-pointer p-0.5 flex-shrink-0" />
//                                     <Input value={form.secondaryColor} onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))} className="border-[#d1d1d1] font-mono text-sm" />
//                                 </div>
//                                 <p className="text-[11px] text-[#9a9a9a] mt-1">Secondary UI elements.</p>
//                             </div>
//                         </div>

//                         {/* Color preview swatches */}
//                         <div className="flex items-center gap-3 pt-1">
//                             <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-none" style={{ backgroundColor: form.primaryColor }}>Primary Button</button>
//                             <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-none" style={{ backgroundColor: form.secondaryColor }}>Secondary Button</button>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 {/* ── Branch Info ── */}
//                 <Card className="border border-[#d1d1d1] bg-white rounded-2xl shadow-sm overflow-hidden">
//                     <div className="px-6 py-4 border-b border-[#d1d1d1] bg-gray-50/80 flex items-center gap-3">
//                         <div className="p-2.5 bg-orange-50 rounded-xl">
//                             <Building2 className="w-5 h-5 text-[#ea690c]" />
//                         </div>
//                         <div>
//                             <h2 className="text-base font-semibold text-neutral-800">Branch Information</h2>
//                             <p className="text-xs text-[#5d5d5d]">Contact details and operating hours</p>
//                         </div>
//                     </div>
//                     <CardContent className="p-6 space-y-5">
//                         <div>
//                             <Label className="text-xs font-semibold text-neutral-800 mb-1.5 block flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Physical Address</Label>
//                             <Input value={form.branchAddress} onChange={e => setForm(f => ({ ...f, branchAddress: e.target.value }))} placeholder="e.g. 12 Adum Street, Kumasi, Ghana" className="border-[#d1d1d1]" />
//                         </div>
//                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
//                             <div>
//                                 <Label className="text-xs font-semibold text-neutral-800 mb-1.5 block flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone Number</Label>
//                                 <Input value={form.branchPhone} onChange={e => setForm(f => ({ ...f, branchPhone: e.target.value }))} placeholder="e.g. +233 24 000 0000" className="border-[#d1d1d1]" />
//                             </div>
//                             <div>
//                                 <Label className="text-xs font-semibold text-neutral-800 mb-1.5 block flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Address</Label>
//                                 <Input value={form.branchEmail} onChange={e => setForm(f => ({ ...f, branchEmail: e.target.value }))} placeholder="e.g. kumasi@mnm.com" className="border-[#d1d1d1]" />
//                             </div>
//                         </div>
//                         <div>
//                             <Label className="text-xs font-semibold text-neutral-800 mb-1.5 block flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Operating Hours</Label>
//                             <Input value={form.operatingHours} onChange={e => setForm(f => ({ ...f, operatingHours: e.target.value }))} placeholder="e.g. Mon – Fri: 8am – 6pm · Sat: 9am – 2pm" className="border-[#d1d1d1]" />
//                             <p className="text-[11px] text-[#9a9a9a] mt-1">Shown on printed labels and customer-facing pages.</p>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 {/* ── Print Settings ── */}
//                 <Card className="border border-[#d1d1d1] bg-white rounded-2xl shadow-sm overflow-hidden">
//                     <div className="px-6 py-4 border-b border-[#d1d1d1] bg-gray-50/80 flex items-center gap-3">
//                         <div className="p-2.5 bg-orange-50 rounded-xl">
//                             <Printer className="w-5 h-5 text-[#ea690c]" />
//                         </div>
//                         <div>
//                             <h2 className="text-base font-semibold text-neutral-800">Print Settings</h2>
//                             <p className="text-xs text-[#5d5d5d]">Text shown on labels and manifests</p>
//                         </div>
//                     </div>
//                     <CardContent className="p-6 space-y-5">
//                         <div>
//                             <Label className="text-xs font-semibold text-neutral-800 mb-1.5 block">Company Tagline</Label>
//                             <Input value={form.companyTagline} onChange={e => setForm(f => ({ ...f, companyTagline: e.target.value }))} placeholder="e.g. Parcel Delivery System" className="border-[#d1d1d1]" />
//                             <p className="text-[11px] text-[#9a9a9a] mt-1">Appears below the company name on printed labels and manifests.</p>
//                         </div>
//                         <div>
//                             <Label className="text-xs font-semibold text-neutral-800 mb-1.5 block">Footer Note</Label>
//                             <Input value={form.printFooterNote} onChange={e => setForm(f => ({ ...f, printFooterNote: e.target.value }))} placeholder="e.g. For inquiries, contact M&M Parcel Services" className="border-[#d1d1d1]" />
//                             <p className="text-[11px] text-[#9a9a9a] mt-1">Printed at the bottom of every label and manifest.</p>
//                         </div>

//                         {/* Label header preview */}
//                         <div className="rounded-xl border border-[#d1d1d1] bg-gray-50/50 p-4">
//                             <p className="text-xs font-semibold text-neutral-800 mb-3">Label Header Preview</p>
//                             <div className="bg-white border-2 border-black p-3 max-w-sm">
//                                 <div className="flex items-center justify-center gap-3 pb-2 border-b-2 border-black">
//                                     {logoPreview
//                                         ? <img src={logoPreview} alt="Logo" className="h-10 w-10 object-contain" />
//                                         : <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-400" /></div>}
//                                     <div>
//                                         <p className="text-base font-bold text-black leading-tight">{form.branchName || "Branch Name"}</p>
//                                         <p className="text-xs text-black">{form.companyTagline || "Parcel Delivery System"}</p>
//                                     </div>
//                                 </div>
//                                 <p className="text-[10px] text-center text-black mt-2">{form.printFooterNote || "For inquiries, contact M&M Parcel Services"}</p>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 {/* ── Actions ── */}
//                 <Card className="border border-[#d1d1d1] bg-white rounded-2xl shadow-sm overflow-hidden">
//                     <div className="px-6 py-4 border-b border-[#d1d1d1] bg-gray-50/80 flex items-center gap-3">
//                         <div className="p-2.5 bg-orange-50 rounded-xl">
//                             <Settings className="w-5 h-5 text-[#ea690c]" />
//                         </div>
//                         <div>
//                             <h2 className="text-base font-semibold text-neutral-800">Save Changes</h2>
//                             <p className="text-xs text-[#5d5d5d]">Apply or reset all branch settings</p>
//                         </div>
//                     </div>
//                     <CardContent className="p-6">
//                         <div className="flex flex-wrap gap-3">
//                             <Button onClick={handleSave} className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2">
//                                 <Save className="w-4 h-4" /> Save Settings
//                             </Button>
//                             <Button onClick={handleReset} variant="outline" className="border border-[#d1d1d1] flex items-center gap-2 text-neutral-700 hover:bg-gray-50">
//                                 <RotateCcw className="w-4 h-4" /> Reset to Defaults
//                             </Button>
//                         </div>
//                     </CardContent>
//                 </Card>

//             </div>
//         </div>
//     );
// };
import { useState, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useBranding } from "../../contexts/BrandingContext";
import { useToast } from "../../components/ui/toast";
import {
    RotateCcw, Save, Upload, X, Building2,
    Phone, Mail, Clock, Printer, ImageIcon, Paintbrush,
} from "lucide-react";

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
            branchName: "", logoUrl: "", primaryColor: "#ea690c", secondaryColor: "#1e40af",
            branchAddress: "", branchPhone: "", branchEmail: "", operatingHours: "",
            companyTagline: "", printFooterNote: "",
        });
        setLogoPreview("");
        showToast("Branch settings reset to defaults.", "success");
    };

    // Shared row: label/description on the left, controls on the right.
    // No card chrome — sections are separated by a hairline divider only.
    const Row = ({
        icon: Icon, title, description, children,
    }: { icon: any; title: string; description: string; children: React.ReactNode }) => (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 gap-y-4 py-10 border-b border-[#e8e8e8] first:pt-0 last:border-b-0">
            <div className="md:col-span-4">
                <div className="flex items-center gap-2.5 text-neutral-800">
                    <Icon className="w-4 h-4 text-[#ea690c]" strokeWidth={2} />
                    <h2 className="text-sm font-semibold">{title}</h2>
                </div>
                <p className="text-[13px] text-[#8a8a8a] mt-1.5 leading-relaxed pr-4">{description}</p>
            </div>
            <div className="md:col-span-8">{children}</div>
        </div>
    );

    return (
        <div className="w-full bg-white">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">

                {/* ── Page Header ── */}
                <div className="pt-10 pb-6 border-b border-[#e8e8e8]">
                    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Branch Settings</h1>
                    <p className="text-sm text-[#8a8a8a] mt-1.5">
                        Manage your branch's identity, contact details, and print settings.
                    </p>
                </div>

                {/* ── Sections ── */}
                <div>
                    <Row
                        icon={Paintbrush}
                        title="Visual identity"
                        description="Your logo, branch name, and brand colours as shown across the app."
                    >
                        <div className="space-y-6">
                            <div>
                                <Label className="text-xs font-medium text-neutral-700 mb-1.5 block">Branch name</Label>
                                <Input
                                    value={form.branchName}
                                    onChange={e => setForm(f => ({ ...f, branchName: e.target.value }))}
                                    placeholder="e.g. Kumasi Branch"
                                    className="border-[#d1d1d1] max-w-sm"
                                />
                                <p className="text-[11px] text-[#a0a0a0] mt-1.5">Shown in the navbar and on printed labels.</p>
                            </div>

                            <div>
                                <Label className="text-xs font-medium text-neutral-700 mb-1.5 block">Logo</Label>
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center bg-[#f6f6f6] overflow-hidden">
                                        {logoPreview
                                            ? <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-1" />
                                            : <ImageIcon className="w-6 h-6 text-[#b5b5b5]" />}
                                    </div>
                                    <div className="flex-1 space-y-2 max-w-sm">
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#d1d1d1] rounded-lg text-xs font-medium text-neutral-700 hover:bg-[#f6f6f6] transition-colors"
                                            >
                                                <Upload className="w-3.5 h-3.5" /> Upload
                                            </button>
                                            {logoPreview && (
                                                <button onClick={handleRemoveLogo} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                                                    <X className="w-3 h-3" /> Remove
                                                </button>
                                            )}
                                        </div>
                                        <Input
                                            value={logoPreview.startsWith("data:") ? "" : form.logoUrl}
                                            onChange={e => { setForm(f => ({ ...f, logoUrl: e.target.value })); setLogoPreview(e.target.value); }}
                                            placeholder="Or paste image URL..."
                                            className="border-[#d1d1d1] text-sm"
                                        />
                                        <p className="text-[11px] text-[#a0a0a0]">PNG, JPG or SVG · Max 2MB</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-xs font-medium text-neutral-700 mb-1.5 block">Primary colour</Label>
                                    <div className="flex items-center gap-2">
                                        <label className="relative h-9 w-9 rounded-lg border border-[#d1d1d1] cursor-pointer overflow-hidden flex-shrink-0" style={{ backgroundColor: form.primaryColor }}>
                                            <input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        </label>
                                        <Input value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} className="border-[#d1d1d1] font-mono text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs font-medium text-neutral-700 mb-1.5 block">Secondary colour</Label>
                                    <div className="flex items-center gap-2">
                                        <label className="relative h-9 w-9 rounded-lg border border-[#d1d1d1] cursor-pointer overflow-hidden flex-shrink-0" style={{ backgroundColor: form.secondaryColor }}>
                                            <input type="color" value={form.secondaryColor} onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        </label>
                                        <Input value={form.secondaryColor} onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))} className="border-[#d1d1d1] font-mono text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors" style={{ backgroundColor: form.primaryColor }}>Primary button</button>
                                <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors" style={{ backgroundColor: form.secondaryColor }}>Secondary button</button>
                            </div>
                        </div>
                    </Row>

                    <Row
                        icon={Building2}
                        title="Branch information"
                        description="Contact details and hours shown to customers and on printed materials."
                    >
                        <div className="space-y-5 max-w-lg">
                            <div>
                                <Label className="text-xs font-medium text-neutral-700 mb-1.5 block flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-[#a0a0a0]" /> Physical address</Label>
                                <Input value={form.branchAddress} onChange={e => setForm(f => ({ ...f, branchAddress: e.target.value }))} placeholder="e.g. 12 Adum Street, Kumasi, Ghana" className="border-[#d1d1d1]" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <Label className="text-xs font-medium text-neutral-700 mb-1.5 block flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#a0a0a0]" /> Phone number</Label>
                                    <Input value={form.branchPhone} onChange={e => setForm(f => ({ ...f, branchPhone: e.target.value }))} placeholder="e.g. +233 24 000 0000" className="border-[#d1d1d1]" />
                                </div>
                                <div>
                                    <Label className="text-xs font-medium text-neutral-700 mb-1.5 block flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#a0a0a0]" /> Email address</Label>
                                    <Input value={form.branchEmail} onChange={e => setForm(f => ({ ...f, branchEmail: e.target.value }))} placeholder="e.g. kumasi@mnm.com" className="border-[#d1d1d1]" />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-neutral-700 mb-1.5 block flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#a0a0a0]" /> Operating hours</Label>
                                <Input value={form.operatingHours} onChange={e => setForm(f => ({ ...f, operatingHours: e.target.value }))} placeholder="e.g. Mon – Fri: 8am – 6pm · Sat: 9am – 2pm" className="border-[#d1d1d1]" />
                                <p className="text-[11px] text-[#a0a0a0] mt-1.5">Shown on printed labels and customer-facing pages.</p>
                            </div>
                        </div>
                    </Row>

                    <Row
                        icon={Printer}
                        title="Print settings"
                        description="Text that appears on every printed label and manifest."
                    >
                        <div className="space-y-6">
                            <div className="space-y-5 max-w-lg">
                                <div>
                                    <Label className="text-xs font-medium text-neutral-700 mb-1.5 block">Company tagline</Label>
                                    <Input value={form.companyTagline} onChange={e => setForm(f => ({ ...f, companyTagline: e.target.value }))} placeholder="e.g. Parcel Delivery System" className="border-[#d1d1d1]" />
                                    <p className="text-[11px] text-[#a0a0a0] mt-1.5">Appears below the company name on printed labels and manifests.</p>
                                </div>
                                <div>
                                    <Label className="text-xs font-medium text-neutral-700 mb-1.5 block">Footer note</Label>
                                    <Input value={form.printFooterNote} onChange={e => setForm(f => ({ ...f, printFooterNote: e.target.value }))} placeholder="e.g. For inquiries, contact M&M Parcel Services" className="border-[#d1d1d1]" />
                                    <p className="text-[11px] text-[#a0a0a0] mt-1.5">Printed at the bottom of every label and manifest.</p>
                                </div>
                            </div>

                            {/* Label header preview */}
                            <div>
                                <p className="text-[11px] font-medium text-[#a0a0a0] uppercase tracking-wide mb-2.5">Label preview</p>
                                <div className="bg-white border-2 border-black p-3 max-w-sm rounded-sm">
                                    <div className="flex items-center justify-center gap-3 pb-2 border-b-2 border-black">
                                        {logoPreview
                                            ? <img src={logoPreview} alt="Logo" className="h-10 w-10 object-contain" />
                                            : <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-400" /></div>}
                                        <div>
                                            <p className="text-base font-bold text-black leading-tight">{form.branchName || "Branch Name"}</p>
                                            <p className="text-xs text-black">{form.companyTagline || "Parcel Delivery System"}</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-center text-black mt-2">{form.printFooterNote || "For inquiries, contact M&M Parcel Services"}</p>
                                </div>
                            </div>
                        </div>
                    </Row>
                </div>

                {/* Spacer so content never sits under the sticky save bar */}
                <div className="h-4" />
            </div>

            {/* ── Sticky save bar ── */}
            <div className="sticky bottom-0 left-0 right-0 border-t border-[#e8e8e8] bg-white/90 backdrop-blur-sm">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 text-sm text-[#8a8a8a] hover:text-neutral-700 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset to defaults
                    </button>
                    <Button onClick={handleSave} className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save settings
                    </Button>
                </div>
            </div>
        </div>
    );
};