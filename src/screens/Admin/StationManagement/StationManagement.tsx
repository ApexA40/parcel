import React, { useState } from "react";
import { Plus, Edit, Trash2, MapPin, Users, CheckCircle } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";

interface Station {
    id: string;
    name: string;
    code: string;
    location: string;
    usersCount: number;
    status: "active" | "inactive";
    createdDate: string;
}

export const StationManagement = (): JSX.Element => {
    const [stations, setStations] = useState<Station[]>([
        {
            id: "STATION-001",
            name: "Accra Central",
            code: "ACC-001",
            location: "Accra",
            usersCount: 6,
            status: "active",
            createdDate: "2024-01-01",
        },
        {
            id: "STATION-002",
            name: "Kumasi Hub",
            code: "KUM-001",
            location: "Kumasi",
            usersCount: 4,
            status: "active",
            createdDate: "2024-01-05",
        },
        {
            id: "STATION-003",
            name: "Tema Port",
            code: "TEM-001",
            location: "Tema",
            usersCount: 5,
            status: "active",
            createdDate: "2024-01-10",
        },
    ]);

    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedStation, setSelectedStation] = useState<Station | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        location: "",
    });

    const handleAddStation = () => {
        if (formData.name.trim() && formData.location.trim()) {
            const newStation: Station = {
                id: `STATION-${Date.now()}`,
                name: formData.name,
                code: `${formData.name.substring(0, 3).toUpperCase()}-${stations.length + 1}`,
                location: formData.location,
                usersCount: 0,
                status: "active",
                createdDate: new Date().toISOString().split("T")[0],
            };
            setStations([...stations, newStation]);
            setFormData({ name: "", location: "" });
            setShowAddForm(false);
        }
    };

    const toggleStationStatus = (id: string) => {
        setStations(
            stations.map((station) =>
                station.id === id
                    ? { ...station, status: station.status === "active" ? "inactive" : "active" }
                    : station
            )
        );
    };

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-800">Station Management</h1>
                            <p className="text-sm text-[#5d5d5d] mt-1">
                                Create and manage all delivery stations
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowAddForm(true)}
                            className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            New Station
                        </Button>
                    </div>

                    {/* Add Station Form */}
                    {showAddForm && (
                        <Card className="border border-blue-200 bg-blue-50">
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-neutral-800 mb-4">Create New Station</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                            Station Name <span className="text-[#e22420]">*</span>
                                        </label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Accra Central"
                                            className="border border-[#d1d1d1]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                            Location <span className="text-[#e22420]">*</span>
                                        </label>
                                        <Input
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="e.g., Accra, Ghana"
                                            className="border border-[#d1d1d1]"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleAddStation}
                                            disabled={!formData.name.trim() || !formData.location.trim()}
                                            className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50"
                                        >
                                            Create Station
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setShowAddForm(false);
                                                setFormData({ name: "", location: "" });
                                            }}
                                            variant="outline"
                                            className="flex-1 border border-[#d1d1d1]"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Stations Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stations.map((station) => (
                            <Card
                                key={station.id}
                                className={`border-2 transition-all cursor-pointer ${selectedStation?.id === station.id
                                    ? "border-[#ea690c] bg-orange-50"
                                    : "border-[#d1d1d1] hover:border-[#ea690c]"
                                    }`}
                                onClick={() =>
                                    setSelectedStation(selectedStation?.id === station.id ? null : station)
                                }
                            >
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-bold text-lg text-neutral-800">{station.name}</h3>
                                                <p className="text-xs text-[#5d5d5d]">{station.code}</p>
                                            </div>
                                            <Badge
                                                className={
                                                    station.status === "active"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                }
                                            >
                                                {station.status === "active" ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>

                                        {/* Location */}
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-[#5d5d5d]" />
                                            <span className="text-sm text-neutral-700">{station.location}</span>
                                        </div>

                                        {/* Users */}
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-[#5d5d5d]" />
                                            <span className="text-sm text-neutral-700">
                                                {station.usersCount} users assigned
                                            </span>
                                        </div>

                                        {/* Created Date */}
                                        <div className="text-xs text-[#5d5d5d]">
                                            Created: {new Date(station.createdDate).toLocaleDateString()}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                onClick={() => toggleStationStatus(station.id)}
                                                variant="outline"
                                                className="flex-1 text-sm border border-[#d1d1d1]"
                                            >
                                                {station.status === "active" ? "Deactivate" : "Activate"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1 text-sm border border-[#d1d1d1]"
                                            >
                                                <Edit size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};
