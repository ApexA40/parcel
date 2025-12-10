import React, { useState } from "react";
import { Plus, Edit, Lock, Unlock, Phone, Mail, Building2 } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";

interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: "admin" | "station-manager" | "front-desk" | "call-center" | "rider";
    station: string;
    status: "active" | "disabled";
    lastLogin: string;
}

const roleColors = {
    admin: "bg-red-100 text-red-800",
    "station-manager": "bg-blue-100 text-blue-800",
    "front-desk": "bg-green-100 text-green-800",
    "call-center": "bg-yellow-100 text-yellow-800",
    rider: "bg-purple-100 text-purple-800",
};

export const UserManagement = (): JSX.Element => {
    const [users, setUsers] = useState<User[]>([
        {
            id: "USER-001",
            name: "Adams Godfred",
            email: "adams@example.com",
            phone: "+233 555 555 555",
            role: "front-desk",
            station: "Accra Central",
            status: "active",
            lastLogin: "2024-01-20 14:30",
        },
        {
            id: "USER-002",
            name: "Kwame Asante",
            email: "kwame@example.com",
            phone: "+233 555 123 456",
            role: "station-manager",
            station: "Kumasi Hub",
            status: "active",
            lastLogin: "2024-01-20 10:15",
        },
        {
            id: "USER-003",
            name: "Ama Mensah",
            email: "ama@example.com",
            phone: "+233 555 234 567",
            role: "call-center",
            station: "Accra Central",
            status: "active",
            lastLogin: "2024-01-19 16:45",
        },
    ]);

    const [showAddForm, setShowAddForm] = useState(false);
    const [filterRole, setFilterRole] = useState("");
    const [filterStation, setFilterStation] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    const filteredUsers = users.filter((user) => {
        if (filterRole && user.role !== filterRole) return false;
        if (filterStation && user.station !== filterStation) return false;
        if (filterStatus && user.status !== filterStatus) return false;
        return true;
    });

    const toggleUserStatus = (id: string) => {
        setUsers(
            users.map((user) =>
                user.id === id
                    ? { ...user, status: user.status === "active" ? "disabled" : "active" }
                    : user
            )
        );
    };

    const stations = [...new Set(users.map((u) => u.station))];

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-800">User Management</h1>
                            <p className="text-sm text-[#5d5d5d] mt-1">
                                Manage all system users across stations
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowAddForm(true)}
                            className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            New User
                        </Button>
                    </div>

                    {/* Filters */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Filter by Role
                                    </label>
                                    <select
                                        value={filterRole}
                                        onChange={(e) => setFilterRole(e.target.value)}
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                    >
                                        <option value="">All Roles</option>
                                        <option value="admin">Admin</option>
                                        <option value="station-manager">Station Manager</option>
                                        <option value="front-desk">Front Desk</option>
                                        <option value="call-center">Call Center</option>
                                        <option value="rider">Rider</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Filter by Station
                                    </label>
                                    <select
                                        value={filterStation}
                                        onChange={(e) => setFilterStation(e.target.value)}
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                    >
                                        <option value="">All Stations</option>
                                        {stations.map((station) => (
                                            <option key={station} value={station}>
                                                {station}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Filter by Status
                                    </label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="disabled">Disabled</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Users Table */}
                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[#d1d1d1]">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Name
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Contact
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Role
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Station
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Status
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#5d5d5d]">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id} className="border-b border-[#d1d1d1] hover:bg-gray-50">
                                                <td className="py-4 px-4">
                                                    <span className="font-medium text-neutral-800">{user.name}</span>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-neutral-700">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1">
                                                            <Mail size={14} className="text-[#5d5d5d]" />
                                                            {user.email}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Phone size={14} className="text-[#5d5d5d]" />
                                                            {user.phone}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Badge
                                                        className={`${roleColors[user.role as keyof typeof roleColors]
                                                            }`}
                                                    >
                                                        {user.role.replace("-", " ")}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-neutral-700">
                                                    <div className="flex items-center gap-1">
                                                        <Building2 size={14} className="text-[#5d5d5d]" />
                                                        {user.station}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Badge
                                                        className={
                                                            user.status === "active"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }
                                                    >
                                                        {user.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => toggleUserStatus(user.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="border border-[#d1d1d1]"
                                                        >
                                                            {user.status === "active" ? (
                                                                <Lock size={16} />
                                                            ) : (
                                                                <Unlock size={16} />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border border-[#d1d1d1]"
                                                        >
                                                            <Edit size={16} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredUsers.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-neutral-700">No users found matching filters</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
};
