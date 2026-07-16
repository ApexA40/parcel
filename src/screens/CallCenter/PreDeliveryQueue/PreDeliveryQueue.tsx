import { useState, useEffect, useCallback, useRef } from "react";
import {
    Loader, PhoneCall, X, Package, MapPin, Home, Store,
    RefreshCw, ChevronDown, User, Phone, PhoneOff, Building2,
} from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { useToast } from "../../../components/ui/toast";
import { useLocation } from "../../../contexts/LocationContext";
import { useStation } from "../../../contexts/StationContext";
import { formatPhoneNumber, formatDate, formatCurrency } from "../../../utils/dataHelpers";
import adminService from "../../../services/adminService";
import frontdeskService from "../../../services/frontdeskService";

interface Parcel {
    parcelId: string;
    receiverName?: string;
    recieverPhoneNumber?: string;
    receiverAddress?: string;
    senderName?: string;
    parcelDescription?: string;
    inboundCost?: number;
    deliveryCost?: number;
    hasCalled?: boolean;
    homeDelivery?: boolean;
    createdAt?: number;
    shelfName?: string;
}

type QueueTab = "uncalled" | "called-pickup";

interface CacheEntry {
    parcels: Parcel[];
    pagination: { page: number; size: number; totalElements: number; totalPages: number };
    ts: number;
}

const CACHE_TTL = 60_000; // 60 seconds
const queueCache = new Map<string, CacheEntry>();

