import React, { createContext, useContext, useState } from "react";

export interface Branch {
    id: string;
    name: string;
    code: string;
    address?: string;
    location?: string;
}

export interface Tenant {
    id: string;
    name: string;
    plan: "starter" | "growth" | "enterprise";
    branches: Branch[];
}

interface TenantContextType {
    tenant: Tenant | null;
    currentBranch: Branch | null;
    setTenant: (tenant: Tenant) => void;
    setCurrentBranch: (branch: Branch) => void;
    clearTenant: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const TENANT_SESSION_KEY = "pf_tenant";
const BRANCH_SESSION_KEY = "pf_branch";

const loadJson = <T,>(key: string): T | null => {
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tenant, setTenantState] = useState<Tenant | null>(() => loadJson<Tenant>(TENANT_SESSION_KEY));
    const [currentBranch, setCurrentBranchState] = useState<Branch | null>(() => loadJson<Branch>(BRANCH_SESSION_KEY));

    const setTenant = (t: Tenant) => {
        setTenantState(t);
        sessionStorage.setItem(TENANT_SESSION_KEY, JSON.stringify(t));
    };

    const setCurrentBranch = (b: Branch) => {
        setCurrentBranchState(b);
        sessionStorage.setItem(BRANCH_SESSION_KEY, JSON.stringify(b));
    };

    const clearTenant = () => {
        setTenantState(null);
        setCurrentBranchState(null);
        sessionStorage.removeItem(TENANT_SESSION_KEY);
        sessionStorage.removeItem(BRANCH_SESSION_KEY);
    };

    return (
        <TenantContext.Provider value={{ tenant, currentBranch, setTenant, setCurrentBranch, clearTenant }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const ctx = useContext(TenantContext);
    if (!ctx) throw new Error("useTenant must be used within TenantProvider");
    return ctx;
};
