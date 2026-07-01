import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader, PackageIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon, ArrowLeftIcon } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useStation } from "../../contexts/StationContext";
import { useToast } from "../../components/ui/toast";
import frontdeskService, { ParcelResponse } from "../../services/frontdeskService";
import riderService from "../../services/riderService";
import authService from "../../services/authService";
import { formatPhoneNumber, normalizePhoneNumber, validatePhoneNumber } from "../../utils/dataHelpers";
import axios from "axios";
import API_BASE_URL from "../../config/api";

const fetchParcelPublic = async (parcelId: string): Promise<ParcelResponse | null> => {
    try {
        const res = await axios.get(`${API_BASE_URL}/api-frontdesk/parcel/${parcelId}`);
        return res.data ?? null;
    } catch {
        return null;
    }
};

export const ParcelScan = (): JSX.Element => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { userRole } = useStation();
    const { showToast } = useToast();

    const raw = searchParams.get("id") ?? searchParams.get("parcelId") ?? "";
    let parcelId = raw;
    try {
        const parsed = JSON.parse(raw);
        if (parsed?.id) parcelId = parsed.id;
    } catch { /* raw is plain string */ }

    const [parcel, setParcel] = useState<ParcelResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Staff pickup states
    const [showPickupModal, setShowPickupModal] = useState(false);
    const [pickupIsOwner, setPickupIsOwner] = useState(true);
    const [pickupName, setPickupName] = useState("");
    const [pickupPhone, setPickupPhone] = useState("");
    const [pickupLoading, setPickupLoading] = useState(false);

    // Rider states
    const [showDeliveredModal, setShowDeliveredModal] = useState(false);
    const [showFailedModal, setShowFailedModal] = useState(false);
    const [amountCollected, setAmountCollected] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [confirmationCode, setConfirmationCode] = useState("");
    const [failureReason, setFailureReason] = useState("");
    const [selectedFailureReason, setSelectedFailureReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const failureReasons = [
        "Recipient not available", "Wrong address", "Recipient refused delivery",
        "Address not found", "Recipient phone number not reachable", "Parcel damaged",
        "Incorrect recipient information", "Other",
    ];

    useEffect(() => {
        if (!parcelId) { setLoading(false); setNotFound(true); return; }
        fetchParcelPublic(parcelId).then(data => {
            if (data) setParcel(data);
            else setNotFound(true);
            setLoading(false);
        });
    }, [parcelId]);

    const reload = async () => {
        const data = await fetchParcelPublic(parcelId);
        if (data) setParcel(data);
    };

    const handleMarkPickedUp = async () => {
        if (!parcel) return;
        setPickupLoading(true);
        try {
            const name = pickupIsOwner ? (parcel.receiverName ?? "") : pickupName.trim();
            const phone = pickupIsOwner ? (parcel.recieverPhoneNumber ?? "") : normalizePhoneNumber(pickupPhone.trim());
            const res = await frontdeskService.markParcelPickedUp(parcel.parcelId, name || undefined, phone || undefined);
            if (res.success) {
                showToast("Parcel marked as picked up", "success");
                setShowPickupModal(false);
                await reload();
            } else {
                showToast(res.message || "Failed", "error");
            }
        } finally {
            setPickupLoading(false);
        }
    };

    const handleDelivered = async () => {
        if (!parcel || !paymentMethod) { showToast("Select a payment method", "error"); return; }
        setActionLoading(true);
        try {
            const assignRes = await frontdeskService.getActiveDeliveryForParcel(parcel.parcelId);
            const assignmentId = assignRes.data?.assignmentId ?? parcel.parcelId;
            const res = await riderService.updateAssignmentStatus(
                assignmentId, "DELIVERED",
                confirmationCode.trim() || undefined,
                undefined, paymentMethod, parcel.parcelId,
            );
            if (res.success) {
                showToast("Delivery confirmed!", "success");
                setShowDeliveredModal(false);
                await reload();
            } else {
                showToast(res.message || "Failed", "error");
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleFailed = async () => {
        if (!parcel) return;
        const reason = selectedFailureReason === "Other" ? failureReason.trim() : selectedFailureReason;
        if (!reason) { showToast("Select a failure reason", "error"); return; }
        setActionLoading(true);
        try {
            const assignRes = await frontdeskService.getActiveDeliveryForParcel(parcel.parcelId);
            const assignmentId = assignRes.data?.assignmentId ?? parcel.parcelId;
            const res = await riderService.updateAssignmentStatus(
                assignmentId, "RETURNED", undefined, reason, undefined, parcel.parcelId,
            );
            if (res.success) {
                showToast("Delivery failure recorded", "success");
                setShowFailedModal(false);
                await reload();
            } else {
                showToast(res.message || "Failed", "error");
            }
        } finally {
            setActionLoading(false);
        }
    };

    const isStaff = userRole === "MANAGER" || userRole === "FRONTDESK";
    const isRider = userRole === "RIDER";
    const isLoggedIn = !!authService.getToken();

    const statusLabel = parcel
        ? parcel.delivered ? "Delivered"
            : parcel.pickedUp ? "Picked Up"
                : parcel.pod ? "POD"
                    : parcel.parcelAssigned ? "Assigned"
                        : parcel.hasCalled ? "Called"
                            : "Registered"
        : "";

    const statusColor: Record<string, string> = {
        Delivered: "bg-green-100 text-green-800",
        "Picked Up": "bg-orange-100 text-orange-800",
        POD: "bg-purple-100 text-purple-800",
        Assigned: "bg-blue-100 text-blue-800",
        Called: "bg-yellow-100 text-yellow-800",
        Registered: "bg-gray-100 text-gray-800",
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader className="w-8 h-8 animate-spin text-[#ea690c]" />
        </div>
    );

    if (notFound || !parcel) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <PackageIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-lg font-bold text-neutral-800 mb-1">Parcel Not Found</h2>
            <p className="text-sm text-gray-500 mb-4">No parcel found for ID: <span className="font-mono">{parcelId || "—"}</span></p>
            {isLoggedIn && (
                <Button onClick={() => navigate(-1)} variant="outline" className="border-[#d1d1d1]">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />Go Back
                </Button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-[#d1d1d1] px-4 py-3 flex items-center gap-3">
                {isLoggedIn && (
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-neutral-800">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                )}
                <img src="/logo-1.png" alt="M&M" className="h-8 w-8 object-contain rounded" />
                <div>
                    <p className="text-sm font-bold text-[#ea690c] leading-tight">Mealex & Mailex</p>
                    <p className="text-[10px] text-gray-500">Parcel Tracking</p>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
                {/* ID + Status */}
                <Card className="border border-[#d1d1d1] bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs text-gray-500 mb-0.5">Parcel ID</p>
                                <p className="font-bold text-neutral-800 text-base font-mono">{parcel.parcelId}</p>
                            </div>
                            <Badge className={`${statusColor[statusLabel] ?? "bg-gray-100 text-gray-800"} text-xs shrink-0`}>
                                {statusLabel}
                            </Badge>
                        </div>
                        {parcel.createdAt && (
                            <p className="text-xs text-gray-400 mt-2">Registered: {new Date(parcel.createdAt).toLocaleString()}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Recipient */}
                <Card className="border border-[#d1d1d1] bg-white">
                    <CardContent className="p-4 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recipient</p>
                        <Row label="Name" value={parcel.receiverName} />
                        <Row label="Phone" value={parcel.recieverPhoneNumber ? formatPhoneNumber(parcel.recieverPhoneNumber) : undefined} />
                        {parcel.receiverAddress && <Row label="Address" value={parcel.receiverAddress} />}
                    </CardContent>
                </Card>

                {/* Sender */}
                {(parcel.senderName || parcel.senderPhoneNumber) && (
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-4 space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sender</p>
                            <Row label="Name" value={parcel.senderName} />
                            <Row label="Phone" value={parcel.senderPhoneNumber ? formatPhoneNumber(parcel.senderPhoneNumber) : undefined} />
                        </CardContent>
                    </Card>
                )}

                {/* Parcel Info */}
                <Card className="border border-[#d1d1d1] bg-white">
                    <CardContent className="p-4 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Parcel Info</p>
                        {parcel.parcelDescription && <Row label="Description" value={parcel.parcelDescription} />}
                        <Row label="Shelf" value={parcel.shelfName || parcel.shelfNumber} />
                        <div className="flex gap-1.5 flex-wrap pt-0.5">
                            {parcel.fragile && <Badge className="bg-red-100 text-red-700 text-xs">Fragile</Badge>}
                            {parcel.pod && <Badge className="bg-purple-100 text-purple-700 text-xs">POD</Badge>}
                            {parcel.homeDelivery && <Badge className="bg-blue-100 text-blue-700 text-xs">Home Delivery</Badge>}
                        </div>
                    </CardContent>
                </Card>

                {/* Costs */}
                {((parcel.inboundCost ?? 0) > 0 || (parcel.deliveryCost ?? 0) > 0 || (parcel.pickUpCost ?? 0) > 0) && (
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-4 space-y-1.5">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Costs</p>
                            {(parcel.inboundCost ?? 0) > 0 && <CostRow label="Transportation" value={parcel.inboundCost!} />}
                            {(parcel.deliveryCost ?? 0) > 0 && <CostRow label="Delivery" value={parcel.deliveryCost!} />}
                            {(parcel.pickUpCost ?? 0) > 0 && <CostRow label="Pickup" value={parcel.pickUpCost!} />}
                            <div className="flex justify-between pt-1.5 border-t border-[#d1d1d1] mt-1">
                                <span className="text-sm font-bold text-neutral-800">Total</span>
                                <span className="text-sm font-bold text-[#ea690c]">
                                    GHC {((parcel.inboundCost ?? 0) + (parcel.deliveryCost ?? 0) + (parcel.pickUpCost ?? 0)).toFixed(2)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Staff actions */}
                {isStaff && !parcel.pickedUp && !parcel.delivered && (
                    <div className="space-y-2">
                        <Button
                            onClick={() => { setPickupIsOwner(true); setPickupName(""); setPickupPhone(""); setShowPickupModal(true); }}
                            className="w-full bg-[#ea690c] text-white hover:bg-[#d45d0a]"
                        >
                            <CheckCircleIcon className="w-4 h-4 mr-2" />Mark as Picked Up
                        </Button>
                        <Button
                            onClick={() => navigate("/parcel-search")}
                            variant="outline"
                            className="w-full border-[#ea690c] text-[#ea690c] hover:bg-orange-50"
                        >
                            Open in Parcel Search
                        </Button>
                    </div>
                )}

                {/* Rider actions */}
                {isRider && !parcel.delivered && (
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            onClick={() => { setAmountCollected(""); setPaymentMethod(""); setConfirmationCode(""); setShowDeliveredModal(true); }}
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            <CheckCircleIcon className="w-4 h-4 mr-1.5" />Delivered
                        </Button>
                        <Button
                            onClick={() => { setSelectedFailureReason(""); setFailureReason(""); setShowFailedModal(true); }}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                            <XCircleIcon className="w-4 h-4 mr-1.5" />Failed
                        </Button>
                    </div>
                )}

                {/* Guest hint */}
                {!isLoggedIn && (
                    <p className="text-center text-xs text-gray-400 pt-2">
                        <a href="/login" className="text-[#ea690c] underline">Sign in</a> to manage this parcel
                    </p>
                )}
            </div>

            {/* Pickup Modal */}
            {showPickupModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md border border-[#d1d1d1] bg-white shadow-xl">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-neutral-800">Mark as Picked Up</h3>
                                <button onClick={() => setShowPickupModal(false)} className="text-gray-400 hover:text-neutral-800">
                                    <XCircleIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[{ label: "Owner", sub: "Receiver picked up", val: true }, { label: "Someone Else", sub: "Third party", val: false }].map(opt => (
                                    <label key={String(opt.val)} className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer ${pickupIsOwner === opt.val ? "border-[#ea690c] bg-orange-50" : "border-[#d1d1d1]"}`}>
                                        <input type="radio" checked={pickupIsOwner === opt.val} onChange={() => setPickupIsOwner(opt.val)} className="w-4 h-4 text-[#ea690c]" />
                                        <div>
                                            <p className="text-sm font-medium text-neutral-800">{opt.label}</p>
                                            <p className="text-xs text-gray-400">{opt.sub}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {pickupIsOwner ? (
                                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                                    <p>Name: <span className="font-medium text-neutral-800">{parcel.receiverName ?? "N/A"}</span></p>
                                    <p>Phone: <span className="font-medium text-neutral-800">{parcel.recieverPhoneNumber ?? "N/A"}</span></p>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <Label className="text-sm font-semibold text-neutral-800 mb-1.5">Full Name *</Label>
                                        <Input value={pickupName} onChange={e => setPickupName(e.target.value)} placeholder="Name of person picking up" className="border-[#d1d1d1]" />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-semibold text-neutral-800 mb-1.5">Phone Number *</Label>
                                        <Input value={pickupPhone} onChange={e => setPickupPhone(e.target.value)} placeholder="e.g. 0541234567"
                                            className={`border ${pickupPhone && !validatePhoneNumber(pickupPhone) ? "border-red-400" : "border-[#d1d1d1]"}`} />
                                    </div>
                                </>
                            )}
                            <div className="flex gap-3 pt-1">
                                <Button onClick={() => setShowPickupModal(false)} variant="outline" className="flex-1 border-[#d1d1d1]" disabled={pickupLoading}>Cancel</Button>
                                <Button onClick={handleMarkPickedUp}
                                    disabled={pickupLoading || (!pickupIsOwner && (!pickupName.trim() || !validatePhoneNumber(pickupPhone)))}
                                    className="flex-1 bg-[#ea690c] text-white hover:bg-[#d45d0a] disabled:opacity-50">
                                    {pickupLoading && <Loader className="w-4 h-4 animate-spin mr-2" />}Confirm Pickup
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Delivered Modal */}
            {showDeliveredModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <Card className="w-full sm:max-w-md border border-[#d1d1d1] bg-white shadow-xl rounded-t-2xl sm:rounded-lg">
                        <CardContent className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-neutral-800">Confirm Delivery</h3>
                                <button onClick={() => setShowDeliveredModal(false)} className="text-gray-400 hover:text-neutral-800">
                                    <XCircleIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                                <AlertCircleIcon className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-yellow-800">Confirm you have delivered this parcel to <strong>{parcel.receiverName}</strong>.</p>
                            </div>
                            <div>
                                <Label className="text-sm font-semibold text-neutral-800 mb-1.5">Amount Collected (GHC) *</Label>
                                <Input type="number" value={amountCollected} onChange={e => setAmountCollected(e.target.value)} placeholder="0.00" />
                            </div>
                            <div>
                                <Label className="text-sm font-semibold text-neutral-800 mb-2">Payment Method *</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[{ value: "cash", label: "💵 Cash" }, { value: "momo", label: "📱 Mobile Money" }].map(opt => (
                                        <button key={opt.value} type="button" onClick={() => setPaymentMethod(opt.value)}
                                            className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${paymentMethod === opt.value ? "border-[#ea690c] bg-orange-50 text-[#ea690c]" : "border-gray-200 text-gray-600"}`}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-semibold text-neutral-800 mb-1.5">Confirmation Code (Optional)</Label>
                                <Input value={confirmationCode} onChange={e => setConfirmationCode(e.target.value.toUpperCase())} placeholder="Optional" maxLength={10} className="uppercase" />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <Button onClick={() => setShowDeliveredModal(false)} variant="outline" className="flex-1 border-[#d1d1d1]" disabled={actionLoading}>Cancel</Button>
                                <Button onClick={handleDelivered} disabled={!amountCollected || !paymentMethod || actionLoading}
                                    className="flex-1 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                                    {actionLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <CheckCircleIcon className="w-4 h-4 mr-2" />}Confirm
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Failed Modal */}
            {showFailedModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <Card className="w-full sm:max-w-md border border-[#d1d1d1] bg-white shadow-xl rounded-t-2xl sm:rounded-lg">
                        <CardContent className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-neutral-800">Mark Delivery as Failed</h3>
                                <button onClick={() => setShowFailedModal(false)} className="text-gray-400 hover:text-neutral-800">
                                    <XCircleIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                                <AlertCircleIcon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-800">This action cannot be undone. Please provide a reason.</p>
                            </div>
                            <div>
                                <Label className="text-sm font-semibold text-neutral-800 mb-1.5">Failure Reason *</Label>
                                <select value={selectedFailureReason}
                                    onChange={e => { setSelectedFailureReason(e.target.value); if (e.target.value !== "Other") setFailureReason(""); }}
                                    className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c] bg-white text-sm">
                                    <option value="">Select a reason</option>
                                    {failureReasons.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                {selectedFailureReason === "Other" && (
                                    <textarea value={failureReason} onChange={e => setFailureReason(e.target.value)}
                                        placeholder="Describe the reason..."
                                        className="mt-2 w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c] resize-none text-sm" rows={3} />
                                )}
                            </div>
                            <div className="flex gap-3 pt-1">
                                <Button onClick={() => setShowFailedModal(false)} variant="outline" className="flex-1 border-[#d1d1d1]" disabled={actionLoading}>Cancel</Button>
                                <Button onClick={handleFailed}
                                    disabled={!selectedFailureReason || (selectedFailureReason === "Other" && !failureReason.trim()) || actionLoading}
                                    className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                                    {actionLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <XCircleIcon className="w-4 h-4 mr-2" />}Confirm
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

const Row = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
        <div className="flex justify-between gap-4">
            <span className="text-xs text-gray-500 shrink-0">{label}</span>
            <span className="text-xs font-medium text-neutral-800 text-right">{value}</span>
        </div>
    ) : null;

const CostRow = ({ label, value }: { label: string; value: number }) => (
    <div className="flex justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-medium text-neutral-800">GHC {value.toFixed(2)}</span>
    </div>
);
