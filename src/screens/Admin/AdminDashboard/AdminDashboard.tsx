import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart } from "@mui/x-charts/LineChart";
import {
    AlertTriangle, ArrowRight, Bike, Building2, CheckCircle2, ChevronRight,
    CircleDollarSign, Package, PhoneMissed, Plus, Star, Truck, UserPlus, Wallet,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
    mockParcels, mockRiders, mockStations,
    getSystemMetrics, getStationPerformance, calculateFinancialSummary,
    getAllActiveDeliveries, getUncontactedParcels,
    StationPerformance,
} from "../../../data/mockData";
import { formatCurrency } from "../../../utils/dataHelpers";
import { Parcel, ParcelStatus } from "../../../types";

/* ── Pipeline configuration (lifecycle order) ────────────────── */

const PIPELINE: { status: ParcelStatus; label: string; hex: string }[] = [
    { status: "registered",        label: "Registered",       hex: "#9ca3af" },
    { status: "contacted",         label: "Contacted",        hex: "#3b82f6" },
    { status: "ready-for-delivery",label: "Ready",            hex: "#eab308" },
    { status: "assigned",          label: "Assigned",         hex: "#a855f7" },
    { status: "picked-up",         label: "Picked Up",        hex: "#f97316" },
    { status: "out-for-delivery",  label: "Out for Delivery", hex: "#6366f1" },
    { status: "delivered",         label: "Delivered",        hex: "#22c55e" },
    { status: "delivery-failed",   label: "Failed",           hex: "#ef4444" },
    { status: "collected",         label: "Collected",        hex: "#14b8a6" },
];

