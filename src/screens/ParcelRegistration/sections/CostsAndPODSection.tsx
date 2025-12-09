import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";

interface BulkEntrySession {
    driverName: string;
    vehicleNumber: string;
    entryDate: string;
    parcels: any[];
}

interface CostsAndPODSectionProps {
    onPrevious: () => void;
    onNext: () => void;
    bulkSession: BulkEntrySession | null;
}

export const CostsAndPODSection = ({
    onPrevious,
    onNext,
    bulkSession,
}: CostsAndPODSectionProps): JSX.Element => {
    // Calculate total value from bulk session
    const totalValue = bulkSession?.parcels.reduce((sum, p) => sum + (p.itemValue || 0), 0) || 0;

    return (
        <div className="w-full space-y-6">
            <div className="bg-white rounded-2xl border border-[#d1d1d1] p-6 shadow-sm">
                <h2 className="text-lg font-bold text-neutral-800 mb-6">Costs & Payment Details</h2>

                {/* ...existing code... */}
                <div className="space-y-4">
                    {/* Display mode info */}
                    {bulkSession && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                            <p className="text-sm font-semibold text-blue-900">
                                Bulk Entry: {bulkSession.parcels.length} parcels from {bulkSession.driverName}
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                                Total Item Value: GHC {totalValue.toFixed(2)}
                            </p>
                        </div>
                    )}

                    {/* Delivery Fee */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-2">
                            Base Delivery Fee (GHC)
                        </label>
                        <input
                            type="number"
                            placeholder="e.g., 5.00"
                            className="w-full px-4 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                        />
                    </div>

                    {/* Distance Charge */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-2">
                            Distance Charge (GHC)
                        </label>
                        <input
                            type="number"
                            placeholder="e.g., 2.50"
                            className="w-full px-4 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                        />
                    </div>

                    {/* Insurance Fee */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-2">
                            Insurance Fee (GHC)
                        </label>
                        <input
                            type="number"
                            placeholder="e.g., 1.00"
                            className="w-full px-4 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                        />
                    </div>
                </div>

                {/* ...existing code... */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-[#d1d1d1]">
                    <Button
                        onClick={onPrevious}
                        variant="outline"
                        className="flex-1 flex items-center justify-center gap-2 border border-[#888888] bg-transparent text-[#4f4f4f] hover:bg-gray-50"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span>Previous</span>
                    </Button>

                    <Button
                        onClick={onNext}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
                    >
                        <span>Next</span>
                        <ArrowRightIcon className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};