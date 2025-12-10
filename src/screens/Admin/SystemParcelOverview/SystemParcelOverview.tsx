import React, { useState } from "react";
import { Download, Eye } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";

interface Parcel {
    id: string;
    station: string;
    recipientName: string;
    phoneNumber: string;
    status: string;
    shelfLocation: string;
    riderName?: string;
    deliveryType: string;
    registeredDate: string;
}

const mockParcels: Parcel[] = [
    {
        id: "PAK-001",
        station: "Accra Central",
        recipientName: "John Smith",
        phoneNumber: "+233 555 123 456",
        status: "delivered",
        shelfLocation: "A1",
        riderName: "Kwame Asante",
        deliveryType: "Home Delivery",
        registeredDate: "2024-01-15",
    },
    {
        id: "PAK-002",
        station: "Kumasi Hub",
        recipientName: "Jane Doe",
        phoneNumber: "+233 555 234 567",
        status: "out-for-delivery",
        shelfLocation: "B2",
        riderName: "Ama Mensah",
        deliveryType: "Home Delivery",
        registeredDate: "2024-01-16",
    },
    {
        id: "PAK-003",
        station: "Tema Port",
        recipientName: "Bob Wilson",
        phoneNumber: "+233 555 345 678",
        status: "ready-for-delivery",
        shelfLocation: "C1",
        deliveryType: "Pickup",
        registeredDate: "2024-01-17",
    },
];

const statusColors: Record<string, string> = {
    registered: "bg-gray-100 text-gray-800",
    contacted: "bg-blue-100 text-blue-800",
    "ready-for-delivery": "bg-yellow-100 text-yellow-800",
    assigned: "bg-purple-100 text-purple-800",
    "out-for-delivery": "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
};

export const SystemParcelOverview = (): JSX.Element => {
    const [parcels, setParcels] = useState<Parcel[]>(mockParcels);
    const [filters, setFilters] = useState({
        station: "",
        status: "",
        dateFrom: "",
        dateTo: "",
    });

    const filteredParcels = parcels.filter((parcel) => {
        if (filters.station && parcel.station !== filters.station) return false;
        if (filters.status && parcel.status !== filters.status) return false;
        if (filters.dateFrom && new Date(parcel.registeredDate) < new Date(filters.dateFrom))
            return false;
        if (filters.dateTo && new Date(parcel.registeredDate) > new Date(filters.dateTo))
            return false;
        return true;
    });

    const stations = [...new Set(parcels.map((p) => p.station))];
    const statuses = [...new Set(parcels.map((p) => p.status))];

    const handleExport = () => {
        const headers = [
            "Parcel ID",
            "Station",
            "Recipient",
            "Phone",
            "Status",
            "Shelf",
            "Rider",
            "Delivery Type",
            "Date Registered",
        ];
        const rows = filteredParcels.map((p) => [
            p.id,
            p.station,
            p.recipientName,
            p.phoneNumber,
            p.status,
            p.shelfLocation,
            p.riderName || "N/A",
            p.deliveryType,
            p.registeredDate,
        ]);

        const csv = [
            headers.join(","),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `parcels-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-800">
                                System Parcel Overview
                            </h1>
                            <p className="text-sm text-[#5d5d5d] mt-1">
                                Global visibility of all parcels across all stations
                            </p>
                        </div>
                        <Button
                            onClick={handleExport}
                            className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2"
                        >
                            <Download size={18} />
                            Export
                        </Button>
                    </div>

                    {/* Filters */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Station
                                    </label>
                                    <select
                                        value={filters.station}
                                        onChange={(e) => setFilters({ ...filters, station: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                    >
                                        <option value="">All Stations</option>
                                        {stations.map((station) => (
                                            <option key={station} value={station}>
                                                {station}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                    >
                                        <option value="">All Status</option>
                                        {statuses.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        From Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                        className="border border-[#d1d1d1]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        To Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                        className="border border-[#d1d1d1]"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Parcels Table */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#d1d1d1]">
                                            <th className="text-left py-3 px-4 font-semibold text-[#5d5d5d]">
                                                Parcel ID
                                            </th>
                                            <th className="text-left py-3 px-4 font-semibold text-[#5d5d5d]">
                                                Station
                                            </th>
                                            <th className="text-left py-3 px-4 font-semibold text-[#5d5d5d]">
                                                Recipient
                                            </th>
                                            <th className="text-left py-3 px-4 font-semibold text-[#5d5d5d]">
                                                Phone
                                            </th>
                                            <th className="text-left py-3 px-4 font-semibold text-[#5d5d5d]">
                                                Status
                                            </th>
                                            <th className="text-left py-3 px-4 font-semibold text-[#5d5d5d]">
                                                Rider
                                            </th>
                                            <th className="text-left py-3 px-4 font-semibold text-[#5d5d5d]">
                                                Type
                                            </th>
                                            <th className="text-left py-3 px-4 font-semibold text-[#5d5d5d]">
                                                Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredParcels.map((parcel) => (
                                            <tr key={parcel.id} className="border-b border-[#d1d1d1] hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium text-neutral-800">{parcel.id}</td>
                                                <td className="py-3 px-4 text-neutral-700">{parcel.station}</td>
                                                <td className="py-3 px-4 text-neutral-700">{parcel.recipientName}</td>
                                                <td className="py-3 px-4 text-neutral-700">{parcel.phoneNumber}</td>
                                                <td className="py-3 px-4">
                                                    <Badge className={statusColors[parcel.status] || ""}>
                                                        {parcel.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-neutral-700">
                                                    {parcel.riderName || "—"}
                                                </td>
                                                <td className="py-3 px-4 text-neutral-700">{parcel.deliveryType}</td>
                                                <td className="py-3 px-4 text-neutral-700">{parcel.registeredDate}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredParcels.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-neutral-700">No parcels found matching filters</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <div className="text-sm text-[#5d5d5d]">
                        Showing {filteredParcels.length} of {parcels.length} parcels
                    </div>
                </main>
            </div>
        </div>
    );
};
