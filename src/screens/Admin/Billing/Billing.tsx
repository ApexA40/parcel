import { useMemo, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useToast } from "../../../components/ui/toast";
import { useTenant } from "../../../contexts/TenantContext";
import { cn } from "../../../lib/utils";
import {
    BadgeCheck, Building2, CalendarClock, CheckCircle2, CreditCard,
    Download, FileText, Mail, MapPin, Receipt, Sparkles, TrendingUp, Users, Zap,
} from "lucide-react";

type PlanId = "starter" | "growth" | "enterprise";
type Cycle = "monthly" | "annual";

const inputCls =
    "h-10 rounded-lg border-[#dcdcdc] bg-white shadow-none " +
    "focus-visible:ring-2 focus-visible:ring-[#ea690c]/20 focus-visible:border-[#ea690c]";
const labelCls = "text-[13px] font-medium text-neutral-700 mb-1.5 block";

const PLANS: {
    id: PlanId; name: string; blurb: string; icon: React.ComponentType<{ className?: string }>;
    monthly: number | null; annual: number | null; branches: string; users: string; features: string[];
}[] = [
    {
        id: "starter", name: "Starter", blurb: "For small courier operations", icon: Zap,
        monthly: 250, annual: 2500, branches: "1 branch", users: "5 users",
        features: ["Parcel & Delivery Hubs", "Rider mobile app", "Community support"],
    },
    {
        id: "growth", name: "Growth", blurb: "For expanding logistics businesses", icon: TrendingUp,
        monthly: 750, annual: 7500, branches: "5 branches", users: "Unlimited users",
        features: ["Everything in Starter", "Reconciliation & analytics", "Partner portal", "Priority support"],
    },
    {
        id: "enterprise", name: "Enterprise", blurb: "For large-scale operations", icon: Sparkles,
        monthly: null, annual: null, branches: "Unlimited branches", users: "Unlimited users",
        features: ["Everything in Growth", "Custom branding", "Dedicated support", "Custom onboarding"],
    },
];

const INVOICES = [
    { id: "INV-2026-006", date: "Jul 1, 2026", amount: "GH₵ 750.00", status: "Paid" },
    { id: "INV-2026-005", date: "Jun 1, 2026", amount: "GH₵ 750.00", status: "Paid" },
    { id: "INV-2026-004", date: "May 1, 2026", amount: "GH₵ 750.00", status: "Paid" },
    { id: "INV-2026-003", date: "Apr 1, 2026", amount: "GH₵ 750.00", status: "Paid" },
];

const money = (n: number) => `GH₵ ${n.toLocaleString()}`;

