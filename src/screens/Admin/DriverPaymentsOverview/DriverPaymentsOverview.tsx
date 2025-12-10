import React, { useState } from "react";
import { TrendingUp, Users, DollarSign, CheckCircle } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";

interface Driver {
    id: string;
    name: string;
    station: string;
    completedDeliveries: number;
    totalEarned: number;
    amountPaid: number;
    outstandingBalance: number;
    paymentStatus: "paid" | "partial" | "pending";
    lastPaymentDate: string;
    rating: number;
}

const drivers: Driver[] = [
    {
        id: "DRV-001",
        name: "John Mensah",
        station: "Accra Central",
        completedDeliveries: 24,
        totalEarned: 1200.00,
        amountPaid: 1200.00,
        outstandingBalance: 0.00,
        paymentStatus: "paid",
        lastPaymentDate: "2024-01-18",
        rating: 4.8,
    },
    {
        id: "DRV-002",
        name: "Kwame Asante",
        station: "Kumasi Hub",
        completedDeliveries: 18,
        totalEarned: 950.00,
        amountPaid: 650.00,
        outstandingBalance: 300.00,
        paymentStatus: "partial",
        lastPaymentDate: "2024-01-15",
        rating: 4.9,
    },
    {
        id: "DRV-003",
        name: "Ama Kofi",
        station: "Tema Port",
        completedDeliveries: 15,
        totalEarned: 850.00,
        amountPaid: 0.00,
        outstandingBalance: 850.00,
        paymentStatus: "pending",
        lastPaymentDate: "—",
        rating: 4.7,
    },
    {
        id: "DRV-004",
        name: "Kofi Boateng",
        station: "Accra Central",
        completedDeliveries: 20,
        totalEarned: 1100.00,
        amountPaid: 1100.00,
        outstandingBalance: 0.00,
        paymentStatus: "paid",
        lastPaymentDate: "2024-01-19",
        rating: 4.6,
    },
];

const paymentStatusConfig = {
    paid: {
        label: "Paid",
        color: "bg-green-100 text-green-800",
        icon: "✓",
    },
    partial: {
        label: "Partial",
        color: "bg-yellow-100 text-yellow-800",
        icon: "◐",
    },
    pending: {
        label: "Pending",
        color: "bg-red-100 text-red-800",
        icon: "!",
    },
};

