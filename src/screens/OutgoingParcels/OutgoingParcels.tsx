import { useState, useEffect } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { SearchIcon, PackageIcon, TruckIcon, UserIcon, PhoneIcon, PrinterIcon, Edit2Icon, TrashIcon, XCircleIcon, X, ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import axios from "axios";
import authService from "../../services/authService";
import { useToast } from "../../components/ui/toast";
import { API_ENDPOINTS } from "../../config/api";
import { normalizePhoneNumber, validatePhoneNumber } from "../../utils/dataHelpers";

interface Parcel {
  parcelId: string;
  senderName: string;
  senderPhoneNumber: string;
  receiverName: string;
  recieverPhoneNumber: string;
  deliveryAddress: string;
  parcelDescription: string;
  driverName: string;
  driverPhoneNumber: string;
  vehicleNumber: string;
  inboundCost: number;
  ItemCost: number;
  POD: boolean;
  from: {
    officeId: string;
    officeName: string;
  };
  to: {
    officeId: string;
    officeName: string;
  };
  fromOfficeId: string;
  toOfficeId: string;
  typeofParcel: string;
  hasArrivedAtOffice: boolean;
  createdAt: number;
}

export const OutgoingParcels = (): JSX.Element => {
  const { showToast } = useToast();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteParcel, setDeleteParcel] = useState<Parcel | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [printParcel, setPrintParcel] = useState<Parcel | null>(null);
  const [editParcel, setEditParcel] = useState<Parcel | null>(null);
  const [editForm, setEditForm] = useState<Partial<Parcel>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewParcel, setViewParcel] = useState<Parcel | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());
  const [manifestGroup, setManifestGroup] = useState<{ key: string; driverName: string; driverPhoneNumber: string; vehicleNumber: string; parcels: Parcel[] } | null>(null);

  const toggleDriverSelect = (key: string) => setSelectedDrivers(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  const toggleSelectAll = (groups: typeof driverGroups) => {
    if (selectedDrivers.size === groups.length) setSelectedDrivers(new Set());
    else setSelectedDrivers(new Set(groups.map(g => g.key)));
  };


  useEffect(() => {
    fetchOutgoingParcels();
  }, []);

  const fetchOutgoingParcels = async () => {
    const token = authService.getToken();
    if (!token) {
      showToast("Authentication token not found", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_ENDPOINTS.FRONTDESK}/parcels/transfer/outgoing`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle paginated response
      const data = response.data;
      if (data && Array.isArray(data.content)) {
        setParcels(data.content);
      } else if (Array.isArray(data)) {
        setParcels(data);
      } else {
        setParcels([]);
      }
    } catch (error: any) {
      console.error("Error fetching outgoing parcels:", error);
      showToast(
        error.response?.data?.message || "Failed to fetch outgoing parcels",
        "error"
      );
      setParcels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditParcel = (parcel: Parcel) => {
    setEditParcel(parcel);
    setEditForm({
      senderName: parcel.senderName,
      senderPhoneNumber: parcel.senderPhoneNumber,
      receiverName: parcel.receiverName,
      recieverPhoneNumber: parcel.recieverPhoneNumber,
      deliveryAddress: parcel.deliveryAddress,
      parcelDescription: parcel.parcelDescription,
      driverName: parcel.driverName,
      driverPhoneNumber: parcel.driverPhoneNumber,
      vehicleNumber: parcel.vehicleNumber,
      inboundCost: parcel.inboundCost,
      ItemCost: parcel.ItemCost,
      POD: parcel.POD,
    });
  };

  const handlePhoneInput = (field: 'senderPhoneNumber' | 'recieverPhoneNumber' | 'driverPhoneNumber', value: string) => {
    // Only allow digits and + symbol
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure + only appears at the start
    if (cleaned.includes('+')) {
      const plusCount = (cleaned.match(/\+/g) || []).length;
      if (plusCount > 1 || cleaned.indexOf('+') !== 0) {
        cleaned = cleaned.replace(/\+/g, '');
        if (value.startsWith('+')) {
          cleaned = '+' + cleaned;
        }
      }
    }
    
    // Apply length restrictions based on format
    if (cleaned.startsWith('+233')) {
      // +233 format: max 13 chars (+233 + 9 digits)
      const prefix = '+233';
      const digits = cleaned.substring(4).replace(/\D/g, '');
      cleaned = prefix + digits.substring(0, 9);
    } else if (cleaned.startsWith('+')) {
      // Partial +233 entry
      cleaned = cleaned.substring(0, 13);
    } else if (cleaned.startsWith('0')) {
      // 0 format: max 10 chars (0 + 9 digits)
      cleaned = cleaned.substring(0, 10);
    } else {
      // Plain digits: max 9 chars
      cleaned = cleaned.substring(0, 9);
    }
    
    setEditForm({ ...editForm, [field]: cleaned });
  };

  const handleUpdateParcel = async () => {
    if (!editParcel) return;
    
    // Validate phone numbers
    if (editForm.senderPhoneNumber && !validatePhoneNumber(editForm.senderPhoneNumber)) {
      showToast("Invalid sender phone number format", "error");
      return;
    }
    if (editForm.recieverPhoneNumber && !validatePhoneNumber(editForm.recieverPhoneNumber)) {
      showToast("Invalid receiver phone number format", "error");
      return;
    }
    if (editForm.driverPhoneNumber && !validatePhoneNumber(editForm.driverPhoneNumber)) {
      showToast("Invalid driver phone number format", "error");
      return;
    }
    
    setIsUpdating(true);
    const token = authService.getToken();
    
    try {
      // Normalize phone numbers before sending
      const normalizedForm = {
        ...editForm,
        senderPhoneNumber: editForm.senderPhoneNumber ? normalizePhoneNumber(editForm.senderPhoneNumber) : editForm.senderPhoneNumber,
        recieverPhoneNumber: editForm.recieverPhoneNumber ? normalizePhoneNumber(editForm.recieverPhoneNumber) : editForm.recieverPhoneNumber,
        driverPhoneNumber: editForm.driverPhoneNumber ? normalizePhoneNumber(editForm.driverPhoneNumber) : editForm.driverPhoneNumber,
      };
      
      await axios.put(
        `${API_ENDPOINTS.FRONTDESK}/parcel/${editParcel.parcelId}`,
        normalizedForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      showToast("Parcel updated successfully", "success");
      
      // Update the parcel in the list
      setParcels(prev => prev.map(p => 
        p.parcelId === editParcel.parcelId 
          ? { ...p, ...normalizedForm }
          : p
      ));
      
      setEditParcel(null);
      setEditForm({});
    } catch (error: any) {
      console.error("Error updating parcel:", error);
      showToast(
        error.response?.data?.message || "Failed to update parcel",
        "error"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteParcel = async () => {
    if (!deleteParcel || deleteConfirmText.trim().toLowerCase() !== "delete") return;
    
    setIsDeleting(true);
    const token = authService.getToken();
    
    try {
      await axios.delete(`${API_ENDPOINTS.FRONTDESK}/parcel/${deleteParcel.parcelId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      showToast("Parcel deleted successfully", "success");
      setParcels(prev => prev.filter(p => p.parcelId !== deleteParcel.parcelId));
      setDeleteParcel(null);
      setDeleteConfirmText("");
    } catch (error: any) {
      console.error("Error deleting parcel:", error);
      showToast(
        error.response?.data?.message || "Failed to delete parcel",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrintParcel = (parcel: Parcel) => {
    // Set dynamic document title for PDF filename
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const receiverNameSlug = parcel.receiverName.replace(/\s+/g, '_');
    const trackingId = parcel.parcelId.slice(-6);
    const filename = `ParcelLabel_${receiverNameSlug}_${trackingId}_${timestamp}`;
    
    // Temporarily change document title for PDF save
    const originalTitle = document.title;
    document.title = filename;
    
    setPrintParcel(parcel);
    setTimeout(() => {
      window.print();
      // Restore original title after print dialog
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 100);
  };






  const handlePrintManifest = (group: typeof manifestGroup) => {
    if (!group) return;
    const timestamp = new Date().toISOString().split('T')[0];
    const slug = (group.driverName || 'driver').replace(/\s+/g, '_');
    const orig = document.title;
    document.title = `Manifest_${slug}_${timestamp}`;
    setManifestGroup(group);
    setTimeout(() => { window.print(); setTimeout(() => { document.title = orig; }, 1000); }, 100);
  };

  const handlePrintSelected = (groups: typeof driverGroups) => {
    const selected = groups.filter(g => selectedDrivers.has(g.key));
    if (!selected.length) { showToast('Select at least one driver', 'warning'); return; }
    // Print first selected; for multiple, merge into one manifest
    const merged = { key: 'merged', driverName: selected.length === 1 ? selected[0].driverName : 'Multiple Drivers', driverPhoneNumber: selected.length === 1 ? selected[0].driverPhoneNumber : '', vehicleNumber: selected.length === 1 ? selected[0].vehicleNumber : '', parcels: selected.flatMap(g => g.parcels) };
    handlePrintManifest(merged);
  };

  const filteredParcels = parcels.filter((parcel) => {
    const query = searchQuery.toLowerCase();
    return (
      parcel.parcelId?.toLowerCase().includes(query) ||
      parcel.receiverName?.toLowerCase().includes(query) ||
      parcel.senderName?.toLowerCase().includes(query) ||
      parcel.recieverPhoneNumber?.toLowerCase().includes(query) ||
      parcel.driverName?.toLowerCase().includes(query)
    );
  });

  const groupedByDriver = filteredParcels.reduce((acc, parcel) => {
    const key = `${parcel.driverPhoneNumber || 'no-phone'}_${parcel.vehicleNumber || 'no-vehicle'}`;
    if (!acc[key]) acc[key] = { key, driverName: parcel.driverName, driverPhoneNumber: parcel.driverPhoneNumber, vehicleNumber: parcel.vehicleNumber, parcels: [] };
    acc[key].parcels.push(parcel);
    return acc;
  }, {} as Record<string, { key: string; driverName: string; driverPhoneNumber: string; vehicleNumber: string; parcels: Parcel[] }>);
  const driverGroups = Object.values(groupedByDriver);
  const [expandedDrivers, setExpandedDrivers] = useState<Set<string>>(new Set());
  const toggleDriver = (key: string) => setExpandedDrivers(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

  const itemsPerPage = 20;
  const totalPages = Math.ceil(driverGroups.length / itemsPerPage);
  const paginatedGroups = driverGroups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="border border-[#d1d1d1] bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2.5"><PackageIcon className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-xs text-[#5d5d5d]">Total Outgoing</p><p className="text-xl font-bold text-neutral-800">{parcels.length}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-[#d1d1d1] bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2.5"><TruckIcon className="h-5 w-5 text-green-600" /></div>
                <div><p className="text-xs text-[#5d5d5d]">In Transit</p><p className="text-xl font-bold text-neutral-800">{parcels.filter(p => !p.hasArrivedAtOffice).length}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-[#d1d1d1] bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-2.5"><PackageIcon className="h-5 w-5 text-orange-600" /></div>
                <div><p className="text-xs text-[#5d5d5d]">Arrived</p><p className="text-xl font-bold text-neutral-800">{parcels.filter(p => p.hasArrivedAtOffice).length}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-[#d1d1d1] bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2.5"><UserIcon className="h-5 w-5 text-purple-600" /></div>
                <div><p className="text-xs text-[#5d5d5d]">POD Parcels</p><p className="text-xl font-bold text-neutral-800">{parcels.filter(p => p.POD).length}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Card */}
        <Card className="border border-[#d1d1d1] bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-[#d1d1d1] bg-gray-50/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 rounded-xl"><PackageIcon className="w-5 h-5 text-[#ea690c]" /></div>
              <div>
                <h2 className="text-base font-semibold text-neutral-800">Outgoing Parcels</h2>
                <p className="text-xs text-[#5d5d5d]">Parcels sent from this station</p>
              </div>
            </div>
            <div className="relative w-full sm:w-72">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search receiver, driver, tracking ID..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-9 border-[#d1d1d1] h-9 text-sm" />
            </div>
          </div>

          <CardContent className="p-0">
            {/* Selection action bar */}
            {selectedDrivers.size > 0 && (
              <div className="flex items-center justify-between px-6 py-3 bg-orange-50 border-b border-[#d1d1d1]">
                <span className="text-sm font-medium text-neutral-800">{selectedDrivers.size} driver{selectedDrivers.size > 1 ? 's' : ''} selected</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePrintSelected(driverGroups)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ea690c] text-white text-xs font-medium hover:bg-[#d45d0a] transition-colors">
                    <PrinterIcon className="w-3.5 h-3.5" /> Print Manifest{selectedDrivers.size > 1 ? 's' : ''}
                  </button>
                  <button onClick={() => setSelectedDrivers(new Set())} className="text-xs text-[#5d5d5d] hover:text-neutral-800 px-2 py-1.5">Clear</button>
                </div>
              </div>
            )}
            {loading ? (
              <div className="py-16 text-center">
                <div className="h-8 w-8 border-4 border-[#ea690c] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-neutral-700">Loading parcels...</p>
              </div>
            ) : filteredParcels.length === 0 ? (
              <div className="py-16 text-center">
                <PackageIcon className="h-12 w-12 text-[#9a9a9a] mx-auto mb-3 opacity-50" />
                <p className="text-neutral-700 font-medium">No outgoing parcels found</p>
                <p className="text-sm text-[#5d5d5d] mt-1">{searchQuery ? "Try adjusting your search" : "Parcels sent from this station will appear here"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 w-8">
                        <input type="checkbox" checked={selectedDrivers.size === paginatedGroups.length && paginatedGroups.length > 0} onChange={() => toggleSelectAll(paginatedGroups)} className="rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">Driver</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">Vehicle</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">Parcels</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">In Transit</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">Arrived</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">Total Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">Manifest</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {paginatedGroups.map((group, gi) => {
                      const isExpanded = expandedDrivers.has(group.key);
                      const total = group.parcels.reduce((s, p) => s + (p.inboundCost || 0) + (p.POD ? (p.ItemCost || 0) : 0), 0);
                      return (
                        <>
                          {/* Driver header row */}
                          <tr
                            key={group.key}
                            className={`cursor-pointer transition-colors border-b border-gray-200 ${ isExpanded ? 'bg-orange-50' : gi % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/40 hover:bg-gray-100/60'}`}
                          >
                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" checked={selectedDrivers.has(group.key)} onChange={() => toggleDriverSelect(group.key)} className="rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]" />
                            </td>
                            <td className="px-4 py-3" onClick={() => toggleDriver(group.key)}>
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-green-100 rounded-lg"><TruckIcon className="w-4 h-4 text-green-600" /></div>
                                <div>
                                  <p className="text-sm font-semibold text-neutral-800">{group.driverName || 'Unknown Driver'}</p>
                                  <p className="text-xs text-[#5d5d5d]">{group.driverPhoneNumber || ''}</p>
                                </div>
                                {isExpanded
                                  ? <ChevronDownIcon className="w-4 h-4 text-[#ea690c] ml-1" />
                                  : <ChevronRightIcon className="w-4 h-4 text-gray-400 ml-1" />}
                              </div>
                            </td>
                            <td className="px-4 py-3" onClick={() => toggleDriver(group.key)}>
                              <span className="text-sm text-neutral-700">{group.vehicleNumber || '—'}</span>
                            </td>
                            <td className="px-4 py-3 text-center" onClick={() => toggleDriver(group.key)}>
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-[#ea690c] text-xs font-bold">{group.parcels.length}</span>
                            </td>
                            <td className="px-4 py-3 text-center" onClick={() => toggleDriver(group.key)}>
                              <span className="text-sm font-medium text-yellow-700">{group.parcels.filter(p => !p.hasArrivedAtOffice).length}</span>
                            </td>
                            <td className="px-4 py-3 text-center" onClick={() => toggleDriver(group.key)}>
                              <span className="text-sm font-medium text-green-700">{group.parcels.filter(p => p.hasArrivedAtOffice).length}</span>
                            </td>
                            <td className="px-4 py-3 text-right" onClick={() => toggleDriver(group.key)}>
                              <span className="text-sm font-bold text-neutral-800">GHC {total.toFixed(2)}</span>
                            </td>
                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handlePrintManifest(group)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#ea690c] text-[#ea690c] hover:bg-orange-50 text-xs font-medium transition-colors mx-auto"
                              >
                                <PrinterIcon className="w-3.5 h-3.5" /> Manifest
                              </button>
                            </td>
                          </tr>

                          {/* Expanded parcel rows */}
                          {isExpanded && group.parcels.map((parcel, pi) => (
                            <tr key={parcel.parcelId} className={`border-b border-gray-100 ${pi % 2 === 0 ? 'bg-orange-50/30' : 'bg-orange-50/10'} hover:bg-orange-50/50 transition-colors`}>
                              <td className="px-4 py-2.5 border-l-2 border-[#ea690c]"></td>
                              <td className="px-4 py-2.5" colSpan={2}>
                                <div className="flex items-center gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-neutral-800">{parcel.receiverName}</p>
                                    <p className="text-xs text-[#5d5d5d]">{parcel.recieverPhoneNumber}</p>
                                  </div>
                                  <span className="text-xs font-mono text-[#ea690c] bg-orange-50 px-1.5 py-0.5 rounded">{parcel.parcelId.slice(-8)}</span>
                                  {parcel.to?.officeName && <span className="text-xs text-[#5d5d5d]">→ {parcel.to.officeName}</span>}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ parcel.POD ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {parcel.POD ? 'POD' : 'Regular'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-center" colSpan={2}>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ parcel.hasArrivedAtOffice ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                  {parcel.hasArrivedAtOffice ? 'Arrived' : 'In Transit'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5" colSpan={2}>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-semibold text-neutral-800 ml-auto">
                                    GHC {((parcel.inboundCost || 0) + (parcel.POD ? (parcel.ItemCost || 0) : 0)).toFixed(2)}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); setViewParcel(parcel); }} className="p-1 rounded text-[#5d5d5d] hover:bg-white hover:text-neutral-800 transition-colors" title="View"><UserIcon className="w-3.5 h-3.5" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handlePrintParcel(parcel); }} className="p-1 rounded text-[#5d5d5d] hover:bg-white hover:text-neutral-800 transition-colors" title="Print"><PrinterIcon className="w-3.5 h-3.5" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleEditParcel(parcel); }} className="p-1 rounded text-[#5d5d5d] hover:bg-white hover:text-neutral-800 transition-colors" title="Edit"><Edit2Icon className="w-3.5 h-3.5" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setDeleteParcel(parcel); }} className="p-1 rounded text-[#5d5d5d] hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete"><TrashIcon className="w-3.5 h-3.5" /></button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Parcel Modal */}
        {editParcel && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl border border-[#d1d1d1] bg-white shadow-lg max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Edit2Icon className="w-5 h-5 text-[#ea690c]" />
                    <h3 className="text-lg font-bold text-neutral-800">Edit Parcel</h3>
                  </div>
                  <button
                    onClick={() => { setEditParcel(null); setEditForm({}); }}
                    className="text-[#9a9a9a] hover:text-neutral-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-blue-800">{editParcel.parcelId}</p>
                  </div>

                  {/* Sender Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-neutral-800">Sender Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Sender Name</label>
                        <Input
                          value={editForm.senderName || ""}
                          onChange={(e) => setEditForm({ ...editForm, senderName: e.target.value })}
                          className="border-[#d1d1d1]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Sender Phone</label>
                        <Input
                          value={editForm.senderPhoneNumber || ""}
                          onChange={(e) => handlePhoneInput('senderPhoneNumber', e.target.value)}
                          placeholder="+233 XX XXX XXXX or 0XXXXXXXXX"
                          className="border-[#d1d1d1]"
                        />
                        <p className="text-[11px] text-[#5d5d5d] mt-1">Format: +233XXXXXXXXX or 0XXXXXXXXX</p>
                      </div>
                    </div>
                  </div>

                  {/* Receiver Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-neutral-800">Receiver Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Receiver Name</label>
                        <Input
                          value={editForm.receiverName || ""}
                          onChange={(e) => setEditForm({ ...editForm, receiverName: e.target.value })}
                          className="border-[#d1d1d1]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Receiver Phone</label>
                        <Input
                          value={editForm.recieverPhoneNumber || ""}
                          onChange={(e) => handlePhoneInput('recieverPhoneNumber', e.target.value)}
                          placeholder="+233 XX XXX XXXX or 0XXXXXXXXX"
                          className="border-[#d1d1d1]"
                        />
                        <p className="text-[11px] text-[#5d5d5d] mt-1">Format: +233XXXXXXXXX or 0XXXXXXXXX</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">Delivery Address</label>
                      <Input
                        value={editForm.deliveryAddress || ""}
                        onChange={(e) => setEditForm({ ...editForm, deliveryAddress: e.target.value })}
                        className="border-[#d1d1d1]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">Parcel Description</label>
                      <Input
                        value={editForm.parcelDescription || ""}
                        onChange={(e) => setEditForm({ ...editForm, parcelDescription: e.target.value })}
                        className="border-[#d1d1d1]"
                      />
                    </div>
                  </div>

                  {/* Driver Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-neutral-800">Driver Details</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Driver Name</label>
                        <Input
                          value={editForm.driverName || ""}
                          onChange={(e) => setEditForm({ ...editForm, driverName: e.target.value })}
                          className="border-[#d1d1d1]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Driver Phone</label>
                        <Input
                          value={editForm.driverPhoneNumber || ""}
                          onChange={(e) => handlePhoneInput('driverPhoneNumber', e.target.value)}
                          placeholder="+233 XX XXX XXXX or 0XXXXXXXXX"
                          className="border-[#d1d1d1]"
                        />
                        <p className="text-[11px] text-[#5d5d5d] mt-1">Format: +233XXXXXXXXX or 0XXXXXXXXX</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Vehicle Number</label>
                        <Input
                          value={editForm.vehicleNumber || ""}
                          onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value })}
                          className="border-[#d1d1d1]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Costs */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-neutral-800">Costs</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Transportation Cost</label>
                        <Input
                          type="number"
                          value={editForm.inboundCost || 0}
                          onChange={(e) => setEditForm({ ...editForm, inboundCost: parseFloat(e.target.value) || 0 })}
                          className="border-[#d1d1d1]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-800 mb-1">Item Cost</label>
                        <Input
                          type="number"
                          value={editForm.ItemCost || 0}
                          onChange={(e) => setEditForm({ ...editForm, ItemCost: parseFloat(e.target.value) || 0 })}
                          className="border-[#d1d1d1]"
                          disabled={!editForm.POD}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.POD || false}
                        onChange={(e) => setEditForm({ ...editForm, POD: e.target.checked, ItemCost: e.target.checked ? editForm.ItemCost : 0 })}
                        className="h-4 w-4"
                      />
                      <label className="text-xs font-semibold text-neutral-800">
                        Enable POD (Payment on Delivery)
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[#d1d1d1]">
                    <Button
                      onClick={() => { setEditParcel(null); setEditForm({}); }}
                      variant="outline"
                      className="flex-1 border border-[#d1d1d1]"
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateParcel}
                      disabled={isUpdating}
                      className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Updating...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteParcel && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border border-[#d1d1d1] bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                    <h3 className="text-lg font-bold text-neutral-800">Delete Parcel</h3>
                  </div>
                  <button
                    onClick={() => { setDeleteParcel(null); setDeleteConfirmText(""); }}
                    className="text-[#9a9a9a] hover:text-neutral-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-red-800">{deleteParcel.parcelId}</p>
                    <p className="text-xs text-red-600 mt-0.5">{deleteParcel.receiverName}</p>
                  </div>

                  <p className="text-sm text-neutral-700">
                    This will permanently delete this parcel. This action cannot be undone.
                  </p>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-800 mb-1">
                      Type <span className="font-mono text-red-600">delete</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder="Type delete here..."
                      className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Button
                      onClick={() => { setDeleteParcel(null); setDeleteConfirmText(""); }}
                      variant="outline"
                      className="flex-1 border border-[#d1d1d1]"
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteParcel}
                      disabled={deleteConfirmText.trim().toLowerCase() !== "delete" || isDeleting}
                      className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Deleting...
                        </>
                      ) : (
                        "Confirm Delete"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        {/* View Parcel Details Modal */}
        {viewParcel && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl border border-[#d1d1d1] bg-white shadow-lg max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-neutral-800">Parcel Details</h3>
                  <button
                    onClick={() => setViewParcel(null)}
                    className="text-[#9a9a9a] hover:text-neutral-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Basic Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Tracking ID</p>
                        <p className="font-semibold text-[#ea690c] text-sm">{viewParcel.parcelId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Parcel Type</p>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          viewParcel.typeofParcel === "ONLINE" || viewParcel.POD
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {viewParcel.typeofParcel === "ONLINE" || viewParcel.POD ? "POD" : "Regular"}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Status</p>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          viewParcel.hasArrivedAtOffice
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {viewParcel.hasArrivedAtOffice ? "Arrived" : "In Transit"}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Created Date</p>
                        <p className="font-semibold text-neutral-800 text-sm">
                          {new Date(viewParcel.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Receiver Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Receiver Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Receiver Name</p>
                        <p className="font-semibold text-neutral-800 text-sm">{viewParcel.receiverName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Phone Number</p>
                        <p className="font-semibold text-neutral-800 text-sm">
                          {viewParcel.recieverPhoneNumber || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-[#5d5d5d] mb-1">Delivery Address</p>
                        <p className="text-sm text-neutral-700">{viewParcel.deliveryAddress || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sender Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Sender Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Sender Name</p>
                        <p className="font-semibold text-neutral-800 text-sm">{viewParcel.senderName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Sender Phone</p>
                        <p className="font-semibold text-neutral-800 text-sm">
                          {viewParcel.senderPhoneNumber || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Route Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Route Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">From Office</p>
                        <p className="font-semibold text-neutral-800 text-sm">{viewParcel.from?.officeName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">To Office</p>
                        <p className="font-semibold text-neutral-800 text-sm">{viewParcel.to?.officeName || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Driver Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Driver Information</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Driver Name</p>
                        <p className="font-semibold text-neutral-800 text-sm">{viewParcel.driverName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Driver Phone</p>
                        <p className="font-semibold text-neutral-800 text-sm">
                          {viewParcel.driverPhoneNumber || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5d5d] mb-1">Vehicle Number</p>
                        <p className="font-semibold text-neutral-800 text-sm">{viewParcel.vehicleNumber || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Parcel Description */}
                  {viewParcel.parcelDescription && (
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Parcel Description</h4>
                      <p className="text-sm text-neutral-700">{viewParcel.parcelDescription}</p>
                    </div>
                  )}

                  {/* Cost Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800 mb-3 pb-2 border-b border-[#d1d1d1]">Cost Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#5d5d5d]">Transportation Cost</span>
                        <span className="font-semibold text-neutral-800 text-sm">GHC {(viewParcel.inboundCost || 0).toFixed(2)}</span>
                      </div>
                      {(viewParcel.POD || viewParcel.typeofParcel === "ONLINE") && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#5d5d5d]">Item Cost (POD)</span>
                          <span className="font-semibold text-neutral-800 text-sm">GHC {(viewParcel.ItemCost || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-[#d1d1d1] pt-3">
                        <span className="text-base font-bold text-neutral-800">Total Amount</span>
                        <span className="text-lg font-bold text-[#ea690c]">
                          GHC {((viewParcel.inboundCost || 0) + ((viewParcel.POD || viewParcel.typeofParcel === "ONLINE") ? (viewParcel.ItemCost || 0) : 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-[#d1d1d1] flex gap-3">
                    {!viewParcel.hasArrivedAtOffice && (
                      <>
                        <Button
                          onClick={() => { handlePrintParcel(viewParcel); setViewParcel(null); }}
                          variant="outline"
                          className="flex-1 border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
                        >
                          <PrinterIcon className="h-4 w-4 mr-2" />
                          Print Label
                        </Button>
                        <Button
                          onClick={() => { handleEditParcel(viewParcel); setViewParcel(null); }}
                          variant="outline"
                          className="flex-1 border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
                        >
                          <Edit2Icon className="h-4 w-4 mr-2" />
                          Edit Parcel
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => setViewParcel(null)}
                      variant="outline"
                      className="flex-1 border-[#d1d1d1]"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Print Preview Modal */}
        {printParcel && (
          <>
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #parcel-label-print, #parcel-label-print * {
                  visibility: visible;
                }
                #parcel-label-print {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  page-break-after: avoid;
                  page-break-before: avoid;
                  page-break-inside: avoid;
                }
                @page {
                  size: A4 landscape;
                  margin: 8mm;
                }
                html, body {
                  height: 100%;
                  overflow: hidden;
                }
              }
            `}</style>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl border border-[#d1d1d1] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-[#d1d1d1] p-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-800">Print Parcel Label</h3>
                  <Button
                    onClick={() => setPrintParcel(null)}
                    variant="outline"
                    className="border border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
                  >
                    Close
                  </Button>
                </div>
                
                <div className="p-6" id="parcel-label-print">
                  <ParcelLabel parcel={printParcel} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Manifest Print Modal */}
        {manifestGroup && (
          <>
            <style>{`
              @media print {
                body * { visibility: hidden; }
                #manifest-print, #manifest-print * { visibility: visible; }
                #manifest-print { position: absolute; left: 0; top: 0; width: 100%; }
                @page { size: A4 portrait; margin: 10mm; }
              }
            `}</style>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl border border-[#d1d1d1] w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-[#d1d1d1] p-4 flex items-center justify-between">
                  <h3 className="text-base font-bold text-neutral-800">Driver Manifest — {manifestGroup.driverName}</h3>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => window.print()} className="bg-[#ea690c] text-white hover:bg-[#d45d0a] h-9 text-sm">
                      <PrinterIcon className="w-4 h-4 mr-1.5" /> Print
                    </Button>
                    <Button onClick={() => setManifestGroup(null)} variant="outline" className="border border-[#d1d1d1] h-9 text-sm">Close</Button>
                  </div>
                </div>
                <div className="p-6" id="manifest-print">
                  <DriverManifest group={manifestGroup} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Driver Manifest Component
interface DriverManifestProps {
  group: { key: string; driverName: string; driverPhoneNumber: string; vehicleNumber: string; parcels: Parcel[] };
}
const DriverManifest: React.FC<DriverManifestProps> = ({ group }) => {
  const total = group.parcels.reduce((s, p) => s + (p.inboundCost || 0) + (p.POD ? (p.ItemCost || 0) : 0), 0);
  const podCount = group.parcels.filter(p => p.POD).length;
  return (
    <div className="bg-white border-2 border-black p-4">
      {/* Header — same as ParcelLabel */}
      <div className="text-center border-b-2 border-black pb-2 mb-3">
        <div className="flex items-center justify-center gap-3 mb-1">
          <img src="/logo-1.png" alt="M&M Logo" className="h-16 w-16 object-contain" />
          <div>
            <h1 className="text-3xl font-bold text-black">Mealex &amp; Mailex (M&amp;M)</h1>
            <p className="text-base text-black">Parcel Delivery System</p>
          </div>
        </div>
      </div>

      {/* Manifest title bar — black bar like tracking number bar */}
      <div className="text-center mb-3 bg-black text-white py-3 px-4">
        <p className="text-sm font-semibold mb-0.5">DRIVER MANIFEST</p>
        <p className="text-2xl font-bold tracking-wider">{new Date().toLocaleDateString()} · {new Date().toLocaleTimeString()}</p>
      </div>

      {/* Driver info + summary counts — bordered boxes like sender/receiver */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="border-2 border-black p-2">
          <p className="text-xs font-bold text-black mb-1">DRIVER INFORMATION</p>
          <p className="text-base text-black mb-0.5"><span className="font-bold">NAME:</span> {group.driverName || '—'}</p>
          <p className="text-base text-black mb-0.5"><span className="font-bold">PHONE:</span> {group.driverPhoneNumber || '—'}</p>
          <p className="text-base text-black"><span className="font-bold">VEHICLE:</span> {group.vehicleNumber || '—'}</p>
        </div>
        <div className="border-2 border-black p-2">
          <p className="text-xs font-bold text-black mb-1">PARCEL SUMMARY</p>
          <div className="grid grid-cols-3 gap-1 mt-1">
            <div className="border border-black p-1 text-center">
              <p className="text-xs font-bold text-black">TOTAL</p>
              <p className="text-2xl font-bold text-black">{group.parcels.length}</p>
            </div>
            <div className="border border-black p-1 text-center">
              <p className="text-xs font-bold text-black">REGULAR</p>
              <p className="text-2xl font-bold text-black">{group.parcels.length - podCount}</p>
            </div>
            <div className="border border-black p-1 text-center">
              <p className="text-xs font-bold text-black">POD</p>
              <p className="text-2xl font-bold text-black">{podCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Parcel table */}
      <table className="w-full border-2 border-black mb-3">
        <thead>
          <tr className="bg-black text-white">
            <th className="border-r border-white px-2 py-2 text-left text-xs font-bold">#</th>
            <th className="border-r border-white px-2 py-2 text-center text-xs font-bold">✓</th>
            <th className="border-r border-white px-2 py-2 text-left text-xs font-bold">Tracking ID</th>
            <th className="border-r border-white px-2 py-2 text-left text-xs font-bold">Receiver</th>
            <th className="border-r border-white px-2 py-2 text-left text-xs font-bold">Phone</th>
            <th className="border-r border-white px-2 py-2 text-left text-xs font-bold">Destination</th>
            <th className="border-r border-white px-2 py-2 text-center text-xs font-bold">Type</th>
            <th className="px-2 py-2 text-right text-xs font-bold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {group.parcels.map((p, i) => (
            <tr key={p.parcelId} className="border-b border-black">
              <td className="border-r border-black px-2 py-1.5 text-xs text-black">{i + 1}</td>
              <td className="border-r border-black px-2 py-1.5 text-center"><div className="w-4 h-4 border-2 border-black mx-auto" /></td>
              <td className="border-r border-black px-2 py-1.5 text-xs font-semibold text-black">{p.parcelId.slice(-8)}</td>
              <td className="border-r border-black px-2 py-1.5 text-xs text-black">{p.receiverName}</td>
              <td className="border-r border-black px-2 py-1.5 text-xs text-black">{p.recieverPhoneNumber}</td>
              <td className="border-r border-black px-2 py-1.5 text-xs text-black">{p.to?.officeName || '—'}</td>
              <td className="border-r border-black px-2 py-1.5 text-center text-xs text-black">
                <span className="inline-block border border-black px-1.5 py-0.5 text-xs font-bold">{p.POD ? 'POD' : 'REG'}</span>
              </td>
              <td className="px-2 py-1.5 text-xs text-right font-semibold text-black">GHC {((p.inboundCost || 0) + (p.POD ? (p.ItemCost || 0) : 0)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-black text-white">
            <td colSpan={7} className="border-r border-white px-2 py-2 text-sm font-bold text-right">TOTAL AMOUNT:</td>
            <td className="px-2 py-2 text-sm font-bold text-right">GHC {total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Signature section — bordered like payment details */}
      <div className="border-2 border-black p-2 mb-3">
        <p className="text-sm font-bold text-black mb-3">SIGNATURES</p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-bold text-black mb-6">Driver Signature</p>
            <div className="border-b-2 border-black mb-1" />
            <p className="text-xs text-black">Name: {group.driverName || '_________________'}</p>
            <p className="text-xs text-black mt-0.5">Date: _________________</p>
          </div>
          <div>
            <p className="text-xs font-bold text-black mb-6">Authorised By</p>
            <div className="border-b-2 border-black mb-1" />
            <p className="text-xs text-black">Name: _________________</p>
            <p className="text-xs text-black mt-0.5">Date: _________________</p>
          </div>
        </div>
      </div>

      {/* Footer — same as ParcelLabel */}
      <div className="pt-2 border-t border-black text-center">
        <p className="text-sm text-black">For inquiries, contact M&amp;M Parcel Services</p>
      </div>
    </div>
  );
};

// Parcel Label Component for printing
interface ParcelLabelProps {
  parcel: Parcel;
}

const ParcelLabel: React.FC<ParcelLabelProps> = ({ parcel }) => {
  return (
    <div className="bg-white border-2 border-black p-4 print:border print:p-4">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-2 mb-3">
        <div className="flex items-center justify-center gap-3 mb-1">
          <img
            src="/logo-1.png"
            alt="M&M Logo"
            className="h-16 w-16 object-contain"
          />
          <div>
            <h1 className="text-3xl font-bold text-black">
              Mealex & Mailex (M&M)
            </h1>
            <p className="text-base text-black">Parcel Delivery System</p>
          </div>
        </div>
      </div>

      {/* Tracking Number */}
      <div className="text-center mb-3 bg-black text-white py-3 px-4">
        <p className="text-sm font-semibold mb-0.5">TRACKING NUMBER</p>
        <p className="text-4xl font-bold tracking-wider">{parcel.parcelId}</p>
      </div>

      {/* Sender & Receiver */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="border-2 border-black p-2">
          <p className="text-base text-black mb-1">
            <span className="font-bold">SENDER:</span> {parcel.senderName}
          </p>
          <p className="text-base text-black">
            <span className="font-bold">CONTACT:</span> {parcel.senderPhoneNumber}
          </p>
        </div>
        <div className="border-2 border-black p-2">
          <p className="text-base text-black mb-1">
            <span className="font-bold">RECEIVER:</span> {parcel.receiverName}
          </p>
          <p className="text-base text-black">
            <span className="font-bold">CONTACT:</span> {parcel.recieverPhoneNumber}
          </p>
        </div>
      </div>

      {/* Delivery Address */}
      {parcel.deliveryAddress && (
        <div className="border-2 border-black p-2 mb-3">
          <p className="text-sm font-bold text-black">
            DELIVERY ADDRESS: <span className="font-normal text-xl">{parcel.deliveryAddress}</span>
          </p>
        </div>
      )}

      {/* Item Description */}
      {parcel.parcelDescription && (
        <div className="border-2 border-black p-2 mb-3">
          <p className="text-sm font-bold text-black">
            ITEM DESCRIPTION: <span className="font-normal text-base">{parcel.parcelDescription}</span>
          </p>
        </div>
      )}

      {/* Payment Details */}
      <div className="border-2 border-black p-2 mb-3">
        <p className="text-sm font-bold text-black mb-1">PAYMENT DETAILS</p>
        <div className="space-y-1 text-base">
          <div className="flex justify-between">
            <span className="text-black">Transportation Cost:</span>
            <span className="font-semibold text-black">
              GHC {(parcel.inboundCost || 0).toFixed(2)}
            </span>
          </div>
          {parcel.POD && (
            <div className="flex justify-between">
              <span className="text-black">Item Cost (POD):</span>
              <span className="font-semibold text-black">
                GHC {(parcel.ItemCost || 0).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-black pt-1 mt-1">
            <span className="font-bold text-black">TOTAL AMOUNT:</span>
            <span className="font-bold text-xl text-black">
              GHC {((parcel.inboundCost || 0) + (parcel.POD ? (parcel.ItemCost || 0) : 0)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Parcel Type Badge - Only show for POD parcels */}
      {parcel.POD && (
        <div className="text-center mb-2">
          <span className="inline-block bg-black text-white px-4 py-2 text-base font-bold">
            POD PARCEL
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-black text-center">
        <p className="text-sm text-black">
          Date: {new Date(parcel.createdAt).toLocaleDateString()} | Time: {new Date(parcel.createdAt).toLocaleTimeString()}
        </p>
        <p className="text-sm text-black mt-0.5">
          For inquiries, contact M&M Parcel Services
        </p>
      </div>
    </div>
  );
};
