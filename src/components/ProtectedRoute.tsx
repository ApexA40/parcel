import { Navigate } from "react-router-dom";
import { useStation } from "../contexts/StationContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const roleDefaultPath: Record<string, string> = {
    SUPER_ADMIN: "/admin/dashboard",
    ADMIN:       "/admin/dashboard",
    MANAGER:     "/delivery/assignments",
    FRONTDESK:   "/parcel/intake",
    CALLER:      "/delivery/call-center",
    RIDER:       "/rider/dashboard",
    VENDOR:      "/partner",
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { isAuthenticated, userRole } = useStation();

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        const fallback = roleDefaultPath[userRole] ?? "/parcel/intake";
        return <Navigate to={fallback} replace />;
    }

    return <>{children}</>;
};
