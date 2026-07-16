import { useState } from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { TrendingUp, TrendingDown, Package, DollarSign, Truck, Users } from "lucide-react";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";

const TENANTS = ["All Tenants", "M&M Logistics", "Swift Parcels Ltd", "Accra Express", "GoldCoast Delivery", "Kumasi Couriers"];

const MOCK = {
    overview: [
        { label: "Total Parcels",    value: 8420,      change: 14.2,  icon: Package,    color: "text-blue-600",   bg: "bg-blue-50" },
        { label: "Total Revenue",    value: "GHS 134,580", change: 9.8, icon: DollarSign, color: "text-green-600",  bg: "bg-green-50" },
        { label: "Active Riders",    value: 87,        change: 6.1,   icon: Users,      color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Delivery Rate",    value: "93.2%",   change: 1.4,   icon: Truck,      color: "text-orange-600", bg: "bg-orange-50" },
    ],
    tenantPerformance: [
        { name: "M&M Logistics",     parcels: 2847, revenue: 45680, deliveryRate: 94.5 },
        { name: "Swift Parcels",     parcels: 2103, revenue: 38920, deliveryRate: 92.1 },
        { name: "Accra Express",     parcels: 1560, revenue: 28400, deliveryRate: 91.8 },
        { name: "GoldCoast Delivery",parcels: 1240, revenue: 13800, deliveryRate: 89.3 },
        { name: "Kumasi Couriers",   parcels: 670,  revenue: 7780,  deliveryRate: 95.2 },
    ],
    trend: [
        { month: "Jan", parcels: 580, revenue: 9200 },
        { month: "Feb", parcels: 640, revenue: 10100 },
        { month: "Mar", parcels: 720, revenue: 11400 },
        { month: "Apr", parcels: 690, revenue: 10900 },
        { month: "May", parcels: 810, revenue: 12800 },
        { month: "Jun", parcels: 880, revenue: 13900 },
    ],
};

export const CrossTenantAnalytics = (): JSX.Element => {
    const [selectedTenant, setSelectedTenant] = useState("All Tenants");
    const [activeChart, setActiveChart] = useState<"parcels" | "revenue">("revenue");

    return (
        <div className="w-full bg-gray-50 min-h-screen">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

                {/* Tenant Filter */}
                <div className="flex flex-wrap gap-2">
                    {TENANTS.map(t => (
                        <button
                            key={t}
                            onClick={() => setSelectedTenant(t)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${selectedTenant === t
                                ? "bg-indigo-600 text-white"
                                : "bg-white text-gray-600 border border-[#d1d1d1] hover:bg-gray-50"
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {MOCK.overview.map(card => {
                        const isPositive = card.change >= 0;
                        const TrendIcon = isPositive ? TrendingUp : TrendingDown;
                        return (
                            <Card key={card.label} className="border border-[#d1d1d1] bg-white shadow-sm">
                                <CardContent className="p-4 sm:p-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs text-[#5d5d5d] uppercase tracking-wide">{card.label}</p>
                                            <p className={`text-xl sm:text-2xl font-bold mt-1 ${card.color}`}>
                                                {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1.5">
                                                <TrendIcon className={`w-3.5 h-3.5 ${isPositive ? "text-green-600" : "text-red-600"}`} />
                                                <span className={`text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                                                    {Math.abs(card.change)}%
                                                </span>
                                                <span className="text-xs text-[#5d5d5d]">vs last period</span>
                                            </div>
                                        </div>
                                        <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center shrink-0`}>
                                            <card.icon className={`w-5 h-5 ${card.color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold text-neutral-800">Monthly Trend</h2>
                                <div className="flex gap-2">
                                    {(["revenue", "parcels"] as const).map(k => (
                                        <button
                                            key={k}
                                            onClick={() => setActiveChart(k)}
                                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors capitalize ${activeChart === k
                                                ? "bg-indigo-600 text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                        >
                                            {k}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <LineChart
                                dataset={MOCK.trend}
                                xAxis={[{ scaleType: "band", dataKey: "month" }]}
                                series={[{
                                    dataKey: activeChart,
                                    label: activeChart === "revenue" ? "Revenue (GHS)" : "Parcels",
                                    color: "#6366f1",
                                }]}
                                height={280}
                                margin={{ top: 10, bottom: 30, left: 55, right: 10 }}
                            />
                        </CardContent>
                    </Card>

                    <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                        <CardContent className="p-6">
                            <h2 className="text-base font-bold text-neutral-800 mb-4">Parcels by Tenant</h2>
                            <BarChart
                                dataset={MOCK.tenantPerformance}
                                xAxis={[{ scaleType: "band", dataKey: "name" }]}
                                series={[{ dataKey: "parcels", label: "Parcels", color: "#6366f1" }]}
                                height={280}
                                margin={{ top: 10, bottom: 60, left: 50, right: 10 }}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Tenant Performance Table */}
                <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                    <CardContent className="p-4 sm:p-6">
                        <h2 className="text-base font-bold text-neutral-800 mb-4">Tenant Performance</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-[#d1d1d1]">
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 uppercase tracking-wider">Tenant</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-700 uppercase tracking-wider">Parcels</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-700 uppercase tracking-wider">Revenue</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-700 uppercase tracking-wider">Delivery Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#d1d1d1]">
                                    {MOCK.tenantPerformance.map((t, i) => (
                                        <tr key={t.name} className={`hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                                            <td className="py-3 px-4 text-sm font-semibold text-neutral-800">{t.name}</td>
                                            <td className="py-3 px-4 text-right text-sm text-neutral-700">{t.parcels.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-sm font-semibold text-green-600">
                                                GHS {t.revenue.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                                        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${t.deliveryRate}%` }} />
                                                    </div>
                                                    <span className="text-sm font-semibold text-neutral-800">{t.deliveryRate}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
