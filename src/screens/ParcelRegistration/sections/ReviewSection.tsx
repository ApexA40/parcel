import { ArrowLeftIcon, CheckCircleIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";

interface BulkEntrySession {
    driverName: string;
    vehicleNumber: string;
    entryDate: string;
    parcels: any[];
}

interface ReviewSectionProps {
    onPrevious: () => void;
    bulkSession: BulkEntrySession | null;
    onEndBulk: () => void;
}

export const ReviewSection = ({
    onPrevious,
    bulkSession,
    onEndBulk,
}: ReviewSectionProps): JSX.Element => {
    const handleConfirm = () => {
        // Handle parcel submission logic here
        console.log("Parcels submitted:", bulkSession?.parcels);
        onEndBulk();
    };

    if (!bulkSession) {
        return (
            <div className="bg-white rounded-2xl border border-[#d1d1d1] p-6 shadow-sm">
                <p className="text-neutral-800">No bulk session data available</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <div className="bg-white rounded-2xl border border-[#d1d1d1] p-6 shadow-sm">
                <header className="inline-flex items-center gap-2 mb-6">
                    <CheckCircleIcon className="w-6 h-6 text-[#ea690c]" />
                    <h1 className="text-lg font-bold text-[#ea690c]">
                        Review Bulk Entry
                    </h1>
                </header>

                <div className="space-y-6">
                    {/* Driver Details */}
                    <div>
                        <h2 className="font-semibold text-neutral-800 mb-3">Driver Information</h2>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <p className="text-xs text-[#5d5d5d] mb-1">Driver Name</p>
                                <p className="font-semibold text-neutral-800">{bulkSession.driverName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#5d5d5d] mb-1">Vehicle Number</p>
                                <p className="font-semibold text-neutral-800">{bulkSession.vehicleNumber}</p>
                            </div>
                        </div>
                    </div>

                    {/* Parcels Summary */}
                    <div>
                        <h2 className="font-semibold text-neutral-800 mb-3">
                            Parcels Summary ({bulkSession.parcels.length})
                        </h2>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {bulkSession.parcels.map((parcel, index) => (
                                <div key={index} className="p-3 border border-[#d1d1d1] rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-semibold text-neutral-800">{parcel.recipientName}</p>
                                            <p className="text-xs text-[#5d5d5d]">{parcel.phoneNumber}</p>
                                        </div>
                                        <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            {parcel.shelf}
                                        </span>
                                    </div>
                                    {parcel.itemDescription && (
                                        <p className="text-xs text-[#5d5d5d]">
                                            Description: {parcel.itemDescription}
                                        </p>
                                    )}
                                    {parcel.itemValue > 0 && (
                                        <p className="text-xs font-medium text-[#ea690c]">
                                            Value: GHC {parcel.itemValue.toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={onPrevious}
                            variant="outline"
                            className="flex-1 flex items-center justify-center gap-2 border border-[#888888] bg-transparent text-[#4f4f4f] hover:bg-gray-50"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                            <span>Previous</span>
                        </Button>

                        <Button
                            onClick={handleConfirm}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
                        >
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Confirm & Submit</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};