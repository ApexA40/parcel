import { useState } from "react";
import {
    SearchIcon, PhoneIcon, PackageIcon, CheckCircleIcon,
    ClockIcon, MapPinIcon, UserIcon, BanknoteIcon,
    Loader2Icon, AlertCircleIcon, Home, X, Loader,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Label } from "../../components/ui/label";
import { useToast } from "../../components/ui/toast";
import { searchParcelsByPhone, type CustomerParcel } from "../../services/customerService";
import frontdeskService from "../../services/frontdeskService";
import { formatPhoneNumber } from "../../utils/dataHelpers";

function formatDate(ts: number | null | undefined): string {
    if (ts == null) return "—";
    return new Date(ts).toLocaleDateString(undefined, { dateStyle: "medium" });
}

function formatCurrency(amount: number | null | undefined): string {
    if (amount == null || Number.isNaN(amount)) return "—";
    return `GHC ${Math.round(amount).toLocaleString()}`;
}

function getAmountToPay(p: CustomerParcel): number | null {
    if (p.parcelAmount != null && !Number.isNaN(p.parcelAmount)) return Math.round(p.parcelAmount);
    const total = (Number(p.inboundCost) || 0) + (Number(p.deliveryCost) || 0) + (Number(p.storageCost) || 0) + (Number(p.pickUpCost) || 0);
    return total > 0 ? total : null;
}

