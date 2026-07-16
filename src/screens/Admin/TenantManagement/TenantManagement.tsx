import { useState } from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Globe, Search, Plus, Building2, Users, MapPin, MoreVertical } from "lucide-react";

const MOCK_TENANTS = [
    { id: "1", name: "M&M Logistics", plan: "enterprise", branches: 5, users: 42, status: "active", createdAt: "2024-01-15" },
    { id: "2", name: "Swift Parcels Ltd", plan: "growth", branches: 3, users: 18, status: "active", createdAt: "2024-03-22" },
    { id: "3", name: "Accra Express", plan: "starter", branches: 1, users: 6, status: "active", createdAt: "2024-06-10" },
    { id: "4", name: "GoldCoast Delivery", plan: "growth", branches: 2, users: 14, status: "suspended", createdAt: "2024-02-08" },
    { id: "5", name: "Kumasi Couriers", plan: "starter", branches: 1, users: 4, status: "active", createdAt: "2024-08-01" },
];

const planColors: Record<string, string> = {
    starter: "bg-gray-100 text-gray-700",
    growth: "bg-blue-100 text-blue-700",
    enterprise: "bg-purple-100 text-purple-700",
};

const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    suspended: "bg-red-100 text-red-700",
};

export const TenantManagement = (): JSX.Element => {
    const [search, setSearch] = useState("");

    const filtered = MOCK_TENANTS.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: "Total Tenants", value: MOCK_TENANTS.length, icon: Globe, color: "text-indigo-600", bg: "bg-indigo-50" },
                        { label: "Active", value: MOCK_TENANTS.filter(t => t.status === "active").length, icon: Building2, color: "text-green-600", bg: "bg-green-50" },
                        { label: "Total Branches", value: MOCK_TENANTS.reduce((s, t) => s + t.branches, 0), icon: MapPin, color: "text-orange-600", bg: "bg-orange-50" },
                        { label: "Total Users", value: MOCK_TENANTS.reduce((s, t) => s + t.users, 0), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    ].map(card => (
                        <Card key={card.label} className="border border-[#d1d1d1] bg-white shadow-sm">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[#5d5d5d]">{card.label}</p>
                                    <p className="text-2xl font-bold text-neutral-800 mt-1">{card.value}</p>
                                </div>
                                <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>
                                    <card.icon className={`w-5 h-5 ${card.color}`} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Table */}
                <Card className="border border-[#d1d1d1] bg-white shadow-sm">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                            <h2 className="text-base font-bold text-neutral-800">All Tenants</h2>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search tenants..."
                                        className="pl-9 border-[#d1d1d1] h-9 text-sm"
                                    />
                                </div>
                                <Button className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 h-9 text-sm flex items-center gap-1.5 shrink-0">
                                    <Plus className="w-4 h-4" /> Add Tenant
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-[#d1d1d1]">
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 uppercase tracking-wider">Tenant</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 uppercase tracking-wider">Plan</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-700 uppercase tracking-wider">Branches</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-700 uppercase tracking-wider">Users</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 uppercase tracking-wider">Status</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-700 uppercase tracking-wider">Created</th>
                                        <th className="py-3 px-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#d1d1d1]">
                                    {filtered.map((tenant, i) => (
                                        <tr key={tenant.id} className={`hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                                                        <Building2 className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-neutral-800">{tenant.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${planColors[tenant.plan]}`}>
                                                    {tenant.plan}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right text-sm text-neutral-700">{tenant.branches}</td>
                                            <td className="py-3 px-4 text-right text-sm text-neutral-700">{tenant.users}</td>
                                            <td className="py-3 px-4">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${statusColors[tenant.status]}`}>
                                                    {tenant.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-[#5d5d5d]">{tenant.createdAt}</td>
                                            <td className="py-3 px-4">
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                    <MoreVertical className="w-4 h-4 text-[#5d5d5d]" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filtered.length === 0 && (
                                <div className="text-center py-10 text-sm text-[#5d5d5d]">No tenants found.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
