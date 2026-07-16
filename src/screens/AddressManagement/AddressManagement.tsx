import { useState, useEffect } from "react";
import { Plus, X, Loader, MapPin, Search } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import frontdeskService, { Address } from "../../services/frontdeskService";
import { useToast } from "../../components/ui/toast";
import { formatCurrency } from "../../utils/dataHelpers";
import { useStation } from "../../contexts/StationContext";

export const AddressManagement = (): JSX.Element => {
    const { userRole } = useStation();
    const { showToast } = useToast();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAddressName, setNewAddressName] = useState("");
    const [newAddressCost, setNewAddressCost] = useState<string>("");
    const [adding, setAdding] = useState(false);
    const [search, setSearch] = useState("");

    const canManage = userRole === "MANAGER" || userRole === "ADMIN";

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const response = await frontdeskService.getAddresses();
            if (response.success && Array.isArray(response.data)) {
                setAddresses(
                    response.data.sort((a: Address, b: Address) =>
                        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
                    )
                );
            } else {
                setAddresses([]);
            }
        } catch {
            setAddresses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAddresses(); }, []);

    const filtered = search.trim()
        ? addresses.filter((a) => a.name.toLowerCase().includes(search.trim().toLowerCase()))
        : addresses;

    const handleAdd = async () => {
        if (!newAddressName.trim()) { showToast("Please enter an address name", "warning"); return; }
        const cost = Number(newAddressCost);
        if (Number.isNaN(cost) || cost < 0) { showToast("Please enter a valid cost", "warning"); return; }
        setAdding(true);
        try {
            const response = await frontdeskService.addAddress(newAddressName.trim(), cost);
            if (response.success) {
                showToast(response.message || "Address saved successfully", "success");
                setNewAddressName("");
                setNewAddressCost("");
                setShowAddModal(false);
                fetchAddresses();
            } else {
                showToast(response.message || "Failed to save address", "error");
            }
        } catch {
            showToast("Failed to save address. Please try again.", "error");
        } finally {
            setAdding(false);
        }
    };

    const closeModal = () => { setShowAddModal(false); setNewAddressName(""); setNewAddressCost(""); };

    return (
        <div className="flex flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8" style={{ height: "calc(100vh - 64px)" }}>
            <div className="mx-auto w-full max-w-6xl flex flex-col flex-1 min-h-0">
                <Card className="border border-[#d1d1d1] bg-white rounded-2xl shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#d1d1d1] bg-gray-50/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-orange-50 rounded-xl">
                                <MapPin className="w-5 h-5 text-[#ea690c]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-neutral-800">Saved Addresses</h2>
                                <p className="text-xs text-[#5d5d5d]">Delivery address presets with cost for this office</p>
                            </div>
                        </div>
                        {canManage && (
                            <Button onClick={() => setShowAddModal(true)} className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2 shrink-0">
                                <Plus size={18} /> Add Address
                            </Button>
                        )}
                    </div>

                    <div className="px-6 pt-4 pb-3 border-b border-gray-100 shrink-0">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by address name..." className="pl-9 border border-[#d1d1d1] rounded-lg bg-gray-50/50 focus:bg-white" />
                        </div>
                    </div>

                    <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto">
                        {loading ? (
                            <div className="py-16 text-center">
                                <Loader className="w-10 h-10 text-[#ea690c] mx-auto mb-4 animate-spin" />
                                <p className="text-sm text-[#5d5d5d]">Loading addresses...</p>
                            </div>
                        ) : addresses.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="inline-flex p-4 bg-gray-100 rounded-2xl mb-4"><MapPin className="w-14 h-14 text-[#9a9a9a]" /></div>
                                <p className="text-neutral-800 font-semibold">No saved addresses</p>
                                <p className="text-sm text-[#5d5d5d] mt-1 max-w-sm mx-auto">
                                    {canManage ? "Add address presets to reuse when registering parcels." : "No addresses saved for this office."}
                                </p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="inline-flex p-4 bg-gray-100 rounded-2xl mb-4"><Search className="w-14 h-14 text-[#9a9a9a]" /></div>
                                <p className="text-neutral-800 font-semibold">No addresses found</p>
                                <p className="text-sm text-[#5d5d5d] mt-1">No addresses match "{search}".</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100 w-8">#</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100">Address name</th>
                                        <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map((addr, i) => (
                                        <tr key={addr.id} className="bg-white hover:bg-gray-50/80 transition-colors">
                                            <td className="py-3.5 px-6 text-xs text-[#9a9a9a]">{i + 1}</td>
                                            <td className="py-3.5 px-4 text-sm font-medium text-neutral-800">{addr.name}</td>
                                            <td className="py-3.5 px-6 text-sm text-right font-semibold text-[#ea690c]">{formatCurrency(addr.cost)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {showAddModal && canManage && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md rounded-2xl border border-[#d1d1d1] bg-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 rounded-lg"><MapPin className="w-5 h-5 text-[#ea690c]" /></div>
                                    <h2 className="text-lg font-bold text-neutral-800">Add Address</h2>
                                </div>
                                <button onClick={closeModal} className="text-[#5d5d5d] hover:bg-gray-100 p-1 rounded transition-colors"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label className="block text-sm font-semibold text-neutral-800 mb-2">Address name <span className="text-[#e22420]">*</span></Label>
                                    <Input value={newAddressName} onChange={(e) => setNewAddressName(e.target.value)} placeholder="e.g. East Legon, Adenta" className="border border-[#d1d1d1] w-full" onKeyDown={(e) => e.key === "Enter" && handleAdd()} autoFocus />
                                </div>
                                <div>
                                    <Label className="block text-sm font-semibold text-neutral-800 mb-2">Cost (GHC)</Label>
                                    <Input type="number" min={0} step={1} value={newAddressCost} onChange={(e) => setNewAddressCost(e.target.value)} placeholder="0" className="border border-[#d1d1d1] w-full" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <Button onClick={closeModal} variant="outline" className="flex-1 border border-[#d1d1d1] text-neutral-700 hover:bg-gray-50">Cancel</Button>
                                <Button onClick={handleAdd} disabled={!newAddressName.trim() || adding} className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50">
                                    {adding ? <><Loader className="w-4 h-4 animate-spin mr-2" />Saving...</> : "Save Address"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
