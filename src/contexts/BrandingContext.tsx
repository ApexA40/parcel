import React, { createContext, useContext, useEffect, useState } from "react";

export interface BrandingConfig {
    companyName: string;
    branchName?: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    faviconUrl?: string;
    // Branch info
    branchAddress?: string;
    branchPhone?: string;
    branchEmail?: string;
    operatingHours?: string;
    // Print settings
    companyTagline?: string;
    printFooterNote?: string;
}

const SYSTEM_DEFAULTS: BrandingConfig = {
    companyName: "ParcelFlow",
    primaryColor: "#ea690c",
    secondaryColor: "#1e40af",
};

interface BrandingContextType {
    branding: BrandingConfig;
    setBranchBranding: (config: Partial<BrandingConfig>) => void;
    setTenantBranding: (config: Partial<BrandingConfig>) => void;
    resetBranchBranding: () => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

const TENANT_KEY = "pf_tenant_branding";
const BRANCH_KEY = "pf_branch_branding";

const load = (key: string): Partial<BrandingConfig> => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tenantBranding, setTenantBrandingState] = useState<Partial<BrandingConfig>>(
        () => load(TENANT_KEY)
    );
    const [branchBranding, setBranchBrandingState] = useState<Partial<BrandingConfig>>(
        () => load(BRANCH_KEY)
    );

    // Resolved branding: branch overrides tenant, tenant overrides system defaults
    const branding: BrandingConfig = {
        ...SYSTEM_DEFAULTS,
        ...tenantBranding,
        ...branchBranding,
    };

    // Apply primary color as CSS variable so Tailwind arbitrary values can use it
    useEffect(() => {
        document.documentElement.style.setProperty("--brand-primary", branding.primaryColor);
        document.documentElement.style.setProperty("--brand-secondary", branding.secondaryColor);
    }, [branding.primaryColor, branding.secondaryColor]);

    const setBranchBranding = (config: Partial<BrandingConfig>) => {
        const updated = { ...branchBranding, ...config };
        setBranchBrandingState(updated);
        localStorage.setItem(BRANCH_KEY, JSON.stringify(updated));
    };

    const setTenantBranding = (config: Partial<BrandingConfig>) => {
        const updated = { ...tenantBranding, ...config };
        setTenantBrandingState(updated);
        localStorage.setItem(TENANT_KEY, JSON.stringify(updated));
    };

    const resetBranchBranding = () => {
        setBranchBrandingState({});
        localStorage.removeItem(BRANCH_KEY);
    };

    return (
        <BrandingContext.Provider value={{ branding, setBranchBranding, setTenantBranding, resetBranchBranding }}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => {
    const ctx = useContext(BrandingContext);
    if (!ctx) throw new Error("useBranding must be used within BrandingProvider");
    return ctx;
};
