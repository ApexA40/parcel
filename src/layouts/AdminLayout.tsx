import React, { useState } from "react";
import { Navbar } from "./Navbar";
import { AdminSidebar } from "./AdminSidebar";
import { UpdateNotificationPopup } from "../components/UpdateNotificationPopup";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
            <UpdateNotificationPopup />
            <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex flex-1 flex-col min-w-0 ml-0 lg:ml-64">
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