export const PreDeliveryQueue = () => {
    const { showToast } = useToast();
    const { stations } = useLocation();
    const { userRole, userOfficeId, userOfficeName } = useStation();

    const isHubRole = userRole === "MANAGER" || userRole === "FRONTDESK";

    const [tab, setTab] = useState<QueueTab>("uncalled");
    const [selectedOfficeId, setSelectedOfficeId] = useState(() => isHubRole ? (userOfficeId ?? "") : "");
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 0, size: 20, totalElements: 0, totalPages: 0 });

    // Edit modal
    const [editParcel, setEditParcel] = useState<Parcel | null>(null);
    const [homeDelivery, setHomeDelivery] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryCost, setDeliveryCost] = useState("");
    const [saving, setSaving] = useState(false);
    const [lastFetched, setLastFetched] = useState<Date | null>(null);

    const fetchParcels = useCallback(async (page = 0, currentTab: QueueTab = tab, force = false) => {
        if (!selectedOfficeId) return;
        const cacheKey = `${selectedOfficeId}:${currentTab}:${page}`;
        // Serve from cache if fresh and not a forced refresh
        if (!force) {
            const cached = queueCache.get(cacheKey);
            if (cached && Date.now() - cached.ts < CACHE_TTL) {
                setParcels(cached.parcels);
                setPagination(cached.pagination);
                setLastFetched(new Date(cached.ts));
                return;
            }
        }
        setLoading(true);
        try {
            const response = await adminService.searchParcels({
                officeId: selectedOfficeId,
                isDelivered: false,
                isParcelAssigned: false,
                hasCalled: currentTab === "uncalled" ? false : true,
                page,
                size: 20,
            });
            if (response.success && response.data) {
                const data = response.data as any;
                let content: Parcel[] = Array.isArray(data.content) ? data.content : [];
                if (currentTab === "called-pickup") {
                    content = content.filter(p => !p.homeDelivery);
                }
                const newPagination = {
                    page: data.number ?? page,
                    size: data.size ?? 20,
                    totalElements: data.totalElements ?? content.length,
                    totalPages: data.totalPages ?? 1,
                };
                // Write to cache
                queueCache.set(cacheKey, { parcels: content, pagination: newPagination, ts: Date.now() });
                setParcels(content);
                setPagination(newPagination);
                setLastFetched(new Date());
            } else {
                showToast(response.message || "Failed to load parcels", "error");
                setParcels([]);
            }
        } catch {
            showToast("Failed to load parcels", "error");
            setParcels([]);
        } finally {
            setLoading(false);
        }
    }, [selectedOfficeId, tab, showToast]);

    // For hub roles, keep selectedOfficeId in sync if userOfficeId changes (e.g. after login)
    useEffect(() => {
        if (isHubRole && userOfficeId) setSelectedOfficeId(userOfficeId);
    }, [isHubRole, userOfficeId]);

    useEffect(() => {
        if (selectedOfficeId) fetchParcels(0, tab);
        else setParcels([]);
    }, [selectedOfficeId, tab]);

    const handleTabChange = (newTab: QueueTab) => {
        setTab(newTab);
        // Don't clear parcels if cache has fresh data for this tab
        const cacheKey = `${selectedOfficeId}:${newTab}:0`;
        const cached = queueCache.get(cacheKey);
        if (!cached || Date.now() - cached.ts >= CACHE_TTL) {
            setParcels([]);
        }
    };

    const openEdit = (parcel: Parcel) => {
        setEditParcel(parcel);
        setHomeDelivery(parcel.homeDelivery ?? false);
        setDeliveryAddress(parcel.receiverAddress ?? "");
        setDeliveryCost(parcel.deliveryCost ? String(parcel.deliveryCost) : "");
    };

    const handleSave = async () => {
        if (!editParcel) return;
        if (homeDelivery && !deliveryAddress.trim()) {
            showToast("Please enter a delivery address", "warning");
            return;
        }
        setSaving(true);
        try {
            const response = await frontdeskService.updateParcel(editParcel.parcelId, {
                hasCalled: true,
                homeDelivery,
                receiverAddress: deliveryAddress.trim() || undefined,
                deliveryCost: homeDelivery ? parseFloat(deliveryCost) || 0 : 0,
            });
            if (response.success) {
                showToast("Parcel updated successfully", "success");
                setEditParcel(null);
                // Invalidate cache for current tab so next visit re-fetches
                queueCache.delete(`${selectedOfficeId}:${tab}:${pagination.page}`);
                // Remove from current list — it will move to watchlist if homeDelivery=true
                setParcels(prev => prev.filter(p => p.parcelId !== editParcel.parcelId));
            } else {
                showToast(response.message || "Failed to update parcel", "error");
            }
        } catch {
            showToast("Failed to update parcel", "error");
        } finally {
            setSaving(false);
        }
    };

    const tabs: { key: QueueTab; label: string; desc: string }[] = [
        { key: "uncalled", label: "Not Called", desc: "Registered parcels awaiting first contact" },
        { key: "called-pickup", label: "Called – Station Pickup", desc: "Already called, client chose station pickup" },
    ];

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                {/* Header */}
                {isHubRole ? (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-neutral-800">Pre-Delivery Queue</h1>
                            <p className="text-xs text-[#5d5d5d] mt-0.5">
                                Call registered clients, confirm delivery preference, and update parcel details.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {userOfficeName && (
                                <div className="flex items-center gap-1.5 rounded-lg border border-[#d1d1d1] bg-white px-3 py-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-[#5d5d5d]" />
                                    <span className="text-xs font-semibold text-neutral-800">{userOfficeName}</span>
                                </div>
                            )}
                            {selectedOfficeId && !loading && (
                                <div className="flex items-center gap-1.5 rounded-lg border border-[#d1d1d1] bg-white px-3 py-1.5">
                                    <Package className="w-3.5 h-3.5 text-[#5d5d5d]" />
                                    <span className="text-xs font-semibold text-neutral-800">{pagination.totalElements}</span>
                                    <span className="text-xs text-[#5d5d5d]">{tab === "uncalled" ? "awaiting call" : "station pickup"}</span>
                                </div>
                            )}
                            {loading && (
                                <div className="flex items-center gap-1.5 rounded-lg border border-[#d1d1d1] bg-white px-3 py-1.5">
                                    <Loader className="w-3.5 h-3.5 text-[#ea690c] animate-spin" />
                                    <span className="text-xs text-[#5d5d5d]">Loading...</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <header>
                        <h1 className="text-xl font-bold text-neutral-800">Pre-Delivery Queue</h1>
                        <p className="text-xs text-[#5d5d5d] mt-0.5">
                            Call registered clients, confirm delivery preference, and update parcel details.
                        </p>
                    </header>
                )}

                {/* Tab toggle */}
                <div className="flex gap-2 border-b border-[#d1d1d1]">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => handleTabChange(t.key)}
                            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                                tab === t.key
                                    ? "border-[#ea690c] text-[#ea690c]"
                                    : "border-transparent text-gray-500 hover:text-neutral-800"
                            }`}
                        >
                            {t.label}
                            {isHubRole && tab === t.key && !loading && pagination.totalElements > 0 && (
                                <span className="inline-flex items-center justify-center rounded-full bg-[#ea690c] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1">
                                    {pagination.totalElements > 99 ? "99+" : pagination.totalElements}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <p className="text-xs text-[#5d5d5d] -mt-2">
                    {tabs.find(t => t.key === tab)?.desc}
                </p>

                {/* Station selector — only shown to CALLER role */}
                {!isHubRole ? (
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row gap-3 items-end">
                                <div className="flex-1">
                                    <Label className="text-xs text-[#5d5d5d] mb-1.5 block">Select Station</Label>
                                    <div className="relative">
                                        <select
                                            value={selectedOfficeId}
                                            onChange={e => setSelectedOfficeId(e.target.value)}
                                            className="w-full h-9 pl-3 pr-8 border border-[#d1d1d1] rounded-md text-sm bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#ea690c]"
                                        >
                                            <option value="">— Choose a station —</option>
                                            {stations.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <Button
                                    onClick={() => fetchParcels(0, tab)}
                                    disabled={!selectedOfficeId || loading}
                                    variant="outline"
                                    size="sm"
                                    className="border-[#ea690c] text-[#ea690c] hover:bg-orange-50 h-9"
                                >
                                    <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                                    Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* Hub role: just a refresh button, station is auto-set */
                    <div className="flex items-center justify-between">
                        {lastFetched && (
                            <p className="text-xs text-[#9a9a9a]">
                                Updated {lastFetched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                        )}
                        <Button
                            onClick={() => fetchParcels(0, tab, true)}
                            disabled={loading}
                            variant="outline"
                            size="sm"
                            className="border-[#ea690c] text-[#ea690c] hover:bg-orange-50 h-9 ml-auto"
                        >
                            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                )}

                {/* Stats — only for CALLER side, hub shows it in header */}
                {!isHubRole && selectedOfficeId && !loading && (
                    <p className="text-sm text-gray-500">
                        <span className="font-semibold text-neutral-800">{pagination.totalElements}</span> {tab === "uncalled" ? "parcels awaiting contact" : "called station-pickup parcels"}
                    </p>
                )}

                {/* Table */}
                <Card className="border border-[#d1d1d1] bg-white">
                    <CardContent className="p-0">
                        {!selectedOfficeId ? (
                            <div className="text-center py-16">
                                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-[#5d5d5d]">
                                    {isHubRole ? "Your station could not be determined. Please contact your admin." : "Select a station to load the queue."}
                                </p>
                            </div>
                        ) : loading ? (
                            <div className="text-center py-16">
                                {isHubRole ? (
                                    <>
                                        <div className="inline-flex items-center gap-2 rounded-lg border border-[#d1d1d1] bg-white px-4 py-2.5 shadow-sm">
                                            <Loader className="w-4 h-4 text-[#ea690c] animate-spin" />
                                            <span className="text-sm text-[#5d5d5d]">Fetching queue for <span className="font-semibold text-neutral-800">{userOfficeName || "your station"}</span>...</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Loader className="w-8 h-8 text-[#ea690c] mx-auto mb-3 animate-spin" />
                                        <p className="text-sm text-[#5d5d5d]">Loading parcels...</p>
                                    </>
                                )}
                            </div>
                        ) : parcels.length === 0 ? (
                            <div className="text-center py-16">
                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                {isHubRole ? (
                                    <>
                                        <p className="text-sm font-semibold text-neutral-800">
                                            {tab === "uncalled" ? "All caught up!" : "No station pickups"}
                                        </p>
                                        <p className="text-xs text-[#5d5d5d] mt-1">
                                            {tab === "uncalled"
                                                ? "Every parcel at this station has been contacted."
                                                : "No parcels are waiting for station pickup."}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-semibold text-neutral-800">No parcels found</p>
                                        <p className="text-xs text-[#5d5d5d] mt-1">
                                            {tab === "uncalled" ? "All parcels at this station have been called." : "No called station-pickup parcels at this station."}
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full divide-y divide-[#d1d1d1]">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Recipient</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Phone</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Shelf</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Inbound</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Registered</th>
                                            {tab === "called-pickup" && (
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-800 uppercase tracking-wider">Status</th>
                                            )}
                                            <th className="py-3 px-4 text-center text-xs font-semibold text-neutral-800 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-[#d1d1d1]">
                                        {parcels.map(p => isHubRole ? (
                                            /* ── Hub row ── */
                                            <tr key={p.parcelId} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="py-3 px-4">
                                                    <p className="font-semibold text-sm text-neutral-800 leading-tight">{p.receiverName || "N/A"}</p>
                                                    <p className="text-[10px] text-[#9a9a9a] font-mono mt-0.5">{p.parcelId}</p>
                                                    {p.senderName && (
                                                        <p className="text-[10px] text-[#5d5d5d] mt-0.5">From: {p.senderName}</p>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <a
                                                        href={`tel:${p.recieverPhoneNumber}`}
                                                        className="inline-flex items-center gap-1.5 text-[#ea690c] hover:underline text-sm font-medium"
                                                    >
                                                        <Phone className="w-3 h-3" />
                                                        {p.recieverPhoneNumber ? formatPhoneNumber(p.recieverPhoneNumber) : "N/A"}
                                                    </a>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {p.shelfName ? (
                                                        <span className="inline-flex items-center rounded-md border border-[#d1d1d1] bg-gray-50 px-2 py-0.5 text-xs font-medium text-neutral-700">
                                                            {p.shelfName}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[#9a9a9a] text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm font-semibold text-neutral-800">
                                                        {p.inboundCost ? formatCurrency(p.inboundCost) : <span className="text-[#9a9a9a] font-normal">—</span>}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-xs text-[#5d5d5d] whitespace-nowrap">
                                                    {p.createdAt ? formatDate(new Date(p.createdAt).toISOString()) : "—"}
                                                </td>
                                                {tab === "called-pickup" && (
                                                    <td className="py-3 px-4">
                                                        <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">Station Pickup</Badge>
                                                    </td>
                                                )}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <a
                                                            href={`tel:${p.recieverPhoneNumber}`}
                                                            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded border border-[#d1d1d1] text-[#5d5d5d] hover:border-[#ea690c] hover:text-[#ea690c] hover:bg-orange-50 transition-colors text-xs font-medium"
                                                            title="Call"
                                                        >
                                                            <PhoneCall className="w-3.5 h-3.5" />
                                                            Call
                                                        </a>
                                                        <Button
                                                            onClick={() => openEdit(p)}
                                                            size="sm"
                                                            className="bg-[#ea690c] text-white hover:bg-[#d45d0a] text-xs h-8 px-3"
                                                        >
                                                            {tab === "called-pickup" ? "Req. Delivery" : "Update"}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            /* ── CALLER row (unchanged) ── */
                                            <tr key={p.parcelId} className="hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <p className="font-semibold text-sm text-neutral-800">{p.receiverName || "N/A"}</p>
                                                    {p.parcelDescription && (
                                                        <p className="text-xs text-gray-400 truncate max-w-[140px]">{p.parcelDescription}</p>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <a href={`tel:${p.recieverPhoneNumber}`} className="text-[#ea690c] hover:underline text-sm font-medium">
                                                        {p.recieverPhoneNumber ? formatPhoneNumber(p.recieverPhoneNumber) : "N/A"}
                                                    </a>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600">{p.shelfName || "—"}</td>
                                                <td className="py-3 px-4 text-sm font-medium text-neutral-800">
                                                    {p.inboundCost ? formatCurrency(p.inboundCost) : "—"}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600">
                                                    {p.createdAt ? formatDate(new Date(p.createdAt).toISOString()) : "—"}
                                                </td>
                                                {tab === "called-pickup" && (
                                                    <td className="py-3 px-4">
                                                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Station Pickup</Badge>
                                                    </td>
                                                )}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <a
                                                            href={`tel:${p.recieverPhoneNumber}`}
                                                            className="inline-flex items-center justify-center h-8 w-8 rounded border border-[#ea690c] text-[#ea690c] hover:bg-orange-50"
                                                            title="Call"
                                                        >
                                                            <PhoneCall className="w-4 h-4" />
                                                        </a>
                                                        <Button
                                                            onClick={() => openEdit(p)}
                                                            size="sm"
                                                            className="bg-[#ea690c] text-white hover:bg-[#d45d0a] text-xs h-8 px-3"
                                                        >
                                                            {tab === "called-pickup" ? "Request Delivery" : "Update"}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {!loading && pagination.totalPages > 1 && (
                            <div className="px-4 py-3 border-t border-[#d1d1d1] flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    {pagination.page * pagination.size + 1}–{Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of {pagination.totalElements}
                                </p>
                                <div className="flex gap-2">
                                    <Button onClick={() => fetchParcels(pagination.page - 1, tab)} disabled={pagination.page === 0} variant="outline" size="sm">Previous</Button>
                                    <Button onClick={() => fetchParcels(pagination.page + 1, tab)} disabled={pagination.page >= pagination.totalPages - 1} variant="outline" size="sm">Next</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Update / Request Delivery Modal */}
            {editParcel && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg border border-[#d1d1d1] bg-white shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-5 pb-4 border-b border-[#d1d1d1]">
                                <div>
                                    <h3 className="text-base font-bold text-neutral-800">
                                        {tab === "called-pickup" ? "Request Home Delivery" : "Update Delivery Preference"}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs text-gray-600">{editParcel.receiverName || "N/A"}</span>
                                        {editParcel.recieverPhoneNumber && (
                                            <>
                                                <Phone className="w-3.5 h-3.5 text-gray-400 ml-1" />
                                                <a href={`tel:${editParcel.recieverPhoneNumber}`} className="text-xs text-[#ea690c] hover:underline">
                                                    {formatPhoneNumber(editParcel.recieverPhoneNumber)}
                                                </a>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setEditParcel(null)} className="text-gray-400 hover:text-neutral-800 p-1 hover:bg-gray-100 rounded">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm font-semibold text-neutral-800 mb-2 block">Delivery Preference</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${!homeDelivery ? "border-[#ea690c] bg-orange-50" : "border-[#d1d1d1] hover:bg-gray-50"}`}>
                                            <input type="radio" checked={!homeDelivery} onChange={() => setHomeDelivery(false)} className="w-4 h-4 text-[#ea690c]" />
                                            <div className="flex items-center gap-1.5">
                                                <Store className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm font-medium text-neutral-800">Station Pickup</span>
                                            </div>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${homeDelivery ? "border-[#ea690c] bg-orange-50" : "border-[#d1d1d1] hover:bg-gray-50"}`}>
                                            <input type="radio" checked={homeDelivery} onChange={() => setHomeDelivery(true)} className="w-4 h-4 text-[#ea690c]" />
                                            <div className="flex items-center gap-1.5">
                                                <Home className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm font-medium text-neutral-800">Home Delivery</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {homeDelivery && (
                                    <>
                                        <div>
                                            <Label className="text-sm font-semibold text-neutral-800 mb-1.5 block">
                                                Delivery Address <span className="text-[#e22420]">*</span>
                                            </Label>
                                            <Input
                                                value={deliveryAddress}
                                                onChange={e => setDeliveryAddress(e.target.value)}
                                                placeholder="Enter full delivery address"
                                                className="h-9 border-[#d1d1d1] focus:border-[#ea690c]"
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
                                                className="h-9 border-[#d1d1d1] focus:border-[#ea690c]"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="rounded-lg border border-[#e8e8e8] bg-gray-50 divide-y divide-[#f0f0f0]">
                                    {isHubRole && (
                                        <div className="px-3 py-2 flex items-center justify-between">
                                            <span className="text-xs text-[#9a9a9a]">Parcel ID</span>
                                            <span className="text-xs font-mono font-medium text-neutral-800">{editParcel.parcelId}</span>
                                        </div>
                                    )}
                                    {editParcel.shelfName && (
                                        <div className="px-3 py-2 flex items-center justify-between">
                                            <span className="text-xs text-[#9a9a9a]">Shelf</span>
                                            <span className="text-xs font-medium text-neutral-800">{editParcel.shelfName}</span>
                                        </div>
                                    )}
                                    {editParcel.inboundCost !== undefined && (
                                        <div className="px-3 py-2 flex items-center justify-between">
                                            <span className="text-xs text-[#9a9a9a]">Inbound Cost</span>
                                            <span className="text-xs font-semibold text-neutral-800">{formatCurrency(editParcel.inboundCost)}</span>
                                        </div>
                                    )}
                                    {editParcel.senderName && (
                                        <div className="px-3 py-2 flex items-center justify-between">
                                            <span className="text-xs text-[#9a9a9a]">Sender</span>
                                            <span className="text-xs font-medium text-neutral-800">{editParcel.senderName}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-1">
                                    <Button onClick={() => setEditParcel(null)} variant="outline" className="flex-1 border-[#d1d1d1]" disabled={saving}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving || (homeDelivery && !deliveryAddress.trim())}
                                        className="flex-1 bg-[#ea690c] text-white hover:bg-[#d45d0a] disabled:opacity-50"
                                    >
                                        {saving ? <><Loader className="w-4 h-4 animate-spin mr-2" />Saving...</> : "Save"}
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
