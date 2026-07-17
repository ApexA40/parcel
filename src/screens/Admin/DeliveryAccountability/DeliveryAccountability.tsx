import { useMemo } from "react";
import {
    ArrowDownRight, ArrowUpRight, CheckCircle2, Info, Package, Scale, Truck,
} from "lucide-react";
import { getDeliveryAccountability } from "../../../data/mockData";
import { formatCurrency, formatDate } from "../../../utils/dataHelpers";

const Kpi = ({
    icon: Icon, iconBg, label, value, sub,
}: {
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string; label: string; value: string; sub: string;
}) => (
    <div className="rounded-2xl border border-[#e3e3e3] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{label}</p>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className="h-[18px] w-[18px]" />
            </div>
        </div>
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-neutral-900">{value}</p>
        <p className="mt-1.5 text-xs text-neutral-500">{sub}</p>
    </div>
);

export const DeliveryAccountability = (): JSX.Element => {
    const records = useMemo(() => getDeliveryAccountability(), []);

    const totals = useMemo(() => {
        return records.reduce(
            (acc, r) => ({
                fees: acc.fees + r.deliveryFee,
                inbound: acc.inbound + r.inboundCost,
                other: acc.other + r.otherCost,
                net: acc.net + r.netPosition,
            }),
            { fees: 0, inbound: 0, other: 0, net: 0 }
        );
    }, [records]);

    return (
        <div className="w-full">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

                {/* ── Header ── */}
                <div className="mb-5">
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Delivery Accountability</h1>
                    <p className="mt-1 text-sm text-[#7d7d7d]">
                        Parcels completed by the Delivery Hub, with the costs the Parcel Hub bears on each.
                    </p>
                </div>

                {/* ── Context banner ── */}
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1e40af]" />
                    <p className="text-xs leading-relaxed text-neutral-700">
                        The Delivery Hub operates under the Parcel Hub. This read-only log shows every parcel the
                        Delivery Hub completed, the delivery income it generated, and the inbound/operational costs
                        attributed to the Parcel Hub — so both sides reconcile against the same record.
                    </p>
                </div>

                {/* ── KPI row ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Kpi
                        icon={Package} iconBg="bg-orange-50 text-[#ea690c]"
                        label="Parcels Completed" value={String(records.length)}
                        sub="Delivered or collected by the Delivery Hub"
                    />
                    <Kpi
                        icon={ArrowUpRight} iconBg="bg-green-50 text-green-600"
                        label="Delivery Income" value={formatCurrency(totals.fees)}
                        sub="Fees generated on these parcels"
                    />
                    <Kpi
                        icon={ArrowDownRight} iconBg="bg-red-50 text-red-500"
                        label="Costs Attributed" value={formatCurrency(totals.inbound + totals.other)}
                        sub={`${formatCurrency(totals.inbound)} inbound · ${formatCurrency(totals.other)} other`}
                    />
                    <Kpi
                        icon={Scale} iconBg="bg-blue-50 text-[#1e40af]"
                        label="Net Position" value={formatCurrency(totals.net)}
                        sub="Income minus attributed costs"
                    />
                </div>

                {/* ── Accountability ledger ── */}
                <div className="mt-6 overflow-hidden rounded-2xl border border-[#e3e3e3] bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-[#ececec] px-5 py-4">
                        <div>
                            <h2 className="text-sm font-bold text-neutral-800">Accountability Ledger</h2>
                            <p className="mt-0.5 text-xs text-[#8a8a8a]">Per-parcel income vs attributed cost · read-only</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-500">
                            <Truck className="h-3.5 w-3.5" /> Delivery Hub work
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 text-left text-[11px] uppercase tracking-wider text-neutral-400">
                                    <th className="px-5 py-3 font-semibold">Parcel</th>
                                    <th className="px-5 py-3 font-semibold">Recipient</th>
                                    <th className="px-5 py-3 font-semibold">Station</th>
                                    <th className="px-5 py-3 font-semibold">Rider</th>
                                    <th className="px-5 py-3 font-semibold">Completed</th>
                                    <th className="px-5 py-3 text-right font-semibold">Delivery Fee</th>
                                    <th className="px-5 py-3 text-right font-semibold">Inbound Cost</th>
                                    <th className="px-5 py-3 text-right font-semibold">Other Cost</th>
                                    <th className="px-5 py-3 text-right font-semibold">Net</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(rec => (
                                    <tr key={rec.parcelId} className="border-b border-neutral-50 hover:bg-neutral-50/60">
                                        <td className="px-5 py-3.5">
                                            <span className="font-mono text-xs font-semibold text-neutral-700">{rec.parcelId}</span>
                                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-green-700">
                                                <CheckCircle2 className="h-2.5 w-2.5" /> {rec.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-neutral-800">{rec.recipientName}</td>
                                        <td className="px-5 py-3.5 text-neutral-600">{rec.stationName}</td>
                                        <td className="px-5 py-3.5 text-neutral-600">{rec.riderName}</td>
                                        <td className="px-5 py-3.5 text-xs text-neutral-500">
                                            {rec.deliveredDate ? formatDate(rec.deliveredDate) : "—"}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-semibold text-green-700">{formatCurrency(rec.deliveryFee)}</td>
                                        <td className="px-5 py-3.5 text-right text-red-500">−{formatCurrency(rec.inboundCost)}</td>
                                        <td className="px-5 py-3.5 text-right text-red-400">−{formatCurrency(rec.otherCost)}</td>
                                        <td className={`px-5 py-3.5 text-right font-bold ${rec.netPosition >= 0 ? "text-neutral-900" : "text-red-600"}`}>
                                            {formatCurrency(rec.netPosition)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-neutral-200 bg-neutral-50/80 font-bold text-neutral-900">
                                    <td className="px-5 py-3.5" colSpan={5}>Totals ({records.length} parcels)</td>
                                    <td className="px-5 py-3.5 text-right text-green-700">{formatCurrency(totals.fees)}</td>
                                    <td className="px-5 py-3.5 text-right text-red-500">−{formatCurrency(totals.inbound)}</td>
                                    <td className="px-5 py-3.5 text-right text-red-400">−{formatCurrency(totals.other)}</td>
                                    <td className={`px-5 py-3.5 text-right ${totals.net >= 0 ? "text-neutral-900" : "text-red-600"}`}>
                                        {formatCurrency(totals.net)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
