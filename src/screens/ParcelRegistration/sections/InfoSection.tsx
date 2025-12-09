import { useState } from "react";

interface BulkEntrySession {
    driverName: string;
    vehicleNumber: string;
    entryDate: string;
    parcels: any[];
}

interface InfoSectionProps {
    onNext: () => void;
    entryMode: "single" | "bulk";
    onStartBulk: (driverName: string, vehicleNumber: string) => void;
    bulkSession: BulkEntrySession | null;
    onAddParcel: (parcelData: any) => void;
}

export const InfoSection = ({
    onNext,
    entryMode,
    onStartBulk,
    bulkSession,
    onAddParcel,
}: InfoSectionProps): JSX.Element => {
    const [driverName, setDriverName] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [recipientName, setRecipientName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [itemDescription, setItemDescription] = useState("");
    const [shelf, setShelf] = useState("");
    const [itemValue, setItemValue] = useState("");

    const handleStartBulkEntry = () => {
        if (driverName.trim() && vehicleNumber.trim()) {
            onStartBulk(driverName, vehicleNumber);
        }
    };

    const handleAddParcelToBulk = () => {
        if (recipientName.trim() && phoneNumber.trim() && shelf.trim()) {
            const parcelData = {
                id: `PAK-${Date.now()}`,
                recipientName,
                phoneNumber,
                itemDescription,
                shelf,
                itemValue: itemValue ? parseFloat(itemValue) : 0,
            };
            onAddParcel(parcelData);

            // Reset form
            setRecipientName("");
            setPhoneNumber("");
            setItemDescription("");
            setShelf("");
            setItemValue("");
        }
    };

    const handleSingleEntryNext = () => {
        if (recipientName.trim() && phoneNumber.trim() && shelf.trim()) {
            onNext();
        }
    };

    if (entryMode === "bulk" && bulkSession) {
        return (
            <div className="w-full space-y-6">
                <div className="bg-white rounded-2xl border border-[#d1d1d1] p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-neutral-800 mb-4">Add Parcel to Bulk Session</h2>

                    {/* ...existing code... */}
                    <div className="space-y-4">
                        {/* Recipient Name */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                Recipient Name <span className="text-[#e22420]">*</span>
                            </label>
                            <input
                                type="text"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                placeholder="Enter recipient name"
                                className="w-full px-4 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                            />
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                Phone Number <span className="text-[#e22420]">*</span>
                            </label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Enter phone number"
                                className="w-full px-4 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                            />
                        </div>

                        {/* Item Description */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                Item Description
                            </label>
                            <input
                                type="text"
                                value={itemDescription}
                                onChange={(e) => setItemDescription(e.target.value)}
                                placeholder="Enter item description"
                                className="w-full px-4 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                            />
                        </div>

                        {/* Shelf Location */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                Shelf Location <span className="text-[#e22420]">*</span>
                            </label>
                            <select
                                value={shelf}
                                onChange={(e) => setShelf(e.target.value)}
                                className="w-full px-4 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                            >
                                <option value="">Select a shelf</option>
                                <option value="A1">A1</option>
                                <option value="A2">A2</option>
                                <option value="B1">B1</option>
                                <option value="B2">B2</option>
                            </select>
                        </div>

                        {/* Item Value */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                Item Value (GHC)
                            </label>
                            <input
                                type="number"
                                value={itemValue}
                                onChange={(e) => setItemValue(e.target.value)}
                                placeholder="Enter item value"
                                className="w-full px-4 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                            />
                        </div>
                    </div>

                    {/* ...existing code... */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleAddParcelToBulk}
                            className="flex-1 bg-[#ea690c] text-white font-medium py-2 rounded-lg hover:bg-[#ea690c]/90 transition-colors"
                        >
                            Add Parcel
                        </button>
                    </div>

                    {/* Parcels Added List */}
                    {bulkSession.parcels.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-[#d1d1d1]">
                            <h3 className="font-semibold text-neutral-800 mb-3">
                                Parcels Added ({bulkSession.parcels.length})
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {bulkSession.parcels.map((parcel, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="text-sm">
                                            <p className="font-medium text-neutral-800">{parcel.recipientName}</p>
                                            <p className="text-xs text-[#5d5d5d]">{parcel.phoneNumber}</p>
                                        </div>
                                        <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            {parcel.shelf}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Single Entry Mode
    return (
        <div className="w-full space-y-6">
            <div className="bg-white rounded-2xl border border-[#d1d1d1] p-6 shadow-sm">
                <h2 className="text-lg font-bold text-neutral-800 mb-4">Entry Mode Selection</h2>

                {/* Mode Selection Buttons */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                        onClick={handleStartBulkEntry}
                        className="p-4 border-2 border-[#ea690c] bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                        <div className="font-semibold text-[#ea690c]">Bulk Entry</div>
                        <div className="text-xs text-[#5d5d5d]">Multiple parcels from one driver</div>
                    </button>
                    <button
                        onClick={() => setDriverName("single")}
                        className="p-4 border-2 border-[#d1d1d1] bg-white rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="font-semibold text-neutral-800">Single Entry</div>
                        <div className="text-xs text-[#5d5d5d]">One parcel at a time</div>
                    </button>
                </div>

                {/* Bulk Entry Form */}
                {driverName !== "single" && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-neutral-800">Start Bulk Entry Session</h3>

                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                Driver Name <span className="text-[#e22420]">*</span>
                            </label>
                            <input
                                type="text"
                                value={driverName}
                                onChange={(e) => setDriverName(e.target.value)}
                                placeholder="Enter driver name"
                                className="w-full px-4 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                Vehicle Number <span className="text-[#e22420]">*</span>
                            </label>
                            <input
                                type="text"
                                value={vehicleNumber}
                                onChange={(e) => setVehicleNumber(e.target.value)}
                                placeholder="Enter vehicle number"
                                className="w-full px-4 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                            />
                        </div>

                        <button
                            onClick={handleStartBulkEntry}
                            disabled={!driverName.trim() || !vehicleNumber.trim()}
                            className="w-full bg-[#ea690c] text-white font-medium py-2 rounded-lg hover:bg-[#ea690c]/90 disabled:opacity-50 transition-colors"
                        >
                            Start Bulk Entry
                        </button>
                    </div>
                )}

                {/* Single Entry Form */}
                {driverName === "single" && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-neutral-800">Single Parcel Entry</h3>

                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                Recipient Name <span className="text-[#e22420]">*</span>
                            </label>
                            <input
                                type="text"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                placeholder="Enter recipient name"
                                className="w-full px-4 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                Phone Number <span className="text-[#e22420]">*</span>
                            </label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Enter phone number"
                                className="w-full px-4 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                Shelf Location <span className="text-[#e22420]">*</span>
                            </label>
                            <select
                                value={shelf}
                                onChange={(e) => setShelf(e.target.value)}
                                className="w-full px-4 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                            >
                                <option value="">Select a shelf</option>
                                <option value="A1">A1</option>
                                <option value="A2">A2</option>
                                <option value="B1">B1</option>
                                <option value="B2">B2</option>
                            </select>
                        </div>

                        <button
                            onClick={handleSingleEntryNext}
                            disabled={!recipientName.trim() || !phoneNumber.trim() || !shelf.trim()}
                            className="w-full bg-[#ea690c] text-white font-medium py-2 rounded-lg hover:bg-[#ea690c]/90 disabled:opacity-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};