const dayKey = (iso: string) => iso.slice(0, 10);
const dayLabel = (key: string) =>
    new Date(key + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

/* ── Small building blocks ───────────────────────────────────── */

const KpiCard = ({
    icon: Icon, iconBg, label, value, sub,
}: {
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string; label: string; value: string; sub: React.ReactNode;
}) => (
    <div className="rounded-2xl border border-[#e3e3e3] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{label}</p>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className="h-[18px] w-[18px]" />
            </div>
        </div>
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-neutral-900">{value}</p>
        <div className="mt-1.5 text-xs text-neutral-500">{sub}</div>
    </div>
);

const SectionCard = ({
    title, sub, action, children, className = "",
}: {
    title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) => (
    <div className={`overflow-hidden rounded-2xl border border-[#e3e3e3] bg-white shadow-sm ${className}`}>
        <div className="flex items-center justify-between gap-3 border-b border-[#ececec] px-5 py-4">
            <div>
                <h2 className="text-sm font-bold text-neutral-800">{title}</h2>
                {sub && <p className="mt-0.5 text-xs text-[#8a8a8a]">{sub}</p>}
            </div>
            {action}
        </div>
        {children}
    </div>
);

const ViewAll = ({ onClick }: { onClick: () => void }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-1 text-xs font-semibold text-[#ea690c] transition-colors hover:text-[#c2470a]"
    >
        View all <ChevronRight className="h-3.5 w-3.5" />
    </button>
);

/* ── Dashboard ───────────────────────────────────────────────── */

export const AdminDashboard = (): JSX.Element => {
    const navigate = useNavigate();

    const metrics = useMemo(() => getSystemMetrics(), []);
    const stations = useMemo<StationPerformance[]>(
        () => [...getStationPerformance()].sort((a, b) => b.deliveryEarnings - a.deliveryEarnings),
        []
    );
    const finance = useMemo(() => calculateFinancialSummary(), []);
    const activeDeliveries = useMemo<Parcel[]>(() => getAllActiveDeliveries(), []);
    const uncontacted = useMemo(() => getUncontactedParcels(), []);

    const pipeline = useMemo(() => {
        const counts: Record<string, number> = {};
        mockParcels.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
        return PIPELINE.map(s => ({ ...s, count: counts[s.status] || 0 })).filter(s => s.count > 0);
    }, []);
    const pipelineTotal = pipeline.reduce((s, p) => s + p.count, 0);

    // Daily volume computed from real parcel dates (registrations vs deliveries)
    const daily = useMemo(() => {
        const reg: Record<string, number> = {};
        const del: Record<string, number> = {};
        mockParcels.forEach(p => {
            reg[dayKey(p.registeredDate)] = (reg[dayKey(p.registeredDate)] || 0) + 1;
            if (p.deliveredDate) del[dayKey(p.deliveredDate)] = (del[dayKey(p.deliveredDate)] || 0) + 1;
        });
        const days = [...new Set([...Object.keys(reg), ...Object.keys(del)])].sort();
        return days.map(d => ({ date: dayLabel(d), registered: reg[d] || 0, delivered: del[d] || 0 }));
    }, []);

    const topRiders = useMemo(
        () => [...mockRiders].sort((a, b) => b.deliveriesCompleted - a.deliveriesCompleted).slice(0, 4),
        []
    );

    const failedCount = useMemo(() => mockParcels.filter(p => p.status === "delivery-failed").length, []);
    const ridersOwed = useMemo(() => mockRiders.filter(r => r.outstandingBalance > 0), []);
    const outForDelivery = useMemo(
        () => mockParcels.filter(p => p.status === "out-for-delivery" || p.status === "picked-up").slice(0, 4),
        []
    );
    const activeStations = useMemo(() => mockStations.filter(s => s.status === "active").length, []);
    const availableRiders = useMemo(() => mockRiders.filter(r => r.status === "available").length, []);

    const attention = [
        {
            icon: AlertTriangle, tone: "text-red-600 bg-red-50",
            label: `${failedCount} failed ${failedCount === 1 ? "delivery" : "deliveries"} to resolve`,
            show: failedCount > 0, to: "/admin/parcels",
        },
        {
            icon: PhoneMissed, tone: "text-amber-600 bg-amber-50",
            label: `${uncontacted.length} ${uncontacted.length === 1 ? "parcel" : "parcels"} awaiting customer contact`,
            show: uncontacted.length > 0, to: "/admin/parcels",
        },
        {
            icon: Wallet, tone: "text-blue-600 bg-blue-50",
            label: `${ridersOwed.length} ${ridersOwed.length === 1 ? "rider" : "riders"} with outstanding balance (${formatCurrency(finance.pendingPayments)})`,
            show: ridersOwed.length > 0, to: "/admin/reconciliation",
        },
    ].filter(a => a.show);

    return (
        <div className="w-full">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

                {/* ── Header ── */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Overview</h1>
                        <p className="mt-1 text-sm text-[#7d7d7d]">
                            {activeStations} active {activeStations === 1 ? "station" : "stations"} · {availableRiders} riders available · {activeDeliveries.length} deliveries in progress
                        </p>
                    </div>
                    <div className="flex flex-shrink-0 gap-2.5">
                        <Button
                            onClick={() => navigate("/admin/stations")}
                            className="gap-1.5 rounded-lg bg-[#ea690c] text-white shadow-sm hover:bg-[#ea690c]/90"
                        >
                            <Plus className="h-4 w-4" /> Create Station
                        </Button>
                        <Button
                            onClick={() => navigate("/admin/users")}
                            variant="outline"
                            className="gap-1.5 rounded-lg border-[#dcdcdc] text-neutral-700 hover:bg-neutral-50"
                        >
                            <UserPlus className="h-4 w-4" /> Create User
                        </Button>
                    </div>
                </div>

                {/* ── KPI row ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        icon={Package} iconBg="bg-orange-50 text-[#ea690c]"
                        label="Total Parcels" value={String(metrics.totalParcels)}
                        sub={<span>across {metrics.totalStations} stations</span>}
                    />
                    <KpiCard
                        icon={CheckCircle2} iconBg="bg-green-50 text-green-600"
                        label="Success Rate" value={`${metrics.deliverySuccessRate}%`}
                        sub={
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-100">
                                    <div className="h-full rounded-full bg-green-500" style={{ width: `${metrics.deliverySuccessRate}%` }} />
                                </div>
                                <span>of attempted deliveries</span>
                            </div>
                        }
                    />
                    <KpiCard
                        icon={CircleDollarSign} iconBg="bg-blue-50 text-[#1e40af]"
                        label="Collections" value={formatCurrency(finance.totalDeliveryEarnings + finance.totalItemCollections)}
                        sub={<span>{formatCurrency(finance.totalDeliveryEarnings)} fees · {formatCurrency(finance.totalItemCollections)} items</span>}
                    />
                    <KpiCard
                        icon={Wallet} iconBg="bg-red-50 text-red-500"
                        label="Owed to Riders" value={formatCurrency(finance.pendingPayments)}
                        sub={<span>{ridersOwed.length} {ridersOwed.length === 1 ? "rider" : "riders"} pending payout</span>}
                    />
                </div>

                {/* ── Delivery pipeline ── */}
                <SectionCard
                    className="mt-6"
                    title="Delivery Pipeline"
                    sub="Where every parcel sits in the lifecycle right now"
                    action={<ViewAll onClick={() => navigate("/admin/parcels")} />}
                >
                    <div className="p-5">
                        <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-neutral-100">
                            {pipeline.map(seg => (
                                <div
                                    key={seg.status}
                                    className="h-full transition-all"
                                    style={{ width: `${(seg.count / pipelineTotal) * 100}%`, backgroundColor: seg.hex }}
                                    title={`${seg.label}: ${seg.count}`}
                                />
                            ))}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                            {pipeline.map(seg => (
                                <div key={seg.status} className="flex items-center gap-1.5 text-xs text-neutral-600">
                                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: seg.hex }} />
                                    {seg.label} <span className="font-bold text-neutral-900">{seg.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </SectionCard>

                {/* ── Main grid ── */}
                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">

                    {/* Left 2/3 */}
                    <div className="space-y-6 xl:col-span-2">
                        {/* Daily volume */}
                        <SectionCard title="Daily Volume" sub="Parcels registered vs delivered per day">
                            <div className="px-3 pb-2 pt-1">
                                <LineChart
                                    dataset={daily}
                                    xAxis={[{ scaleType: "band", dataKey: "date" }]}
                                    series={[
                                        { dataKey: "registered", label: "Registered", color: "#ea690c", curve: "monotoneX" },
                                        { dataKey: "delivered", label: "Delivered", color: "#22c55e", curve: "monotoneX" },
                                    ]}
                                    height={260}
                                    margin={{ top: 30, bottom: 25, left: 35, right: 15 }}
                                    grid={{ horizontal: true }}
                                />
                            </div>
                        </SectionCard>

                        {/* Station performance */}
                        <SectionCard
                            title="Station Performance"
                            sub="Ranked by delivery earnings"
                            action={<ViewAll onClick={() => navigate("/admin/stations")} />}
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[560px] text-sm">
                                    <thead>
                                        <tr className="border-b border-neutral-100 text-left text-[11px] uppercase tracking-wider text-neutral-400">
                                            <th className="px-5 py-3 font-semibold">Station</th>
                                            <th className="px-5 py-3 text-right font-semibold">Parcels</th>
                                            <th className="px-5 py-3 text-right font-semibold">Earnings</th>
                                            <th className="px-5 py-3 text-right font-semibold">Owed</th>
                                            <th className="px-5 py-3 font-semibold">Success Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stations.map(st => (
                                            <tr key={st.stationId} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                                                            <Building2 className="h-4 w-4 text-[#ea690c]" />
                                                        </div>
                                                        <span className="font-medium text-neutral-800">{st.stationName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-medium text-neutral-700">{st.totalParcels}</td>
                                                <td className="px-5 py-3.5 text-right font-semibold text-neutral-900">{formatCurrency(st.deliveryEarnings)}</td>
                                                <td className={`px-5 py-3.5 text-right font-medium ${st.driverPaymentsOwed > 0 ? "text-red-500" : "text-neutral-400"}`}>
                                                    {formatCurrency(st.driverPaymentsOwed)}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-100">
                                                            <div
                                                                className={`h-full rounded-full ${st.successRate >= 80 ? "bg-green-500" : st.successRate >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                                                                style={{ width: `${st.successRate}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-semibold text-neutral-700">{st.successRate}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>
                    </div>

                    {/* Right 1/3 */}
                    <div className="space-y-6">
                        {/* Live operations */}
                        <SectionCard
                            title="Live Operations"
                            sub={`${activeDeliveries.length} deliveries in progress`}
                            action={
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="absolute h-full w-full animate-ping rounded-full bg-green-400/60" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                                </span>
                            }
                        >
                            <div className="divide-y divide-neutral-50 px-5 py-1">
                                {outForDelivery.length === 0 && (
                                    <p className="py-5 text-center text-xs text-neutral-400">No parcels on the road right now.</p>
                                )}
                                {outForDelivery.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 py-3">
                                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                                            <Truck className="h-4 w-4 text-indigo-500" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-neutral-800">{p.recipientName}</p>
                                            <p className="truncate text-xs text-neutral-400">
                                                {p.assignedRiderName ? `Rider: ${p.assignedRiderName}` : p.id}
                                            </p>
                                        </div>
                                        <span className="flex-shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                                            {p.status === "out-for-delivery" ? "On road" : "Picked up"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Needs attention */}
                        <SectionCard title="Needs Attention" sub="Items that may require action">
                            <div className="divide-y divide-neutral-50 px-5 py-1">
                                {attention.length === 0 && (
                                    <p className="py-5 text-center text-xs text-neutral-400">All clear — nothing needs attention. 🎉</p>
                                )}
                                {attention.map(({ icon: Icon, tone, label, to }, i) => (
                                    <button
                                        key={i}
                                        onClick={() => navigate(to)}
                                        className="group flex w-full items-center gap-3 py-3 text-left"
                                    >
                                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${tone}`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <p className="min-w-0 flex-1 text-xs font-medium leading-relaxed text-neutral-700">{label}</p>
                                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-neutral-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#ea690c]" />
                                    </button>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Top riders */}
                        <SectionCard
                            title="Top Riders"
                            sub="By completed deliveries"
                            action={<ViewAll onClick={() => navigate("/admin/users")} />}
                        >
                            <div className="divide-y divide-neutral-50 px-5 py-1">
                                {topRiders.map((r, i) => (
                                    <div key={r.id} className="flex items-center gap-3 py-3">
                                        <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ea690c] to-[#c2470a] text-xs font-bold text-white">
                                            {r.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                            <span
                                                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                                                    r.status === "available" ? "bg-green-500" : r.status === "busy" ? "bg-amber-400" : "bg-neutral-300"
                                                }`}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-neutral-800">
                                                {i === 0 && <span className="mr-1">🏆</span>}{r.name}
                                            </p>
                                            <p className="flex items-center gap-1 text-xs text-neutral-400">
                                                <Bike className="h-3 w-3" /> {r.deliveriesCompleted} deliveries
                                                <span className="mx-0.5">·</span>
                                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {r.rating}
                                            </p>
                                        </div>
                                        {r.outstandingBalance > 0 && (
                                            <span className="flex-shrink-0 text-xs font-semibold text-red-500">
                                                {formatCurrency(r.outstandingBalance)}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    </div>
                </div>
            </div>
        </div>
    );
};
