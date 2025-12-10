import React, { useState } from "react";
import { DollarSign, TrendingUp, BarChart3, PieChart as PieChartIcon, Calendar } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";

interface FinancialData {
    date: string;
    deliveryFees: number;
    itemCollections: number;
    driverPayments: number;
}

interface StationFinancial {
    station: string;
    deliveryFees: number;
    itemCollections: number;
    driverPayments: number;
    netRevenue: number;
}

const dailyData: FinancialData[] = [
    { date: "Jan 15", deliveryFees: 1250, itemCollections: 2340, driverPayments: 875 },
    { date: "Jan 16", deliveryFees: 1480, itemCollections: 2680, driverPayments: 1050 },
    { date: "Jan 17", deliveryFees: 1320, itemCollections: 2450, driverPayments: 920 },
    { date: "Jan 18", deliveryFees: 1650, itemCollections: 3120, driverPayments: 1180 },
    { date: "Jan 19", deliveryFees: 1520, itemCollections: 2890, driverPayments: 1080 },
    { date: "Jan 20", deliveryFees: 1780, itemCollections: 3340, driverPayments: 1260 },
];

const stationFinancials: StationFinancial[] = [
    {
        station: "Accra Central",
        deliveryFees: 5625,
        itemCollections: 8450,
        driverPayments: 3375,
        netRevenue: 10700,
    },
    {
        station: "Kumasi Hub",
        deliveryFees: 4000,
        itemCollections: 6200,
        driverPayments: 2400,
        netRevenue: 7800,
    },
    {
        station: "Tema Port",
        deliveryFees: 3500,
        itemCollections: 5100,
        driverPayments: 2100,
        netRevenue: 6500,
    },
    {
        station: "Takoradi West",
        deliveryFees: 2625,
        itemCollections: 3850,
        driverPayments: 1575,
        netRevenue: 4900,
    },
];