const UsageMeter = ({ icon: Icon, label, used, total }: { icon: React.ComponentType<{ className?: string }>; label: string; used: number; total: number | null }) => {
    const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 40;
    return (
        <div className="rounded-xl border border-[#ececec] bg-white p-4">
            <div className="flex items-center gap-2 text-neutral-600">
                <Icon className="h-4 w-4 text-[#ea690c]" />
                <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="mt-2 text-lg font-bold text-neutral-900">
                {used} <span className="text-sm font-medium text-neutral-400">/ {total ?? "∞"}</span>
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-gradient-to-r from-[#ea690c] to-[#ff8c3a]" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

export const Billing = (): JSX.Element => {
    const { tenant } = useTenant();
    const { showToast } = useToast();

    const activePlanId: PlanId = tenant?.plan ?? "growth";
    const branchesUsed = tenant?.branches?.length ?? 3;

    const [cycle, setCycle] = useState<Cycle>("monthly");
    const [currentPlan, setCurrentPlan] = useState<PlanId>(activePlanId);
    const [billing, setBilling] = useState({
        email: "billing@mnm.com",
        company: tenant?.name ?? "M&M Logistics",
        address: "12 Adum Street, Kumasi, Ghana",
        taxId: "",
    });

    const plan = useMemo(() => PLANS.find(p => p.id === currentPlan)!, [currentPlan]);
    const planLimits = useMemo(() => {
        const map: Record<PlanId, { branches: number | null; users: number | null }> = {
            starter: { branches: 1, users: 5 },
            growth: { branches: 5, users: null },
            enterprise: { branches: null, users: null },
        };
        return map[currentPlan];
    }, [currentPlan]);

    const priceLabel = (p: typeof PLANS[number]) => {
        const val = cycle === "monthly" ? p.monthly : p.annual;
        if (val === null) return "Custom";
        return cycle === "monthly" ? `${money(val)}/mo` : `${money(val)}/yr`;
    };

    // No billing backend yet — subscription changes and saves are simulated locally.
    const handleChangePlan = (id: PlanId) => {
        if (id === currentPlan) return;
        if (id === "enterprise") {
            showToast("Our team will reach out about Enterprise plans.", "info");
            return;
        }
        setCurrentPlan(id);
        showToast(`Subscription updated to the ${PLANS.find(p => p.id === id)!.name} plan.`, "success");
    };

    const handleSaveBilling = () => showToast("Billing information saved.", "success");
    const handleUpdateCard = () => showToast("Redirecting to secure payment update...", "info");

    return (
        <div className="w-full">
            <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

                {/* ── Header ── */}
                <div className="mb-7">
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Billing &amp; Subscription</h1>
                    <p className="mt-1 text-sm text-[#7d7d7d]">Manage your plan, payment method, and billing details.</p>
                </div>

                {/* ── Current plan summary ── */}
                <div className="overflow-hidden rounded-2xl border border-[#e3e3e3] bg-white shadow-sm">
                    <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#ea690c]">
                                    <BadgeCheck className="h-3.5 w-3.5" /> Current plan
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active
                                </span>
                            </div>
                            <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                                <h2 className="text-2xl font-extrabold text-neutral-900">{plan.name}</h2>
                                <p className="text-lg font-bold text-neutral-800">
                                    {plan.monthly === null ? "Custom pricing" : priceLabel(plan)}
                                </p>
                            </div>
                            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-neutral-500">
                                <CalendarClock className="h-4 w-4 text-neutral-400" />
                                {currentPlan === "enterprise" ? "Billed annually · custom terms" : `Renews on Aug 1, 2026 · billed ${cycle}`}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                            <UsageMeter icon={Building2} label="Branches" used={branchesUsed} total={planLimits.branches} />
                            <UsageMeter icon={Users} label="Team members" used={12} total={planLimits.users} />
                        </div>
                    </div>
                </div>

                {/* ── Plan selector ── */}
                <div className="mt-8">
                    <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-lg font-bold text-neutral-900">Change plan</h2>
                            <p className="text-sm text-neutral-500">Upgrade or downgrade anytime. Changes are prorated.</p>
                        </div>
                        {/* Billing cycle toggle */}
                        <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 p-1">
                            {(["monthly", "annual"] as Cycle[]).map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCycle(c)}
                                    className={cn(
                                        "rounded-md px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors",
                                        cycle === c ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                                    )}
                                >
                                    {c}{c === "annual" && <span className="ml-1 text-[#ea690c]">−17%</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-3">
                        {PLANS.map(p => {
                            const isCurrent = p.id === currentPlan;
                            const Icon = p.icon;
                            const popular = p.id === "growth";
                            return (
                                <div
                                    key={p.id}
                                    className={cn(
                                        "relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md",
                                        isCurrent ? "border-[#ea690c] ring-1 ring-[#ea690c]/30" : "border-[#e3e3e3]"
                                    )}
                                >
                                    {popular && !isCurrent && (
                                        <span className="absolute -top-3 left-6 rounded-full bg-[#1e40af] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                            Popular
                                        </span>
                                    )}
                                    {isCurrent && (
                                        <span className="absolute -top-3 left-6 rounded-full bg-[#ea690c] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                            Current plan
                                        </span>
                                    )}
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                                        <Icon className="h-5 w-5 text-[#ea690c]" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-extrabold text-neutral-900">{p.name}</h3>
                                    <p className="mt-0.5 text-xs text-neutral-500">{p.blurb}</p>
                                    <p className="mt-4 text-2xl font-extrabold text-neutral-900">
                                        {p.monthly === null ? "Custom" : (cycle === "monthly" ? money(p.monthly) : money(p.annual!))}
                                        {p.monthly !== null && <span className="text-sm font-medium text-neutral-400">/{cycle === "monthly" ? "mo" : "yr"}</span>}
                                    </p>
                                    <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
                                        <p className="text-xs font-semibold text-neutral-700">{p.branches} · {p.users}</p>
                                        <ul className="space-y-1.5">
                                            {p.features.map(f => (
                                                <li key={f} className="flex items-start gap-2 text-xs text-neutral-600">
                                                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#ea690c]" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={isCurrent}
                                        onClick={() => handleChangePlan(p.id)}
                                        className={cn(
                                            "mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                                            isCurrent
                                                ? "cursor-default border border-neutral-200 bg-neutral-50 text-neutral-400"
                                                : popular
                                                    ? "bg-[#ea690c] text-white hover:bg-[#ff7a1a]"
                                                    : "border border-neutral-300 text-neutral-800 hover:bg-neutral-50"
                                        )}
                                    >
                                        {isCurrent ? "Your current plan" : p.id === "enterprise" ? "Contact sales" : "Switch to " + p.name}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Payment method + Billing info ── */}
                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    {/* Payment method */}
                    <div className="overflow-hidden rounded-2xl border border-[#e3e3e3] bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-[#ececec] px-5 py-4 sm:px-6">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                                <CreditCard className="h-[18px] w-[18px] text-[#ea690c]" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-neutral-800">Payment method</h2>
                                <p className="mt-0.5 text-xs text-[#8a8a8a]">Card charged for your subscription</p>
                            </div>
                        </div>
                        <div className="p-5 sm:p-6">
                            <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-14 items-center justify-center rounded-md bg-gradient-to-br from-[#1e40af] to-[#3b5bdb] text-[10px] font-bold text-white">
                                        VISA
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-neutral-800">•••• •••• •••• 4242</p>
                                        <p className="text-xs text-neutral-500">Expires 09 / 27</p>
                                    </div>
                                </div>
                                <span className="hidden rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 sm:inline">Default</span>
                            </div>
                            <Button onClick={handleUpdateCard} variant="outline" className="mt-4 w-full gap-2 rounded-lg border-neutral-300 text-neutral-700 hover:bg-neutral-50">
                                <CreditCard className="h-4 w-4" /> Update payment method
                            </Button>
                        </div>
                    </div>

                    {/* Billing information */}
                    <div className="overflow-hidden rounded-2xl border border-[#e3e3e3] bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-[#ececec] px-5 py-4 sm:px-6">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                                <Receipt className="h-[18px] w-[18px] text-[#ea690c]" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-neutral-800">Billing information</h2>
                                <p className="mt-0.5 text-xs text-[#8a8a8a]">Appears on your invoices</p>
                            </div>
                        </div>
                        <div className="space-y-4 p-5 sm:p-6">
                            <div>
                                <Label className={labelCls}>
                                    <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-[#a0a0a0]" /> Billing email</span>
                                </Label>
                                <Input value={billing.email} onChange={e => setBilling(b => ({ ...b, email: e.target.value }))} className={inputCls} />
                            </div>
                            <div>
                                <Label className={labelCls}>
                                    <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-[#a0a0a0]" /> Company name</span>
                                </Label>
                                <Input value={billing.company} onChange={e => setBilling(b => ({ ...b, company: e.target.value }))} className={inputCls} />
                            </div>
                            <div>
                                <Label className={labelCls}>
                                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#a0a0a0]" /> Billing address</span>
                                </Label>
                                <Input value={billing.address} onChange={e => setBilling(b => ({ ...b, address: e.target.value }))} className={inputCls} />
                            </div>
                            <div>
                                <Label className={labelCls}>Tax ID / TIN <span className="text-neutral-400">(optional)</span></Label>
                                <Input value={billing.taxId} onChange={e => setBilling(b => ({ ...b, taxId: e.target.value }))} placeholder="e.g. C0001234567" className={inputCls} />
                            </div>
                            <Button onClick={handleSaveBilling} className="w-full gap-2 rounded-lg bg-[#ea690c] text-white hover:bg-[#ea690c]/90">
                                Save billing information
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ── Invoice history ── */}
                <div className="mt-8 overflow-hidden rounded-2xl border border-[#e3e3e3] bg-white shadow-sm">
                    <div className="flex items-center gap-3 border-b border-[#ececec] px-5 py-4 sm:px-6">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                            <FileText className="h-[18px] w-[18px] text-[#ea690c]" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-neutral-800">Billing history</h2>
                            <p className="mt-0.5 text-xs text-[#8a8a8a]">Download past invoices</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 text-left text-[11px] uppercase tracking-wider text-neutral-400">
                                    <th className="px-6 py-3 font-semibold">Invoice</th>
                                    <th className="px-6 py-3 font-semibold">Date</th>
                                    <th className="px-6 py-3 font-semibold">Amount</th>
                                    <th className="px-6 py-3 font-semibold">Status</th>
                                    <th className="px-6 py-3 text-right font-semibold">Download</th>
                                </tr>
                            </thead>
                            <tbody>
                                {INVOICES.map(inv => (
                                    <tr key={inv.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60">
                                        <td className="px-6 py-3.5 font-medium text-neutral-800">{inv.id}</td>
                                        <td className="px-6 py-3.5 text-neutral-600">{inv.date}</td>
                                        <td className="px-6 py-3.5 font-medium text-neutral-800">{inv.amount}</td>
                                        <td className="px-6 py-3.5">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                                                <CheckCircle2 className="h-3 w-3" /> {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            <button
                                                type="button"
                                                onClick={() => showToast(`Downloading ${inv.id}...`, "info")}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                                            >
                                                <Download className="h-3.5 w-3.5" /> PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-neutral-400">
                    Payments are processed securely. Need help?{" "}
                    <a href="#" className="font-medium text-[#ea690c] hover:underline">Contact billing support</a>.
                </p>
            </div>
        </div>
    );
};
