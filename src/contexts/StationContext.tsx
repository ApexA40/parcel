import React, { createContext, useContext, useState } from "react";

export type UserRole = "admin" | "station-manager" | "front-desk" | "call-center" | "rider";

interface Station {
    id: string;
    name: string;
    location: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    stationId: string;
}

interface StationContextType {
    currentStation: Station | null;
    currentUser: User | null;
    setStation: (station: Station) => void;
    setUser: (user: User) => void;
    canAccessStation: (stationId: string) => boolean;
    userRole: UserRole | null;
}

const StationContext = createContext<StationContextType | undefined>(undefined);

export const StationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentStation, setCurrentStation] = useState<Station | null>({
        id: "STATION-001",
        name: "Accra Central Station",
        location: "Accra",
    });

    const [currentUser, setCurrentUser] = useState<User | null>({
        id: "USER-001",
        name: "Adams Godfred",
        email: "adams@example.com",
        role: "front-desk",
        stationId: "STATION-001",
    });

    const setStation = (station: Station) => {
        setCurrentStation(station);
    };

    const setUser = (user: User) => {
        setCurrentUser(user);
    };

    const canAccessStation = (stationId: string) => {
        if (!currentUser) return false;
        if (currentUser.role === "admin") return true;
        return currentUser.stationId === stationId;
    };

    return (
        <StationContext.Provider
            value={{
                currentStation,
                currentUser,
                setStation,
                setUser,
                canAccessStation,
                userRole: currentUser?.role || null,
            }}
        >
            {children}
        </StationContext.Provider>
    );
};

export const useStation = () => {
    const context = useContext(StationContext);
    if (context === undefined) {
        throw new Error("useStation must be used within a StationProvider");
    }
    return context;
};
