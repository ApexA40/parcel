import React, { useState } from "react";
import { Plus, Trash2, Package } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useStation } from "../../contexts/StationContext";

interface Shelf {
    id: string;
    name: string;
    parcelCount: number;
    createdBy: string;
    createdAt: string;
}

export const ShelfManagement = (): JSX.Element => {
    const { currentStation, userRole } = useStation();
    const [shelves, setShelves] = useState<Shelf[]>([
        { id: "SHELF-001", name: "A1", parcelCount: 5, createdBy: "Station Manager", createdAt: "2024-01-15" },
        { id: "SHELF-002", name: "A2", parcelCount: 3, createdBy: "Station Manager", createdAt: "2024-01-15" },
        { id: "SHELF-003", name: "B1", parcelCount: 8, createdBy: "Station Manager", createdAt: "2024-01-16" },
    ]);

    const [newShelfName, setNewShelfName] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAddShelf = () => {
        if (newShelfName.trim()) {
            const newShelf: Shelf = {
                id: `SHELF-${Date.now()}`,
                name: newShelfName,
                parcelCount: 0,
                createdBy: "Current User",
                createdAt: new Date().toISOString().split("T")[0],
            };
            setShelves([...shelves, newShelf]);
            setNewShelfName("");
            setShowAddForm(false);
        }
    };

    const canManageShelves = userRole === "station-manager" || userRole === "admin";

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">Shelf Management</h1>
                            <p className="text-sm text-[#5d5d5d] mt-1">
                                {currentStation?.name} - Manage parcel shelves
                            </p>
                        </div>
                        {canManageShelves && (
                            <Button
                                onClick={() => setShowAddForm(true)}
                                className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2"
                            >
                                <Plus size={20} />
                                Add Shelf
                            </Button>
                        )}
                    </div>

                    {/* Add Shelf Form */}
                    {showAddForm && canManageShelves && (
                        <Card className="border border-blue-200 bg-blue-50">
                            <CardContent className="p-6">
                                <div className="flex gap-3 items-end">
                                    <div className="flex-1">
                                        <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                            Shelf Name/Code
                                        </label>
                                        <Input
                                            value={newShelfName}
                                            onChange={(e) => setNewShelfName(e.target.value)}
                                            placeholder="e.g., A1, B2, Ground-Left"
                                            className="border border-[#d1d1d1]"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleAddShelf}
                                        disabled={!newShelfName.trim()}
                                        className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
                                    >
                                        Create
                                    </Button>
                                    <Button
                                        onClick={() => setShowAddForm(false)}
                                        variant="outline"
                                        className="border border-[#d1d1d1]"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Shelves Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {shelves.map((shelf) => (
                            <Card key={shelf.id} className="border border-[#d1d1d1] bg-white hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-orange-50 rounded-lg">
                                                <Package className="w-6 h-6 text-[#ea690c]" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-neutral-800">{shelf.name}</h3>
                                                <p className="text-xs text-[#5d5d5d]">Shelf ID: {shelf.id}</p>
                                            </div>
                                        </div>
                                        {canManageShelves && shelf.parcelCount === 0 && (
                                            <button className="text-[#e22420] hover:bg-red-50 p-2 rounded">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-[#5d5d5d]">Current Parcels</span>
                                            <span className="font-semibold text-neutral-800">{shelf.parcelCount}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-[#5d5d5d]">Created</span>
                                            <span className="text-xs text-neutral-700">{shelf.createdAt}</span>
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
