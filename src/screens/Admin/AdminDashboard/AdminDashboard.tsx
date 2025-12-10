import React from "react";
import { Building2, Package, DollarSign, TrendingUp, Users, MapPin } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";

interface SystemMetrics {
    totalStations: number;
    totalParcels: number;
    totalDeliveryEarnings: number;
    totalDriverPayments: number;
    deliverySuccessRate: number;
    activeUsers: number;
}

interface StationPerformance {
    stationId: string;
    stationName: string;
    totalParcels: number;
    deliveryEarnings: number;
    driverPaymentsOwed: number;
    successRate: number;
}

export const AdminDashboard = (): JSX.Element => {
    // Mock data - replace with API calls
    const systemMetrics: SystemMetrics = {
        totalStations: 5,
        totalParcels: 1245,
        totalDeliveryEarnings: 15750.50,
        totalDriverPayments: 9450.75,
        deliverySuccessRate: 94.2,
        activeUsers: 28,
    };

    const stationPerformance: StationPerformance[] = [
        {
            stationId: "STATION-001",
            stationName: "Accra Central",
            totalParcels: 450,
            deliveryEarnings: 5625.00,
            driverPaymentsOwed: 3375.00,
            successRate: 96.5,
        },
        {
            stationId: "STATION-002",
            stationName: "Kumasi Hub",
            totalParcels: 320,
            deliveryEarnings: 4000.00,
            driverPaymentsOwed: 2400.00,
            successRate: 92.3,
        },
        {
            stationId: "STATION-003",
            stationName: "Tema Port",
            totalParcels: 280,
            deliveryEarnings: 3500.00,
            driverPaymentsOwed: 2100.00,
            successRate: 94.1,
        },
        {
            stationId: "STATION-004",
            stationName: "Takoradi West",
            totalParcels: 195,
            deliveryEarnings: 2625.00,
            driverPaymentsOwed: 1575.00,
            successRate: 91.8,
        },
    ];

    const parcelsByStatus = [
        { status: "Registered", count: 120, color: "bg-gray-100" },
        { status: "Contacted", count: 85, color: "bg-blue-100" },
        { status: "Ready for Delivery", count: 145, color: "bg-yellow-100" },
        { status: "Out for Delivery", count: 210, color: "bg-indigo-100" },
        { status: "Delivered", count: 680, color: "bg-green-100" },
        { status: "Failed", count: 25, color: "bg-red-100" },
    ];

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-800">Admin Dashboard</h1>
                            <p className="text-sm text-[#5d5d5d] mt-1">
                                System-wide overview and analytics
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90">
                                Create Station
                            </Button>
                            <Button variant="outline" className="border border-[#d1d1d1]">
                                Create User
                            </Button>
                        </div>
                    </div>

                    {/* System Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Total Stations</p>
                                        <h3 className="text-3xl font-bold text-neutral-800">
                                            {systemMetrics.totalStations}
                                        </h3>
                                    </div>
                                    <Building2 className="w-12 h-12 text-[#ea690c] opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Total Parcels</p>
                                        <h3 className="text-3xl font-bold text-neutral-800">
                                            {systemMetrics.totalParcels.toLocaleString()}
                                        </h3>
                                    </div>
                                    <Package className="w-12 h-12 text-blue-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Delivery Earnings</p>
                                        <h3 className="text-3xl font-bold text-neutral-800">
                                            GHC {systemMetrics.totalDeliveryEarnings.toFixed(2)}
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
                                        <p className="text-sm text-[#5d5d5d]">Driver Payments Owed</p>
                                        <h3 className="text-3xl font-bold text-neutral-800">
                                            GHC {systemMetrics.totalDriverPayments.toFixed(2)}
                                        </h3>
                                    </div>
                                    <TrendingUp className="w-12 h-12 text-orange-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Success Rate</p>
                                        <h3 className="text-3xl font-bold text-neutral-800">
                                            {systemMetrics.deliverySuccessRate}%
                                        </h3>
                                    </div>
                                    <TrendingUp className="w-12 h-12 text-[#ea690c] opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Active Users</p>
                                        <h3 className="text-3xl font-bold text-neutral-800">
                                            {systemMetrics.activeUsers}
                                        </h3>
                                    </div>
                                    <Users className="w-12 h-12 text-purple-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Parcels by Status */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-bold text-neutral-800 mb-4">Parcels by Status</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {parcelsByStatus.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg border border-[#d1d1d1] ${item.color}`}
                                    >
                                        <p className="text-sm font-semibold text-neutral-800">{item.status}</p>
                                        <p className="text-2xl font-bold text-neutral-800 mt-2">{item.count}</p>
                                        <p className="text-xs text-[#5d5d5d] mt-1">
                                            {((item.count / systemMetrics.totalParcels) * 100).toFixed(1)}% of total
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Station Performance */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-bold text-neutral-800 mb-4">Station Performance</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[#d1d1d1]">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Station
                                            </th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Parcels
                                            </th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Earnings
                                            </th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Owed to Drivers
                                            </th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Success Rate
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stationPerformance.map((station) => (
                                            <tr
                                                key={station.stationId}
                                                className="border-b border-[#d1d1d1] hover:bg-gray-50"
                                            >
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-[#5d5d5d]" />
                                                        <span className="text-sm font-medium text-neutral-800">
                                                            {station.stationName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-right text-sm text-neutral-700">
                                                    {station.totalParcels}
                                                </td>
                                                <td className="py-4 px-4 text-right text-sm font-semibold text-[#ea690c]">
                                                    GHC {station.deliveryEarnings.toFixed(2)}
                                                </td>
                                                <td className="py-4 px-4 text-right text-sm font-semibold text-neutral-800">
                                                    GHC {station.driverPaymentsOwed.toFixed(2)}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className="text-sm font-semibold text-green-600">
                                                        {station.successRate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
};