export const FinancialReports = (): JSX.Element => {
    const [dateRange, setDateRange] = useState({
        from: "2024-01-15",
        to: "2024-01-20",
    });

    const [reportType, setReportType] = useState<"daily" | "station">("daily");

    // Calculate summary metrics
    const totalDeliveryFees = dailyData.reduce((sum, d) => sum + d.deliveryFees, 0);
    const totalItemCollections = dailyData.reduce((sum, d) => sum + d.itemCollections, 0);
    const totalDriverPayments = dailyData.reduce((sum, d) => sum + d.driverPayments, 0);
    const netRevenue = totalDeliveryFees + totalItemCollections - totalDriverPayments;

    // Station summary
    const stationTotalFees = stationFinancials.reduce((sum, s) => sum + s.deliveryFees, 0);
    const stationTotalCollections = stationFinancials.reduce((sum, s) => sum + s.itemCollections, 0);
    const stationTotalPayments = stationFinancials.reduce((sum, s) => sum + s.driverPayments, 0);

    const maxDeliveryFees = Math.max(...dailyData.map((d) => d.deliveryFees));
    const maxItemCollections = Math.max(...dailyData.map((d) => d.itemCollections));

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-800">Financial Reports</h1>
                            <p className="text-sm text-[#5d5d5d] mt-1">
                                Comprehensive financial analytics and insights
                            </p>
                        </div>
                        <Button className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2">
                            <Calendar size={18} />
                            Export Report
                        </Button>
                    </div>

                    {/* Report Type Selection */}
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setReportType("daily")}
                            className={`flex items-center gap-2 ${reportType === "daily"
                                ? "bg-[#ea690c] text-white"
                                : "border border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
                                }`}
                        >
                            <BarChart3 size={18} />
                            Daily Report
                        </Button>
                        <Button
                            onClick={() => setReportType("station")}
                            className={`flex items-center gap-2 ${reportType === "station"
                                ? "bg-[#ea690c] text-white"
                                : "border border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
                                }`}
                        >
                            <PieChartIcon size={18} />
                            Station Report
                        </Button>
                    </div>

                    {/* Date Range Filter */}
                    {reportType === "daily" && (
                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                            From Date
                                        </label>
                                        <Input
                                            type="date"
                                            value={dateRange.from}
                                            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                            className="border border-[#d1d1d1]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                            To Date
                                        </label>
                                        <Input
                                            type="date"
                                            value={dateRange.to}
                                            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                            className="border border-[#d1d1d1]"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {reportType === "daily" ? (
                        <>
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="border border-[#d1d1d1] bg-white">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col gap-2">
                                            <p className="text-sm text-[#5d5d5d]">Total Delivery Fees</p>
                                            <h3 className="text-2xl font-bold text-neutral-800">
                                                GHC {totalDeliveryFees.toLocaleString()}
                                            </h3>
                                            <p className="text-xs text-green-600 font-semibold">
                                                +{((totalDeliveryFees / (totalDeliveryFees + totalItemCollections)) * 100).toFixed(1)}% of total
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-[#d1d1d1] bg-white">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col gap-2">
                                            <p className="text-sm text-[#5d5d5d]">Item Collections</p>
                                            <h3 className="text-2xl font-bold text-neutral-800">
                                                GHC {totalItemCollections.toLocaleString()}
                                            </h3>
                                            <p className="text-xs text-green-600 font-semibold">
                                                +{((totalItemCollections / (totalDeliveryFees + totalItemCollections)) * 100).toFixed(1)}% of total
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-[#d1d1d1] bg-white">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col gap-2">
                                            <p className="text-sm text-[#5d5d5d]">Driver Payments</p>
                                            <h3 className="text-2xl font-bold text-neutral-800">
                                                GHC {totalDriverPayments.toLocaleString()}
                                            </h3>
                                            <p className="text-xs text-red-600 font-semibold">
                                                -{((totalDriverPayments / (totalDeliveryFees + totalItemCollections)) * 100).toFixed(1)}% of total
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-[#d1d1d1] bg-white">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col gap-2">
                                            <p className="text-sm text-[#5d5d5d]">Net Revenue</p>
                                            <h3 className="text-2xl font-bold text-[#ea690c]">
                                                GHC {netRevenue.toLocaleString()}
                                            </h3>
                                            <p className="text-xs text-neutral-600 font-semibold">
                                                {((netRevenue / (totalDeliveryFees + totalItemCollections)) * 100).toFixed(1)}% margin
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Daily Breakdown Chart */}
                            <Card className="border border-[#d1d1d1] bg-white">
                                <CardContent className="p-6">
                                    <h2 className="text-lg font-bold text-neutral-800 mb-6">Daily Revenue Breakdown</h2>
                                    <div className="space-y-4">
                                        {dailyData.map((day, idx) => (
                                            <div key={idx} className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-neutral-800">{day.date}</span>
                                                    <span className="text-sm font-bold text-neutral-800">
                                                        GHC {(day.deliveryFees + day.itemCollections - day.driverPayments).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex gap-1 h-8">
                                                    {/* Delivery Fees Bar */}
                                                    <div
                                                        className="bg-[#ea690c] rounded-l"
                                                        style={{
                                                            width: `${(day.deliveryFees / (maxDeliveryFees + maxItemCollections)) * 100}%`,
                                                        }}
                                                        title={`Delivery Fees: GHC ${day.deliveryFees}`}
                                                    />
                                                    {/* Item Collections Bar */}
                                                    <div
                                                        className="bg-blue-500 rounded-r"
                                                        style={{
                                                            width: `${(day.itemCollections / (maxDeliveryFees + maxItemCollections)) * 100}%`,
                                                        }}
                                                        title={`Item Collections: GHC ${day.itemCollections}`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 flex gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-[#ea690c] rounded" />
                                            <span className="text-neutral-700">Delivery Fees</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded" />
                                            <span className="text-neutral-700">Item Collections</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Daily Table */}
                            <Card className="border border-[#d1d1d1] bg-white">
                                <CardContent className="p-6">
                                    <h2 className="text-lg font-bold text-neutral-800 mb-4">Daily Details</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-[#d1d1d1]">
                                                    <th className="text-left py-3 px-4 font-semibold text-[#5d5d5d]">Date</th>
                                                    <th className="text-right py-3 px-4 font-semibold text-[#5d5d5d]">
                                                        Delivery Fees
                                                    </th>
                                                    <th className="text-right py-3 px-4 font-semibold text-[#5d5d5d]">
                                                        Item Collections
                                                    </th>
                                                    <th className="text-right py-3 px-4 font-semibold text-[#5d5d5d]">
                                                        Driver Payments
                                                    </th>
                                                    <th className="text-right py-3 px-4 font-semibold text-[#5d5d5d]">
                                                        Net Revenue
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dailyData.map((day, idx) => {
                                                    const netDay = day.deliveryFees + day.itemCollections - day.driverPayments;
                                                    return (
                                                        <tr key={idx} className="border-b border-[#d1d1d1] hover:bg-gray-50">
                                                            <td className="py-3 px-4 font-medium text-neutral-800">{day.date}</td>
                                                            <td className="py-3 px-4 text-right text-neutral-700">
                                                                GHC {day.deliveryFees.toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4 text-right text-neutral-700">
                                                                GHC {day.itemCollections.toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4 text-right text-neutral-700">
                                                                GHC {day.driverPayments.toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-semibold text-[#ea690c]">
                                                                GHC {netDay.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <>
                            {/* Station Summary Metrics */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <Card className="border border-[#d1d1d1] bg-white">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col gap-2">
                                            <p className="text-sm text-[#5d5d5d]">Total Delivery Fees</p>
                                            <h3 className="text-2xl font-bold text-neutral-800">
                                                GHC {stationTotalFees.toLocaleString()}
                                            </h3>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-[#d1d1d1] bg-white">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col gap-2">
                                            <p className="text-sm text-[#5d5d5d]">Total Collections</p>
                                            <h3 className="text-2xl font-bold text-neutral-800">
                                                GHC {stationTotalCollections.toLocaleString()}
                                            </h3>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-[#d1d1d1] bg-white">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col gap-2">
                                            <p className="text-sm text-[#5d5d5d]">Total Driver Payments</p>
                                            <h3 className="text-2xl font-bold text-neutral-800">
                                                GHC {stationTotalPayments.toLocaleString()}
                                            </h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Station Pie Chart */}
                            <Card className="border border-[#d1d1d1] bg-white">
                                <CardContent className="p-6">
                                    <h2 className="text-lg font-bold text-neutral-800 mb-6">Revenue Distribution by Station</h2>
                                    <div className="space-y-4">
                                        {stationFinancials.map((station, idx) => {
                                            const percentage = (station.netRevenue / stationFinancials.reduce((sum, s) => sum + s.netRevenue, 0)) * 100;
                                            return (
                                                <div key={idx} className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-semibold text-neutral-800">{station.station}</span>
                                                        <span className="text-sm font-bold text-neutral-800">
                                                            {percentage.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#ea690c] rounded-full transition-all"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-xs text-[#5d5d5d]">
                                                        Net Revenue: GHC {station.netRevenue.toLocaleString()}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Station Detailed Table */}
                            <Card className="border border-[#d1d1d1] bg-white">
                                <CardContent className="p-6">
                                    <h2 className="text-lg font-bold text-neutral-800 mb-4">Station Financial Breakdown</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-[#d1d1d1]">
                                                    <th className="text-left py-3 px-4 font-semibold text-[#5d5d5d]">Station</th>
                                                    <th className="text-right py-3 px-4 font-semibold text-[#5d5d5d]">
                                                        Delivery Fees
                                                    </th>
                                                    <th className="text-right py-3 px-4 font-semibold text-[#5d5d5d]">
                                                        Item Collections
                                                    </th>
                                                    <th className="text-right py-3 px-4 font-semibold text-[#5d5d5d]">
                                                        Driver Payments
                                                    </th>
                                                    <th className="text-right py-3 px-4 font-semibold text-[#5d5d5d]">
                                                        Net Revenue
                                                    </th>
                                                    <th className="text-right py-3 px-4 font-semibold text-[#5d5d5d]">
                                                        Margin %
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stationFinancials.map((station, idx) => {
                                                    const total = station.deliveryFees + station.itemCollections;
                                                    const margin = ((station.netRevenue / total) * 100).toFixed(1);
                                                    return (
                                                        <tr key={idx} className="border-b border-[#d1d1d1] hover:bg-gray-50">
                                                            <td className="py-3 px-4 font-medium text-neutral-800">{station.station}</td>
                                                            <td className="py-3 px-4 text-right text-neutral-700">
                                                                GHC {station.deliveryFees.toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4 text-right text-neutral-700">
                                                                GHC {station.itemCollections.toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4 text-right text-neutral-700">
                                                                GHC {station.driverPayments.toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-semibold text-[#ea690c]">
                                                                GHC {station.netRevenue.toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4 text-right">
                                                                <Badge className="bg-green-100 text-green-800">{margin}%</Badge>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};
