
import { DollarSignIcon, TrendingUpIcon, CreditCardIcon, UserCheckIcon } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { useStation } from "../../contexts/StationContext";

interface FinancialSummary {
    totalDeliveryEarnings: number;
    totalDriverPayments: number;
    totalItemCollections: number;
    pendingPayments: number;
    driverBreakdown: Array<{
        driverId: string;
        driverName: string;
        deliveriesCompleted: number;
        amountEarned: number;
    }>;
}

export const FinancialDashboard = (): JSX.Element => {
    useStation();

    // Mock data - replace with API calls
    const financialData: FinancialSummary = {
        totalDeliveryEarnings: 5250.00,
        totalDriverPayments: 3150.00,
        totalItemCollections: 8920.00,
        pendingPayments: 1200.00,
        driverBreakdown: [
            { driverId: "DRV-001", driverName: "John Mensah", deliveriesCompleted: 24, amountEarned: 1200.00 },
            { driverId: "DRV-002", driverName: "Kwame Asante", deliveriesCompleted: 18, amountEarned: 950.00 },
            { driverId: "DRV-003", driverName: "Ama Kofi", deliveriesCompleted: 15, amountEarned: 850.00 },
        ],
    };

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Financial Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Delivery Earnings</p>
                                        <h3 className="text-2xl font-bold text-neutral-800">
                                            GHC {financialData.totalDeliveryEarnings.toFixed(2)}
                                        </h3>
                                    </div>
                                    <DollarSignIcon className="w-12 h-12 text-[#ea690c] opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Item Collections</p>
                                        <h3 className="text-2xl font-bold text-neutral-800">
                                            GHC {financialData.totalItemCollections.toFixed(2)}
                                        </h3>
                                    </div>
                                    <CreditCardIcon className="w-12 h-12 text-blue-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Driver Payments</p>
                                        <h3 className="text-2xl font-bold text-neutral-800">
                                            GHC {financialData.totalDriverPayments.toFixed(2)}
                                        </h3>
                                    </div>
                                    <UserCheckIcon className="w-12 h-12 text-green-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[#5d5d5d]">Pending Payments</p>
                                        <h3 className="text-2xl font-bold text-[#e22420]">
                                            GHC {financialData.pendingPayments.toFixed(2)}
                                        </h3>
                                    </div>
                                    <TrendingUpIcon className="w-12 h-12 text-orange-500 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Driver Breakdown Table */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-bold text-neutral-800 mb-4">
                                Driver Performance & Earnings
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[#d1d1d1]">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Driver Name
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Deliveries Completed
                                            </th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Amount Earned
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {financialData.driverBreakdown.map((driver) => (
                                            <tr key={driver.driverId} className="border-b border-[#d1d1d1] hover:bg-gray-50">
                                                <td className="py-4 px-4 text-sm font-medium text-neutral-800">
                                                    {driver.driverName}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-neutral-700">
                                                    {driver.deliveriesCompleted}
                                                </td>
                                                <td className="py-4 px-4 text-sm font-semibold text-right text-[#ea690c]">
                                                    GHC {driver.amountEarned.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
};