export const DriverPaymentsOverview = (): JSX.Element => {
    const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "partial" | "pending">("all");
    const [sortBy, setSortBy] = useState<"earnings" | "deliveries" | "outstanding">("earnings");

    // Calculate summary
    const totalEarned = drivers.reduce((sum, d) => sum + d.totalEarned, 0);
    const totalPaid = drivers.reduce((sum, d) => sum + d.amountPaid, 0);
    const totalOutstanding = drivers.reduce((sum, d) => sum + d.outstandingBalance, 0);
    const totalDeliveries = drivers.reduce((sum, d) => sum + d.completedDeliveries, 0);

    // Filter drivers
    const filteredDrivers =
        filterStatus === "all" ? drivers : drivers.filter((d) => d.paymentStatus === filterStatus);

    // Sort drivers
    const sortedDrivers = [...filteredDrivers].sort((a, b) => {
        if (sortBy === "earnings") return b.totalEarned - a.totalEarned;
        if (sortBy === "deliveries") return b.completedDeliveries - a.completedDeliveries;
        return b.outstandingBalance - a.outstandingBalance;
    });

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-800">Driver Payments Overview</h1>
                            <p className="text-sm text-[#5d5d5d] mt-1">
                                Track rider earnings and payment status
                            </p>
                        </div>
                        <Button className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90">
                            Process Payments
                        </Button>
                    </div>

                    {/* Summary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Total Deliveries</p>
                                        <h3 className="text-3xl font-bold text-neutral-800">{totalDeliveries}</h3>
                                    </div>
                                    <Users className="w-12 h-12 text-blue-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Total Earned</p>
                                        <h3 className="text-3xl font-bold text-neutral-800">
                                            GHC {totalEarned.toFixed(2)}
                                        </h3>
                                    </div>
                                    <DollarSign className="w-12 h-12 text-green-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Amount Paid</p>
                                        <h3 className="text-3xl font-bold text-neutral-800">
                                            GHC {totalPaid.toFixed(2)}
                                        </h3>
                                    </div>
                                    <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Outstanding</p>
                                        <h3 className="text-3xl font-bold text-[#e22420]">
                                            GHC {totalOutstanding.toFixed(2)}
                                        </h3>
                                    </div>
                                    <TrendingUp className="w-12 h-12 text-orange-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters and Sort */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Filter by Status
                                    </label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as any)}
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                    >
                                        <option value="all">All Drivers</option>
                                        <option value="paid">Paid</option>
                                        <option value="partial">Partial</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Sort By
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                    >
                                        <option value="earnings">Highest Earnings</option>
                                        <option value="deliveries">Most Deliveries</option>
                                        <option value="outstanding">Outstanding Balance</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Drivers Table */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#d1d1d1]">
                                            <th className="text-left py-3 px-4 font-semibold text-[#5d5d5d]">Driver</th>
                                            <th className="text-left py-3 px-4 font-semibold text-[#5d5d5d]">Station</th>
                                            <th className="text-right py-3 px-4 font-semibold text-[#5d5d5d]">
                                                Deliveries
                                            </th>
                                            <th className="text-right py-3 px-4 font-semibold text-[#5d5d5d]">
                                                Total Earned
                                            </th>
                                            <th className="text-right py-3 px-4 font-semibold text-[#5d5d5d]">
                                                Amount Paid
                                            </th>
                                            <th className="text-right py-3 px-4 font-semibold text-[#5d5d5d]">
                                                Outstanding
                                            </th>
                                            <th className="text-left py-3 px-4 font-semibold text-[#5d5d5d]">Status</th>
                                            <th className="text-center py-3 px-4 font-semibold text-[#5d5d5d]">Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedDrivers.map((driver) => {
                                            const config = paymentStatusConfig[driver.paymentStatus];
                                            return (
                                                <tr key={driver.id} className="border-b border-[#d1d1d1] hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-neutral-800">{driver.name}</span>
                                                            <span className="text-xs text-[#5d5d5d]">{driver.id}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-neutral-700">{driver.station}</td>
                                                    <td className="py-3 px-4 text-right text-neutral-700">
                                                        {driver.completedDeliveries}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-semibold text-[#ea690c]">
                                                        GHC {driver.totalEarned.toFixed(2)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-neutral-700">
                                                        GHC {driver.amountPaid.toFixed(2)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className={`font-semibold ${driver.outstandingBalance > 0 ? "text-[#e22420]" : "text-green-600"}`}>
                                                            GHC {driver.outstandingBalance.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge className={config.color}>{config.label}</Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-semibold text-neutral-800">
                                                        ⭐ {driver.rating}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Distribution Chart */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-bold text-neutral-800 mb-6">Payment Status Distribution</h2>
                            <div className="space-y-4">
                                {[
                                    { status: "Paid", count: drivers.filter((d) => d.paymentStatus === "paid").length, color: "bg-green-500" },
                                    { status: "Partial", count: drivers.filter((d) => d.paymentStatus === "partial").length, color: "bg-yellow-500" },
                                    { status: "Pending", count: drivers.filter((d) => d.paymentStatus === "pending").length, color: "bg-red-500" },
                                ].map((item, idx) => {
                                    const percentage = (item.count / drivers.length) * 100;
                                    return (
                                        <div key={idx} className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-neutral-800">
                                                    {item.status} ({item.count})
                                                </span>
                                                <span className="text-sm font-bold text-neutral-800">{percentage.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
};