export const SmartSearch = () => {
    const { showToast } = useToast();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [parcels, setParcels] = useState<CustomerParcel[]>([]);
    const [searched, setSearched] = useState(false);

    // Delivery request modal
    const [deliveryParcel, setDeliveryParcel] = useState<CustomerParcel | null>(null);
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryCost, setDeliveryCost] = useState("");
    const [savingDelivery, setSavingDelivery] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setParcels([]);
        setSearched(false);
        const trimmed = phoneNumber.trim();
        if (!trimmed) { setError("Please enter a phone number."); return; }
        setLoading(true);
        try {
            const result = await searchParcelsByPhone(trimmed);
            setSearched(true);
            if (result.success && result.data) {
                setParcels(result.data);
                if (result.data.length === 0) setError("No parcels found for this phone number.");
            } else {
                setError(result.message || "Search failed. Please try again.");
            }
        } catch {
            setSearched(true);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const openDeliveryModal = (parcel: CustomerParcel) => {
        setDeliveryParcel(parcel);
        setDeliveryAddress(parcel.receiverAddress || "");
        setDeliveryCost(parcel.deliveryCost ? String(parcel.deliveryCost) : "");
    };

    const handleRequestDelivery = async () => {
        if (!deliveryParcel) return;
        if (!deliveryAddress.trim()) { showToast("Please enter a delivery address", "warning"); return; }
        setSavingDelivery(true);
        try {
            const response = await frontdeskService.updateParcel(deliveryParcel.parcelId, {
                homeDelivery: true,
                hasCalled: true,
                receiverAddress: deliveryAddress.trim(),
                deliveryCost: parseFloat(deliveryCost) || 0,
            });
            if (response.success) {
                showToast("Home delivery requested successfully", "success");
                setParcels(prev => prev.map(p =>
                    p.parcelId === deliveryParcel.parcelId
                        ? { ...p, homeDelivery: true, receiverAddress: deliveryAddress, deliveryCost: parseFloat(deliveryCost) || 0 }
                        : p
                ));
                setDeliveryParcel(null);
            } else {
                showToast(response.message || "Failed to request delivery", "error");
            }
        } catch {
            showToast("Failed to request delivery", "error");
        } finally {
            setSavingDelivery(false);
        }
    };

    const isNoResults = searched && parcels.length === 0 && error?.toLowerCase().includes("no parcels");
    const isApiError = error && !isNoResults;

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <header>
                    <h1 className="text-xl font-bold text-neutral-800">Smart Search</h1>
                    <p className="text-xs text-[#5d5d5d] mt-0.5">
                        Look up a customer's parcels by phone number and manage delivery preferences.
                    </p>
                </header>

                {/* Search */}
                <Card className="border border-[#d1d1d1] bg-white">
                    <CardContent className="p-4 sm:p-5">
                        <form onSubmit={handleSearch} className="flex gap-3">
                            <div className="flex-1 relative">
                                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <Input
                                    type="tel"
                                    inputMode="numeric"
                                    value={phoneNumber}
                                    onChange={e => { setPhoneNumber(e.target.value); setError(""); }}
                                    placeholder="Enter phone number (e.g. 0541234567)"
                                    className="pl-9 border-[#d1d1d1]"
                                    disabled={loading}
                                />
                            </div>
                            <Button type="submit" disabled={loading} className="bg-[#ea690c] hover:bg-[#d45d0a] text-white px-5">
                                {loading ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Error */}
                {isApiError && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-100 text-red-800 text-sm">
                        <AlertCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* No results */}
                {isNoResults && (
                    <div className="text-center py-12">
                        <PackageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-neutral-800">No parcels found</p>
                        <p className="text-xs text-[#5d5d5d] mt-1">No parcels linked to this number.</p>
                    </div>
                )}

                {/* Results */}
                {searched && parcels.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-neutral-800">{parcels.length} parcel{parcels.length !== 1 ? "s" : ""} found</p>
                            <button onClick={() => { setPhoneNumber(""); setParcels([]); setSearched(false); setError(""); }} className="text-xs text-[#ea690c] hover:underline">
                                Clear
                            </button>
                        </div>

                        {parcels.map(p => {
                            const canRequestDelivery = !p.delivered && !p.parcelAssigned && !p.homeDelivery;
                            const hasDeliveryPending = !p.delivered && !p.parcelAssigned && p.homeDelivery;

                            return (
                                <Card key={p.parcelId} className="border border-[#d1d1d1] bg-white">
                                    <CardContent className="p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                            <div className="flex-1 space-y-2">
                                                {/* Name + status */}
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-semibold text-neutral-800">{p.receiverName || "—"}</span>
                                                    {p.delivered ? (
                                                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs flex items-center gap-1">
                                                            <CheckCircleIcon className="w-3 h-3" /> Delivered
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs flex items-center gap-1">
                                                            <ClockIcon className="w-3 h-3" /> In Progress
                                                        </Badge>
                                                    )}
                                                    {p.homeDelivery && (
                                                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs flex items-center gap-1">
                                                            <Home className="w-3 h-3" /> Home Delivery
                                                        </Badge>
                                                    )}
                                                </div>

                                                {p.parcelDescription && <p className="text-sm text-gray-600">{p.parcelDescription}</p>}

                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                                    {p.shelfName && (
                                                        <span className="flex items-center gap-1"><PackageIcon className="w-3.5 h-3.5" /> Shelf: {p.shelfName}</span>
                                                    )}
                                                    {p.senderName && (
                                                        <span className="flex items-center gap-1"><UserIcon className="w-3.5 h-3.5" /> From: {p.senderName}</span>
                                                    )}
                                                    {p.receiverAddress && (
                                                        <span className="flex items-center gap-1"><MapPinIcon className="w-3.5 h-3.5" /> {p.receiverAddress}</span>
                                                    )}
                                                    {p.updatedAt && (
                                                        <span>Updated: {formatDate(p.updatedAt)}</span>
                                                    )}
                                                </div>

                                                {/* Amount */}
                                                {getAmountToPay(p) != null && (
                                                    <div className="flex items-center gap-1.5 text-sm">
                                                        <BanknoteIcon className="w-4 h-4 text-[#ea690c]" />
                                                        <span className="font-bold text-[#ea690c]">{formatCurrency(getAmountToPay(p))}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2 flex-shrink-0">
                                                {canRequestDelivery && (
                                                    <Button
                                                        onClick={() => openDeliveryModal(p)}
                                                        size="sm"
                                                        className="bg-[#ea690c] text-white hover:bg-[#d45d0a] text-xs h-8"
                                                    >
                                                        <Home className="w-3.5 h-3.5 mr-1.5" />
                                                        Request Delivery
                                                    </Button>
                                                )}
                                                {hasDeliveryPending && (
                                                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs text-center px-3 py-1.5">
                                                        Delivery Requested
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Request Delivery Modal */}
            {deliveryParcel && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md border border-[#d1d1d1] bg-white shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#d1d1d1]">
                                <div>
                                    <h3 className="text-base font-bold text-neutral-800">Request Home Delivery</h3>
                                    <p className="text-xs text-[#5d5d5d] mt-0.5">{deliveryParcel.receiverName || deliveryParcel.parcelId}</p>
                                </div>
                                <button onClick={() => setDeliveryParcel(null)} className="text-gray-400 hover:text-neutral-800 p-1 hover:bg-gray-100 rounded">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm font-semibold text-neutral-800 mb-1.5 block">
                                        Delivery Address <span className="text-[#e22420]">*</span>
                                    </Label>
                                    <Input
                                        value={deliveryAddress}
                                        onChange={e => setDeliveryAddress(e.target.value)}
                                        placeholder="Enter full delivery address"
                                        className="border-[#d1d1d1] focus:border-[#ea690c]"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-semibold text-neutral-800 mb-1.5 block">Delivery Fee (GHC)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={deliveryCost}
                                        onChange={e => setDeliveryCost(e.target.value)}
                                        placeholder="e.g. 15.00"
                                        className="border-[#d1d1d1] focus:border-[#ea690c]"
                                    />
                                </div>
                                <div className="flex gap-3 pt-1">
                                    <Button onClick={() => setDeliveryParcel(null)} variant="outline" className="flex-1 border-[#d1d1d1]" disabled={savingDelivery}>Cancel</Button>
                                    <Button
                                        onClick={handleRequestDelivery}
                                        disabled={savingDelivery || !deliveryAddress.trim()}
                                        className="flex-1 bg-[#ea690c] text-white hover:bg-[#d45d0a] disabled:opacity-50"
                                    >
                                        {savingDelivery ? <><Loader className="w-4 h-4 animate-spin mr-2" />Saving...</> : "Confirm Request"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
