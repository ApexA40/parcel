import { useState, useEffect, useMemo, useCallback } from "react";
import {
    PackageIcon,
    MapPinIcon,
    CheckCircleIcon,
    XCircleIcon,
    Loader,
    AlertCircleIcon,
    Phone,
    Navigation,
    RefreshCw,
    Download,
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { formatPhoneNumber, formatCurrency } from "../../utils/dataHelpers";
import riderService, { RiderAssignmentResponse, AssignmentStatus } from "../../services/riderService";
import { useToast } from "../../components/ui/toast";
import { generateAssignmentsPDF } from "../../utils/pdfGenerator";
import { useStation } from "../../contexts/StationContext";
import {
    BottomSheet, CardSkeleton, EmptyState, IconAction, ParcelDetails, StatusPill,
    mapsHref, parcelTotal, telHref, timeOf,
} from "../../components/rider/RiderUI";

type UIStatus = "assigned" | "accepted" | "picked-up" | "out-for-delivery" | "delivered" | "delivery-failed";

const mapUIToAssignmentStatus = (uiStatus: UIStatus): AssignmentStatus => {
    switch (uiStatus) {
        case "assigned":
            return "ASSIGNED";
        case "accepted":
            return "ACCEPTED";
        case "picked-up":
            return "PICKED_UP";
        case "out-for-delivery":
            return "PICKED_UP";
        case "delivered":
            return "DELIVERED";
        case "delivery-failed":
            return "RETURNED";
        default:
            return "ASSIGNED";
    }
};

export const RiderDashboard = (): JSX.Element => {
    const { showToast } = useToast();
    const { currentUser } = useStation();

    const [assignments, setAssignments] = useState<RiderAssignmentResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<RiderAssignmentResponse | null>(null);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [showFailedModal, setShowFailedModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [amountCollected, setAmountCollected] = useState("");
    const [confirmationCode, setConfirmationCode] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<string>("");
    const [failureReason, setFailureReason] = useState("");
    const [selectedFailureReason, setSelectedFailureReason] = useState("");
    const [updatingAssignment, setUpdatingAssignment] = useState<string | null>(null);
    const [tab, setTab] = useState<"active" | "done">("active");
    const [pagination, setPagination] = useState({
        page: 0,
        size: 50,
        totalElements: 0,
        totalPages: 0,
    });

    // Predefined failure reasons
    const failureReasons = [
        "Recipient not available",
        "Wrong address",
        "Recipient refused delivery",
        "Address not found",
        "Recipient phone number not reachable",
        "Parcel damaged",
        "Incorrect recipient information",
        "Other"
    ];

    const fetchAssignments = useCallback(async (page: number = 0, size: number = 50) => {
        setLoading(true);
        try {
            const response = await riderService.getAssignments(page, size);

            if (response.success && response.data) {
                const data = response.data as any;

                // Handle both paginated response (with content) and direct array
                let assignmentsList: RiderAssignmentResponse[] = [];
                if (data.content && Array.isArray(data.content)) {
                    assignmentsList = data.content;
                } else if (Array.isArray(data)) {
                    assignmentsList = data;
                } else if (Array.isArray(response.data)) {
                    assignmentsList = response.data;
                }

                setAssignments(assignmentsList);
                setPagination({
                    page: data.number !== undefined ? data.number : page,
                    size: data.size !== undefined ? data.size : size,
                    totalElements: data.totalElements !== undefined ? data.totalElements : assignmentsList.length,
                    totalPages: data.totalPages !== undefined ? data.totalPages : 1,
                });
            } else {
                showToast(response.message || "Failed to load assignments", "error");
                setAssignments([]);
            }
        } catch (error) {
            console.error("Failed to fetch assignments");
            showToast("Failed to load assignments. Please try again.", "error");
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    // Fetch assignments on mount and when pagination changes
    useEffect(() => {
        fetchAssignments(pagination.page, pagination.size);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, pagination.size]);


    const handleAssignmentStatusUpdate = async (assignmentId: string, newUIStatus: UIStatus, parcelId?: string) => {
        // Find the correct assignment - if parcelId is provided, match both assignmentId and parcelId
        // This is important because multiple parcels can share the same assignmentId after flattening
        const assignment = parcelId
            ? assignments.find((a) => a.assignmentId === assignmentId && a.parcel.parcelId === parcelId)
            : assignments.find((a) => a.assignmentId === assignmentId);

        if (newUIStatus === "delivered") {
            // Show confirmation modal for delivery
            if (assignment) {
                const parcel = assignment.parcel;
                const totalAmount = (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) +
                    (parcel.inboundCost || 0) + (parcel.storageCost || 0);
                // Pre-fill amount collected with expected total
                setAmountCollected(totalAmount.toFixed(2));
            }
            setSelectedAssignment(assignment || null);
            setPaymentMethod(""); // Reset payment method
            setConfirmationCode(""); // Reset confirmation code
            setShowDeliveryModal(true);
            return;
        } else if (newUIStatus === "delivery-failed") {
            // Show confirmation modal for failure
            setSelectedAssignment(assignment || null);
            setPaymentMethod(""); // Reset payment method
            setFailureReason("");
            setSelectedFailureReason("");
            setShowFailedModal(true);
            return;
        }

        // This shouldn't happen, but handle other statuses if needed
        setUpdatingAssignment(assignmentId);
        try {
            const apiStatus = mapUIToAssignmentStatus(newUIStatus);
            const response = await riderService.updateAssignmentStatus(assignmentId, apiStatus);

            if (response.success) {
                showToast("Status updated successfully", "success");
                await fetchAssignments(pagination.page, pagination.size);
            } else {
                showToast(response.message || "Failed to update status", "error");
            }
        } catch (error) {
            console.error("Failed to update assignment status");
            showToast("Failed to update status. Please try again.", "error");
        } finally {
            setUpdatingAssignment(null);
        }
    };

    const handleDeliveryComplete = async () => {
        if (!selectedAssignment || !amountCollected || !paymentMethod) {
            if (!paymentMethod) {
                showToast("Please select a payment method", "error");
            }
            return;
        }

        setUpdatingAssignment(selectedAssignment.assignmentId);
        try {
            const assignmentId = selectedAssignment.assignmentId;
            const parcelId = selectedAssignment.parcel.parcelId;

            const response = await riderService.updateAssignmentStatus(
                assignmentId,
                "DELIVERED",
                confirmationCode.trim() || undefined, // Optional confirmation code
                undefined, // reason not needed for DELIVERED
                paymentMethod, // paymentMethod: "cash" or "momo"
                parcelId // parcelId - used in URL path and request body for DELIVERED status
            );

            if (response.success) {
                const parcel = selectedAssignment.parcel;
                const totalAmount = (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) +
                    (parcel.inboundCost || 0) + (parcel.storageCost || 0);
                const collected = parseFloat(amountCollected);

                showToast(
                    `Delivery completed! Collected GHC ${collected.toFixed(2)}${collected !== totalAmount ? ` (Expected: GHC ${totalAmount.toFixed(2)})` : ''}`,
                    "success"
                );

                setShowDeliveryModal(false);
                setSelectedAssignment(null);
                setAmountCollected("");
                setConfirmationCode("");
                setPaymentMethod("");
                await fetchAssignments(pagination.page, pagination.size);
            } else {
                showToast(response.message || "Failed to complete delivery", "error");
            }
        } catch (error) {
            console.error("Failed to complete delivery");
            showToast("Failed to complete delivery. Please try again.", "error");
        } finally {
            setUpdatingAssignment(null);
        }
    };

    const handleDeliveryFailed = async () => {
        if (!selectedAssignment) return;

        // Validate that either a reason is selected or custom reason is provided
        const finalReason = selectedFailureReason === "Other"
            ? failureReason.trim()
            : selectedFailureReason;

        if (!finalReason) {
            showToast("Please select a failure reason", "error");
            return;
        }

        setUpdatingAssignment(selectedAssignment.assignmentId);
        try {
            const assignmentId = selectedAssignment.assignmentId;
            const parcelId = selectedAssignment.parcel.parcelId;

            const response = await riderService.updateAssignmentStatus(
                assignmentId,
                "RETURNED", // Status should be RETURNED when marking as failed
                undefined, // confirmationCode not needed
                finalReason, // returnReason is required
                undefined, // paymentMethod not needed
                parcelId // parcelId is required
            );

            if (response.success) {
                showToast("Delivery failure recorded", "success");
                setShowFailedModal(false);
                setSelectedAssignment(null);
                setFailureReason("");
                setSelectedFailureReason("");
                setPaymentMethod("");
                await fetchAssignments(pagination.page, pagination.size);
            } else {
                showToast(response.message || "Failed to record failure", "error");
            }
        } catch (error) {
            console.error("Failed to record failure");
            showToast("Failed to record failure. Please try again.", "error");
        } finally {
            setUpdatingAssignment(null);
        }
    };

    // Filter assignments by parcel-level status
    // Backend assignment.status is unreliable, so we rely on parcel flags
    const activeAssignments = useMemo(() => {
        return assignments.filter(a => {
            const isDelivered = !!a.parcel?.delivered;
            const isCancelled = !!a.parcel?.cancelled;
            const isReturned = !!a.parcel?.returned;
            return !isDelivered && !isCancelled && !isReturned;
        });
    }, [assignments]);

    // Calculate total amount to collect from active assignments
    const totalAmountToCollect = useMemo(() => {
        return activeAssignments.reduce((total, assignment) => {
            const parcel = assignment.parcel;
            const parcelAmount = (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) +
                (parcel.inboundCost || 0) + (parcel.storageCost || 0);
            return total + parcelAmount;
        }, 0);
    }, [activeAssignments]);

    // Calculate total amount collected for today's completed assignments
    const todayCollected = useMemo(() => {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();

        return assignments.reduce((total, assignment) => {
            const parcel = assignment.parcel;
            if (!parcel?.delivered) return total;

            const timestamp = assignment.completedAt
                ? new Date(assignment.completedAt).getTime()
                : assignment.assignedAt
                    ? new Date(assignment.assignedAt).getTime()
                    : null;

            if (timestamp === null) return total;
            if (timestamp < startOfDay || timestamp > endOfDay) return total;

            const parcelAmount =
                (parcel.deliveryCost || 0) +
                (parcel.pickUpCost || 0) +
                (parcel.inboundCost || 0) +
                (parcel.storageCost || 0);

            return total + parcelAmount;
        }, 0);
    }, [assignments]);


    const handleDownloadPDF = () => {
        try {
            const pdfData = activeAssignments.map(assignment => {
                const parcel = assignment.parcel;
                const totalAmount = (parcel.deliveryCost || 0) + (parcel.pickUpCost || 0) +
                    (parcel.inboundCost || 0) + (parcel.storageCost || 0);

                const location = parcel.receiverAddress || 'N/A';

                return {
                    parcelId: parcel.parcelId, // Keep for reference but not displayed in PDF
                    recipientName: parcel.receiverName || 'N/A',
                    phone: parcel.recieverPhoneNumber ? formatPhoneNumber(parcel.recieverPhoneNumber) : 'N/A',
                    location: location,
                    amount: formatCurrency(totalAmount),
                    status: '', // Not displayed in PDF
                    assignedAt: '' // Not displayed in PDF
                };
            });

            generateAssignmentsPDF(pdfData, currentUser?.name || 'Rider');
            showToast("PDF downloaded successfully", "success");
        } catch (error) {
            console.error("Failed to generate PDF");
            showToast("Failed to generate PDF. Please try again.", "error");
        }
    };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayAssignments = assignments.filter(a => {
        const t = a.assignedAt ? new Date(a.assignedAt).getTime() : null;
        return t !== null && t >= todayStart.getTime();
    });
    const todayDelivered = todayAssignments.filter(a => !!a.parcel?.delivered).length;
    const todayTotal = todayAssignments.length;
    const progressPct = todayTotal > 0 ? Math.round((todayDelivered / todayTotal) * 100) : 0;

    const doneToday = assignments
        .filter(a => (a.parcel?.delivered || a.parcel?.returned) && (a.completedAt ?? 0) >= todayStart.getTime())
        .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

    const openDetails = (a: RiderAssignmentResponse) => {
        setSelectedAssignment(a);
        setShowDetailsModal(true);
    };
    const closeDetails = () => {
        setShowDetailsModal(false);
        setSelectedAssignment(null);
    };
    const startDelivered = (a: RiderAssignmentResponse) => {
        setShowDetailsModal(false);
        handleAssignmentStatusUpdate(a.assignmentId, "delivered", a.parcel.parcelId);
    };
    const startFailed = (a: RiderAssignmentResponse) => {
        setShowDetailsModal(false);
        handleAssignmentStatusUpdate(a.assignmentId, "delivery-failed", a.parcel.parcelId);
    };

    const busy = !!selectedAssignment && updatingAssignment === selectedAssignment.assignmentId;
    const expected = parcelTotal(selectedAssignment?.parcel);
    const failureReady = !!selectedFailureReason && (selectedFailureReason !== "Other" || !!failureReason.trim());

    return (
        <div className="space-y-5">
            {/* Summary card */}
            <section className="rounded-3xl bg-gradient-to-br from-[#ea690c] to-[#f59e0b] text-white p-5 shadow-[0_10px_30px_-12px_rgba(234,105,12,0.6)]">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm text-white/80">{greeting}</p>
                        <h1 className="text-2xl font-bold leading-tight truncate">{currentUser?.name?.split(" ")[0] || "Rider"}</h1>
                    </div>
                    <button
                        onClick={() => fetchAssignments(pagination.page, pagination.size)}
                        disabled={loading}
                        className="h-10 w-10 shrink-0 rounded-full bg-white/20 flex items-center justify-center active:scale-95 disabled:opacity-60"
                        aria-label="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                <div className="mt-5">
                    <div className="flex items-baseline justify-between text-sm">
                        <span className="text-white/85">Today's progress</span>
                        <span className="font-semibold">{todayDelivered} of {todayTotal} done</span>
                    </div>
                    <div className="mt-2 h-2.5 rounded-full bg-white/25 overflow-hidden">
                        <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/15 px-3.5 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-white/75">To collect</p>
                        <p className="text-lg font-bold leading-tight mt-0.5">{formatCurrency(totalAmountToCollect)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/15 px-3.5 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-white/75">Collected today</p>
                        <p className="text-lg font-bold leading-tight mt-0.5">{formatCurrency(todayCollected)}</p>
                    </div>
                </div>
            </section>

            {/* Segmented control */}
            <div className="flex items-center gap-2">
                <div className="flex-1 grid grid-cols-2 p-1 rounded-2xl bg-gray-200/70">
                    {([["active", `To deliver · ${activeAssignments.length}`], ["done", `Done today · ${doneToday.length}`]] as const).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`h-10 rounded-xl text-sm font-semibold transition ${tab === key ? "bg-white text-neutral-900 shadow-sm" : "text-gray-600"}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {activeAssignments.length > 0 && (
                    <button
                        onClick={handleDownloadPDF}
                        className="h-12 w-12 shrink-0 rounded-2xl bg-white border border-gray-200 text-gray-700 flex items-center justify-center active:scale-95"
                        aria-label="Download route sheet"
                        title="Download route sheet (PDF)"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                )}
            </div>

            {loading && assignments.length === 0 ? (
                <CardSkeleton />
            ) : tab === "active" ? (
                activeAssignments.length === 0 ? (
                    <EmptyState icon={<PackageIcon className="w-8 h-8" />} title="No deliveries right now" hint="New assignments will show up here." />
                ) : (
                    <ul className="space-y-3">
                        {activeAssignments.map((a, i) => {
                            const p = a.parcel;
                            return (
                                <li key={`${a.assignmentId}-${p.parcelId}`}>
                                    <article
                                        onClick={() => openDetails(a)}
                                        className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04] active:bg-gray-50 cursor-pointer"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="h-8 w-8 shrink-0 rounded-full bg-orange-50 text-[#ea690c] text-sm font-bold flex items-center justify-center">
                                                {i + 1}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-semibold leading-tight truncate">{p.receiverName || "Unknown recipient"}</h3>
                                                    <span className="shrink-0 font-bold text-[#ea690c]">{formatCurrency(parcelTotal(p))}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5 truncate">{p.parcelDescription || "Parcel"} · {p.parcelId}</p>
                                                <p className="flex items-start gap-1.5 text-sm text-gray-700 mt-2">
                                                    <MapPinIcon className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                                                    <span className="line-clamp-2">{p.receiverAddress || "No address given"}</span>
                                                </p>
                                                {(p.pod || p.fragile) && (
                                                    <div className="flex gap-1.5 mt-2">
                                                        {p.pod && <StatusPill tone="pending">Pay on delivery</StatusPill>}
                                                        {p.fragile && <StatusPill tone="returned">Fragile</StatusPill>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-4">
                                            <IconAction href={telHref(p.recieverPhoneNumber)} label="Call recipient" tone="green">
                                                <Phone className="w-5 h-5" />
                                            </IconAction>
                                            <IconAction href={mapsHref(p.receiverAddress)} label="Directions" tone="blue">
                                                <Navigation className="w-5 h-5" />
                                            </IconAction>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startFailed(a); }}
                                                className="h-11 px-4 rounded-2xl bg-gray-100 text-gray-700 text-sm font-semibold active:scale-95"
                                            >
                                                Failed
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startDelivered(a); }}
                                                disabled={updatingAssignment === a.assignmentId}
                                                className="h-11 flex-1 rounded-2xl bg-[#ea690c] text-white text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-60"
                                            >
                                                <CheckCircleIcon className="w-4 h-4" /> Delivered
                                            </button>
                                        </div>
                                    </article>
                                </li>
                            );
                        })}
                    </ul>
                )
            ) : doneToday.length === 0 ? (
                <EmptyState icon={<CheckCircleIcon className="w-8 h-8" />} title="Nothing completed yet today" hint="Deliveries you finish today appear here." />
            ) : (
                <ul className="rounded-3xl bg-white divide-y divide-gray-100 overflow-hidden shadow-sm ring-1 ring-black/[0.04]">
                    {doneToday.map((a) => {
                        const p = a.parcel;
                        const failed = !!p.returned;
                        return (
                            <li key={`${a.assignmentId}-${p.parcelId}`}>
                                <button onClick={() => openDetails(a)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50">
                                    <span className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${failed ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                                        {failed ? <XCircleIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium truncate">{p.receiverName || "Unknown recipient"}</p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {timeOf(a.completedAt)}{a.paymentMethod ? ` · ${a.paymentMethod === "momo" ? "MoMo" : "Cash"}` : ""}{failed ? " · Returned" : ""}
                                        </p>
                                    </div>
                                    <span className={`font-semibold text-sm ${failed ? "text-gray-400 line-through" : ""}`}>{formatCurrency(parcelTotal(p))}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(0, prev.page - 1) }))}
                        disabled={pagination.page === 0 || loading}
                        className="h-10 px-4 rounded-xl bg-white border border-gray-200 disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-gray-500">Page {pagination.page + 1} of {pagination.totalPages}</span>
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages - 1, prev.page + 1) }))}
                        disabled={pagination.page >= pagination.totalPages - 1 || loading}
                        className="h-10 px-4 rounded-xl bg-white border border-gray-200 disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Parcel details */}
            <BottomSheet
                open={showDetailsModal && !!selectedAssignment}
                onClose={closeDetails}
                title={selectedAssignment?.parcel.receiverName || "Parcel details"}
                subtitle={selectedAssignment?.parcel.parcelDescription}
                footer={selectedAssignment && !selectedAssignment.parcel.delivered && !selectedAssignment.parcel.returned && !selectedAssignment.parcel.cancelled ? (
                    <div className="flex gap-2">
                        <button onClick={() => startFailed(selectedAssignment)} className="h-12 px-5 rounded-2xl bg-gray-100 text-gray-700 font-semibold">
                            Failed
                        </button>
                        <button onClick={() => startDelivered(selectedAssignment)} className="h-12 flex-1 rounded-2xl bg-[#ea690c] text-white font-semibold">
                            Mark delivered
                        </button>
                    </div>
                ) : undefined}
            >
                {selectedAssignment && <ParcelDetails assignment={selectedAssignment} />}
            </BottomSheet>

            {/* Confirm delivery */}
            <BottomSheet
                open={showDeliveryModal && !!selectedAssignment}
                onClose={() => { setShowDeliveryModal(false); setSelectedAssignment(null); }}
                title="Confirm delivery"
                subtitle={selectedAssignment ? `${selectedAssignment.parcel.receiverName || "Recipient"} · ${selectedAssignment.parcel.parcelId}` : undefined}
                footer={
                    <button
                        onClick={handleDeliveryComplete}
                        disabled={!amountCollected || !paymentMethod || busy}
                        className="w-full h-12 rounded-2xl bg-green-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {busy ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircleIcon className="w-5 h-5" />}
                        {busy ? "Saving..." : "Confirm delivered"}
                    </button>
                }
            >
                <div className="space-y-5">
                    <div className="rounded-2xl bg-orange-50 p-4 flex items-center justify-between">
                        <span className="text-sm text-gray-700">Amount due</span>
                        <span className="text-2xl font-bold text-[#ea690c]">{formatCurrency(expected)}</span>
                    </div>

                    <div>
                        <Label className="text-sm font-semibold">Amount collected (GHC)</Label>
                        <Input
                            type="number"
                            inputMode="decimal"
                            value={amountCollected}
                            onChange={(e) => setAmountCollected(e.target.value)}
                            placeholder="0.00"
                            className="mt-1.5 h-12 rounded-2xl text-lg"
                        />
                        {amountCollected && parseFloat(amountCollected) !== expected && (
                            <p className="text-xs text-amber-700 mt-1.5 flex items-center gap-1">
                                <AlertCircleIcon className="w-3.5 h-3.5" /> Differs from the amount due
                            </p>
                        )}
                    </div>

                    <div>
                        <Label className="text-sm font-semibold">Payment method</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                            {[{ value: "cash", label: "Cash" }, { value: "momo", label: "Mobile money" }].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setPaymentMethod(opt.value)}
                                    className={`h-12 rounded-2xl border-2 text-sm font-semibold transition ${
                                        paymentMethod === opt.value ? "border-[#ea690c] bg-orange-50 text-[#ea690c]" : "border-gray-200 text-gray-700"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-semibold">Confirmation code <span className="font-normal text-gray-500">(optional)</span></Label>
                        <Input
                            type="text"
                            value={confirmationCode}
                            onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                            placeholder="Code from the recipient"
                            className="mt-1.5 h-12 rounded-2xl uppercase tracking-widest"
                            maxLength={10}
                        />
                    </div>
                </div>
            </BottomSheet>

            {/* Delivery failed */}
            <BottomSheet
                open={showFailedModal && !!selectedAssignment}
                onClose={() => { setShowFailedModal(false); setSelectedAssignment(null); }}
                title="Delivery failed"
                subtitle={selectedAssignment ? `${selectedAssignment.parcel.receiverName || "Recipient"} · ${selectedAssignment.parcel.parcelId}` : undefined}
                footer={
                    <button
                        onClick={handleDeliveryFailed}
                        disabled={!failureReady || busy}
                        className="w-full h-12 rounded-2xl bg-red-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {busy ? <Loader className="w-4 h-4 animate-spin" /> : <XCircleIcon className="w-5 h-5" />}
                        {busy ? "Saving..." : "Return parcel to station"}
                    </button>
                }
            >
                <p className="text-sm text-gray-600 mb-3">What went wrong?</p>
                <div className="space-y-2">
                    {failureReasons.map((reason) => (
                        <button
                            key={reason}
                            type="button"
                            onClick={() => { setSelectedFailureReason(reason); if (reason !== "Other") setFailureReason(""); }}
                            className={`w-full text-left px-4 h-12 rounded-2xl border-2 text-sm font-medium transition ${
                                selectedFailureReason === reason ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-800"
                            }`}
                        >
                            {reason}
                        </button>
                    ))}
                </div>
                {selectedFailureReason === "Other" && (
                    <textarea
                        value={failureReason}
                        onChange={(e) => setFailureReason(e.target.value)}
                        placeholder="Describe what happened"
                        className="mt-3 w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-red-400 resize-none text-sm"
                        rows={3}
                        autoFocus
                    />
                )}
            </BottomSheet>
        </div>
    );
};
