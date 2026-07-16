import React, { useState } from "react";
import { Navbar } from "./Navbar";
import { AdminSidebar } from "./AdminSidebar";
import { UpdateNotificationPopup } from "../components/UpdateNotificationPopup";
import { Globe } from "lucide-react";
import { useTenant } from "../contexts/TenantContext";

interface SuperAdminLayoutProps {
    children: React.ReactNode;
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { tenant } = useTenant();

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
            <UpdateNotificationPopup />
            <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex flex-1 flex-col min-w-0 ml-0 lg:ml-64">
                {/* Super Admin tenant context banner */}
                <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white text-xs font-medium">
                    <Globe size={13} />
                    <span>Super Admin View</span>
                    {tenant && (
                        <>
                            <span className="opacity-50 mx-1">·</span>
                            <span>Viewing: <strong>{tenant.name}</strong></span>
                        </>
                    )}
                    {!tenant && <span className="opacity-70 ml-1">— All Tenants</span>}
                </div>

                <div className="sticky top-0 z-10 flex-shrink-0 bg-white dark:bg-gray-900 shadow-sm">
                    <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                </div>
                <main className="flex-1 bg-gray-50 dark:bg-gray-950">
                    {children}
                </main>
            </div>
        </div>
    );
};
