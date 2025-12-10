import React, { useState, useMemo } from "react";
import { SearchIcon, FilterIcon, Download, MapPin, PhoneIcon, Clock, DollarSign, X } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";

interface Parcel {
    id: string;
    recipientName: string;
    phoneNumber: string;
    address: string;
    shelfLocation: string;
    itemDescription: string;
    itemValue: number;
    status: "registered" | "contacted" | "ready-for-delivery" | "assigned" | "picked-up" | "out-for-delivery" | "delivered";
    registeredDate: string;
    driverName?: string;
}

const mockParcels: Parcel[] = [
    {
        id: "PAK-001",
        recipientName: "John Smith",
        phoneNumber: "+233 555 123 456",
        address: "45 Main Street, Accra",
        shelfLocation: "A1",
        itemDescription: "Electronics Package",
        itemValue: 500,
        status: "delivered",
        registeredDate: "2024-01-15",
        driverName: "Kwame Asante",
    },
    {
        id: "PAK-002",
        recipientName: "Jane Doe",
        phoneNumber: "+233 555 234 567",
        address: "78 Market Circle, Kumasi",
        shelfLocation: "B2",
        itemDescription: "Documents",
        itemValue: 0,
        status: "out-for-delivery",
        registeredDate: "2024-01-16",
        driverName: "Ama Mensah",
    },
    {
        id: "PAK-003",
        recipientName: "Bob Wilson",
        phoneNumber: "+233 555 345 678",
        address: "12 Airport Road, Tema",
        shelfLocation: "C1",
        itemDescription: "Clothing",
        itemValue: 150,
        status: "ready-for-delivery",
        registeredDate: "2024-01-17",
    },
    {
        id: "PAK-004",
        recipientName: "Alice Johnson",
        phoneNumber: "+233 555 456 789",
        address: "56 High Street, Takoradi",
        shelfLocation: "A2",
        itemDescription: "Books",
        itemValue: 75,
        status: "contacted",
        registeredDate: "2024-01-18",
    },
    {
        id: "PAK-005",
        recipientName: "Charlie Brown",
        phoneNumber: "+233 555 567 890",
        address: "90 Independence Ave, Accra",
        shelfLocation: "B1",
        itemDescription: "Food Items",
        itemValue: 200,
        status: "registered",
        registeredDate: "2024-01-19",
    },
    {
        id: "PAK-006",
        recipientName: "Diana Prince",
        phoneNumber: "+233 555 678 901",
        address: "34 Tower Road, Cape Coast",
        shelfLocation: "C2",
        itemDescription: "Cosmetics",
        itemValue: 120,
        status: "assigned",
        registeredDate: "2024-01-20",
        driverName: "Kofi Boateng",
    },
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    registered: { label: "Registered", color: "bg-gray-100 text-gray-800", bgColor: "bg-gray-50" },
    contacted: { label: "Contacted", color: "bg-blue-100 text-blue-800", bgColor: "bg-blue-50" },
    "ready-for-delivery": { label: "Ready for Delivery", color: "bg-yellow-100 text-yellow-800", bgColor: "bg-yellow-50" },
    assigned: { label: "Assigned", color: "bg-purple-100 text-purple-800", bgColor: "bg-purple-50" },
    "picked-up": { label: "Picked Up", color: "bg-orange-100 text-orange-800", bgColor: "bg-orange-50" },
    "out-for-delivery": { label: "Out for Delivery", color: "bg-indigo-100 text-indigo-800", bgColor: "bg-indigo-50" },
    delivered: { label: "Delivered", color: "bg-green-100 text-green-800", bgColor: "bg-green-50" },
};

