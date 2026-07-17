import { useState } from "react";
import { Search, Plus, Building2, Users, MapPin, Globe, MoreVertical } from "lucide-react";

const MOCK_TENANTS = [
    { id: "1", name: "M&M Logistics", plan: "enterprise", branches: 5, users: 42, status: "active", createdAt: "2024-01-15" },
    { id: "2", name: "Swift Parcels Ltd", plan: "growth", branches: 3, users: 18, status: "active", createdAt: "2024-03-22" },
    { id: "3", name: "Accra Express", plan: "starter", branches: 1, users: 6, status: "active", createdAt: "2024-06-10" },
    { id: "4", name: "GoldCoast Delivery", plan: "growth", branches: 2, users: 14, status: "suspended", createdAt: "2024-02-08" },
    { id: "5", name: "Kumasi Couriers", plan: "starter", branches: 1, users: 4, status: "active", createdAt: "2024-08-01" },
];

export const TenantManagement = (): JSX.Element => {
    const [search, setSearch] = useState("");

    const filtered = MOCK_TENANTS.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    const stats = [
        { label: "Total Tenants", value: MOCK_TENANTS.length, icon: Globe },
        { label: "Active", value: MOCK_TENANTS.filter(t => t.status === "active").length, icon: Building2 },
        { label: "Total Branches", value: MOCK_TENANTS.reduce((s, t) => s + t.branches, 0), icon: MapPin },
        { label: "Total Users", value: MOCK_TENANTS.reduce((s, t) => s + t.users, 0), icon: Users },
    ];

    return (
        <div className="w-full">
            <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:w-[80%] lg:max-w-none lg:px-0 lg:py-8">

                {/* Page Header */}
                <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Tenant Management</h1>
                        <p className="mt-1 text-sm text-[#7d7d7d]">Manage all tenants and their access on the platform.</p>
                    </div>
                    <button className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-[#ea690c] px-4 h-9 text-sm font-medium text-white shadow-sm hover:bg-[#d45d0a] transition-colors">
                        <Plus className="h-3.5 w-3.5" /> Add Tenant
                    </button>
                </div>

                {/* Stats */}
                <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {stats.map(s => (
                        <div key={s.label} className="rounded-2xl border border-[#e3e3e3] bg-white px-4 py-3 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a0a0a0]">{s.label}</p>
                                <p className="text-2xl font-bold text-neutral-900 mt-0.5">{s.value}</p>
                            </div>
                            <s.icon className="w-5 h-5 text-[#c8c8c8]" />
                        </div>
                    ))}
                </div>

                {/* Table Card */}
                <div className="rounded-2xl border border-[#e3e3e3] bg-white shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e3e3e3]">
                        <p className="text-sm font-semibold text-neutral-800">All Tenants</p>
                        <div className="relative w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a8a8a8]" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search tenants..."
                                className="w-full pl-8 pr-3 h-8 text-xs rounded-lg border border-[#dcdcdc] focus:outline-none focus:border-[#ea690c] focus:ring-2 focus:ring-[#ea690c]/20 bg-white transition-all"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#e3e3e3]">
                                    <th className="text-left py-2.5 px-5 text-[10px] font-semibold text-[#a0a0a0] uppercase tracking-widest">Tenant</th>
                                    <th className="text-left py-2.5 px-5 text-[10px] font-semibold text-[#a0a0a0] uppercase tracking-widest">Plan</th>
                                    <th className="text-right py-2.5 px-5 text-[10px] font-semibold text-[#a0a0a0] uppercase tracking-widest">Branches</th>
                                    <th className="text-right py-2.5 px-5 text-[10px] font-semibold text-[#a0a0a0] uppercase tracking-widest">Users</th>
                                    <th className="text-left py-2.5 px-5 text-[10px] font-semibold text-[#a0a0a0] uppercase tracking-widest">Status</th>
                                    <th className="text-left py-2.5 px-5 text-[10px] font-semibold text-[#a0a0a0] uppercase tracking-widest">Created</th>
                                    <th className="py-2.5 px-5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f0f0]">
                                {filtered.map(tenant => (
                                    <tr key={tenant.id} className="hover:bg-[#fafafa] transition-colors">
                                        <td className="py-3 px-5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-lg border border-[#e3e3e3] bg-[#fafafa] flex items-center justify-center shrink-0">
                                                    <Building2 className="w-3.5 h-3.5 text-[#b0b0b0]" />
                                                </div>
                                                <span className="text-sm font-medium text-neutral-800">{tenant.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5">
                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 capitalize">
                                                {tenant.plan}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 text-right text-sm text-[#7d7d7d]">{tenant.branches}</td>
                                        <td className="py-3 px-5 text-right text-sm text-[#7d7d7d]">{tenant.users}</td>
                                        <td className="py-3 px-5">
                                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
                                                tenant.status === "active"
                                                    ? "bg-neutral-800 text-white"
                                                    : "bg-neutral-100 text-neutral-400 line-through"
                                            }`}>
                                                {tenant.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 text-sm text-[#a0a0a0]">{tenant.createdAt}</td>
                                        <td className="py-3 px-5">
                                            <button className="p-1 rounded-lg hover:bg-neutral-100 transition-colors">
                                                <MoreVertical className="w-4 h-4 text-[#a0a0a0]" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="text-center py-12 text-sm text-[#a0a0a0]">No tenants found.</div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-2.5 border-t border-[#f0f0f0]">
                        <p className="text-[11px] text-[#a0a0a0]">{filtered.length} tenant{filtered.length !== 1 ? "s" : ""}</p>
                    </div>
                </div>

            </div>
        </div>
    );
};