export const ParcelSearch = (): JSX.Element => {
    const [parcels] = useState<Parcel[]>(mockParcels);
    const [searchParams, setSearchParams] = useState({
        recipientName: "",
        phoneNumber: "",
        parcelId: "",
        status: "",
        startDate: "",
        endDate: "",
        shelfLocation: "",
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);

    // Filter parcels based on search parameters
    const filteredParcels = useMemo(() => {
        return parcels.filter((parcel) => {
            const matchesName = parcel.recipientName
                .toLowerCase()
                .includes(searchParams.recipientName.toLowerCase());
            const matchesPhone = parcel.phoneNumber.includes(
                searchParams.phoneNumber.replace(/\s/g, "")
            );
            const matchesId = parcel.id
                .toLowerCase()
                .includes(searchParams.parcelId.toLowerCase());
            const matchesStatus =
                !searchParams.status || parcel.status === searchParams.status;
            const matchesShelf =
                !searchParams.shelfLocation ||
                parcel.shelfLocation === searchParams.shelfLocation;

            // Date range filtering
            const parcelDate = new Date(parcel.registeredDate);
            const matchesStartDate =
                !searchParams.startDate ||
                parcelDate >= new Date(searchParams.startDate);
            const matchesEndDate =
                !searchParams.endDate || parcelDate <= new Date(searchParams.endDate);

            return (
                matchesName &&
                matchesPhone &&
                matchesId &&
                matchesStatus &&
                matchesShelf &&
                matchesStartDate &&
                matchesEndDate
            );
        });
    }, [parcels, searchParams]);

    const handleClearFilters = () => {
        setSearchParams({
            recipientName: "",
            phoneNumber: "",
            parcelId: "",
            status: "",
            startDate: "",
            endDate: "",
            shelfLocation: "",
        });
    };

    const handleExport = () => {
        // Simple CSV export
        const headers = [
            "Parcel ID",
            "Recipient Name",
            "Phone",
            "Address",
            "Shelf",
            "Status",
            "Registered Date",
        ];
        const rows = filteredParcels.map((p) => [
            p.id,
            p.recipientName,
            p.phoneNumber,
            p.address,
            p.shelfLocation,
            statusConfig[p.status].label,
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
        a.download = `parcels-search-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    const uniqueStatuses = [
        ...new Set(parcels.map((p) => p.status)),
    ];
    const uniqueShelves = [
        ...new Set(parcels.map((p) => p.shelfLocation)),
    ].sort();

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">Parcel Search</h1>
                            <p className="text-sm text-[#5d5d5d] mt-1">
                                Find parcels by recipient, phone, ID, or date range
                            </p>
                        </div>
                        <Button
                            onClick={handleExport}
                            className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2"
                        >
                            <Download size={18} />
                            Export Results
                        </Button>
                    </div>

                    {/* Quick Search Bar */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-[#5d5d5d]" />
                                    <Input
                                        placeholder="Search by recipient name or parcel ID..."
                                        value={
                                            searchParams.recipientName || searchParams.parcelId
                                        }
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setSearchParams((prev) => ({
                                                ...prev,
                                                recipientName: value,
                                                parcelId: value,
                                            }));
                                        }}
                                        className="pl-10 border border-[#d1d1d1]"
                                    />
                                </div>
                                <Button
                                    onClick={() => setShowFilters(!showFilters)}
                                    variant={showFilters ? "default" : "outline"}
                                    className={`flex items-center gap-2 ${showFilters
                                        ? "bg-[#ea690c] text-white"
                                        : "border border-[#d1d1d1]"
                                        }`}
                                >
                                    <FilterIcon size={18} />
                                    <span className="hidden sm:inline">
                                        {showFilters ? "Hide" : "Show"} Filters
                                    </span>
                                </Button>
                            </div>

                            {/* Advanced Filters */}
                            {showFilters && (
                                <div className="mt-6 pt-6 border-t border-[#d1d1d1]">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Phone Number Filter */}
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Phone Number
                                            </label>
                                            <Input
                                                placeholder="+233..."
                                                value={searchParams.phoneNumber}
                                                onChange={(e) =>
                                                    setSearchParams((prev) => ({
                                                        ...prev,
                                                        phoneNumber: e.target.value,
                                                    }))
                                                }
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>

                                        {/* Status Filter */}
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Status
                                            </label>
                                            <select
                                                value={searchParams.status}
                                                onChange={(e) =>
                                                    setSearchParams((prev) => ({
                                                        ...prev,
                                                        status: e.target.value,
                                                    }))
                                                }
                                                className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                            >
                                                <option value="">All Status</option>
                                                {uniqueStatuses.map((status) => (
                                                    <option key={status} value={status}>
                                                        {statusConfig[status].label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Shelf Location Filter */}
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Shelf Location
                                            </label>
                                            <select
                                                value={searchParams.shelfLocation}
                                                onChange={(e) =>
                                                    setSearchParams((prev) => ({
                                                        ...prev,
                                                        shelfLocation: e.target.value,
                                                    }))
                                                }
                                                className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                            >
                                                <option value="">All Shelves</option>
                                                {uniqueShelves.map((shelf) => (
                                                    <option key={shelf} value={shelf}>
                                                        {shelf}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Start Date Filter */}
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                From Date
                                            </label>
                                            <Input
                                                type="date"
                                                value={searchParams.startDate}
                                                onChange={(e) =>
                                                    setSearchParams((prev) => ({
                                                        ...prev,
                                                        startDate: e.target.value,
                                                    }))
                                                }
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>

                                        {/* End Date Filter */}
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                To Date
                                            </label>
                                            <Input
                                                type="date"
                                                value={searchParams.endDate}
                                                onChange={(e) =>
                                                    setSearchParams((prev) => ({
                                                        ...prev,
                                                        endDate: e.target.value,
                                                    }))
                                                }
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>
                                    </div>

                                    {/* Filter Actions */}
                                    <div className="flex gap-3 mt-4">
                                        <Button
                                            onClick={handleClearFilters}
                                            variant="outline"
                                            className="border border-[#d1d1d1]"
                                        >
                                            Clear Filters
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Results Summary */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-neutral-800">
                            Found <span className="text-[#ea690c]">{filteredParcels.length}</span> parcel(s)
                        </p>
                    </div>

                    {/* Results Grid */}
                    {filteredParcels.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredParcels.map((parcel) => (
                                <Card
                                    key={parcel.id}
                                    className={`border-2 cursor-pointer transition-all ${selectedParcel?.id === parcel.id
                                        ? "border-[#ea690c] bg-orange-50"
                                        : "border-[#d1d1d1] hover:border-[#ea690c]"
                                        }`}
                                    onClick={() =>
                                        setSelectedParcel(
                                            selectedParcel?.id === parcel.id ? null : parcel
                                        )
                                    }
                                >
                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            {/* Header */}
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-neutral-800">
                                                        {parcel.recipientName}
                                                    </h3>
                                                    <p className="text-xs text-[#5d5d5d]">{parcel.id}</p>
                                                </div>
                                                <Badge
                                                    className={statusConfig[parcel.status].color}
                                                >
                                                    {statusConfig[parcel.status].label}
                                                </Badge>
                                            </div>

                                            {/* Contact Info */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <PhoneIcon className="w-4 h-4 text-[#5d5d5d]" />
                                                    <a
                                                        href={`tel:${parcel.phoneNumber}`}
                                                        className="text-sm text-[#ea690c] hover:underline"
                                                    >
                                                        {parcel.phoneNumber}
                                                    </a>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-[#5d5d5d]" />
                                                    <span className="text-sm text-neutral-700">
                                                        {parcel.address}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#d1d1d1]">
                                                <div>
                                                    <p className="text-xs text-[#5d5d5d]">Shelf</p>
                                                    <p className="text-sm font-semibold text-neutral-800">
                                                        {parcel.shelfLocation}
                                                    </p>
                                                </div>
                                                {parcel.itemValue > 0 && (
                                                    <div>
                                                        <p className="text-xs text-[#5d5d5d]">Value</p>
                                                        <p className="text-sm font-semibold text-[#ea690c]">
                                                            GHC {parcel.itemValue}
                                                        </p>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-xs text-[#5d5d5d]">Registered</p>
                                                    <p className="text-sm font-semibold text-neutral-800">
                                                        {new Date(parcel.registeredDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {parcel.driverName && (
                                                    <div>
                                                        <p className="text-xs text-[#5d5d5d]">Driver</p>
                                                        <p className="text-sm font-semibold text-neutral-800">
                                                            {parcel.driverName}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Description */}
                                            {parcel.itemDescription && (
                                                <div className="text-xs text-[#5d5d5d]">
                                                    <strong>Item:</strong> {parcel.itemDescription}
                                                </div>
                                            )}

                                            {/* Expanded Details */}
                                            {selectedParcel?.id === parcel.id && (
                                                <div className="pt-3 border-t border-[#d1d1d1] space-y-2 bg-white/50 p-3 rounded">
                                                    <div>
                                                        <p className="text-xs font-semibold text-[#5d5d5d] uppercase">
                                                            Full Address
                                                        </p>
                                                        <p className="text-sm text-neutral-700">
                                                            {parcel.address}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-[#5d5d5d] uppercase">
                                                            Item Details
                                                        </p>
                                                        <p className="text-sm text-neutral-700">
                                                            {parcel.itemDescription || "No description"}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="flex items-center justify-center p-12">
                                <div className="text-center">
                                    <SearchIcon className="w-16 h-16 text-[#9a9a9a] mx-auto mb-4 opacity-50" />
                                    <p className="text-neutral-800 font-medium mb-1">No parcels found</p>
                                    <p className="text-sm text-[#5d5d5d]">
                                        Try adjusting your search filters or criteria
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </main>
            </div>
        </div>
    );
};
