import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import frontdeskService, { ParcelResponse, ParcelSearchFilters, PageableRequest } from "../services/frontdeskService";
import authService from "../services/authService";

/** Prefetched next-page data for instant "Next" navigation */
interface NextPageCache {
    page: number;
    size: number;
    filtersKey: string;
    parcels: ParcelResponse[];
    totalElements: number;
    totalPages: number;
}

interface FrontdeskParcelContextType {
    parcels: ParcelResponse[];
    loading: boolean;
    backgroundLoading: boolean; // For background refresh without showing loading UI
    lastFetchTime: number | null;
    pagination: {
        page: number;
        size: number;
        totalElements: number;
        totalPages: number;
    };
    currentFilters: ParcelSearchFilters;
    currentPageable: PageableRequest;
    loadParcelsIfNeeded: (filters?: ParcelSearchFilters, page?: number, size?: number, showLoading?: boolean) => Promise<void>;
    refreshParcels: (filters?: ParcelSearchFilters, page?: number, size?: number) => Promise<void>;
    /** Navigate to a page — uses cache/prefetch, keeps current parcels visible until new ones arrive */
    navigatePage: (page: number) => Promise<void>;
    /** Start loading the next page in the background so "Next" is instant. Safe to call repeatedly. */
    prefetchNextPageIfPossible: () => void;
    invalidateCache: () => void;
}

const FrontdeskParcelContext = createContext<FrontdeskParcelContextType | undefined>(undefined);

// Cache duration: 5 minutes (300000 ms)
const CACHE_DURATION = 5 * 60 * 1000;

export const FrontdeskParcelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [parcels, setParcels] = useState<ParcelResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [backgroundLoading, setBackgroundLoading] = useState(false);
    const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
    const [pagination, setPagination] = useState({
        page: 0,
        size: 50,
        totalElements: 0,
        totalPages: 0,
    });
    const [currentFilters, setCurrentFilters] = useState<ParcelSearchFilters>({});
    const [currentPageable, setCurrentPageable] = useState<PageableRequest>({ page: 0, size: 50 });
    const [nextPageCache, setNextPageCache] = useState<NextPageCache | null>(null);
    // Cache of pages visited so far, keyed by filters+page+size so Previous/Next don't refetch
    const [pageCache, setPageCache] = useState<Record<string, {
        parcels: ParcelResponse[];
        pagination: {
            page: number;
            size: number;
            totalElements: number;
            totalPages: number;
        };
        timestamp: number;
    }>>({});
    const prefetchAbortRef = useRef<AbortController | null>(null);
    // Use refs for cache values so loadParcels doesn't need them in its dep array
    const nextPageCacheRef = useRef<NextPageCache | null>(null);
    const pageCacheRef = useRef<Record<string, { parcels: ParcelResponse[]; pagination: { page: number; size: number; totalElements: number; totalPages: number; }; timestamp: number; }>>({});
    const lastFetchTimeRef = useRef<number | null>(null);
    const currentFiltersRef = useRef<ParcelSearchFilters>({});
    const currentPageableRef = useRef<PageableRequest>({ page: 0, size: 50 });

    /** Prefetch the next page in the background (no loading UI). */
    const prefetchNextPage = useCallback(async (filters: ParcelSearchFilters, page: number, size: number) => {
        prefetchAbortRef.current?.abort();
        prefetchAbortRef.current = new AbortController();
        const signal = prefetchAbortRef.current.signal;
        try {
            const response = await frontdeskService.searchParcels(filters, { page, size });
            if (signal.aborted) return;
            if (response.success && response.data) {
                const cache: NextPageCache = {
                    page,
                    size,
                    filtersKey: JSON.stringify(filters),
                    parcels: response.data.content || [],
                    totalElements: response.data.totalElements ?? 0,
                    totalPages: response.data.totalPages ?? 0,
                };
                nextPageCacheRef.current = cache;
                setNextPageCache(cache);
            }
        } catch (err) {
            if (signal.aborted) return;
        }
    }, []);

    const loadParcels = useCallback(async (
        filters: ParcelSearchFilters = {},
        page: number = 0,
        size: number = 50,
        forceRefresh = false,
        showLoading = true
    ) => {
        const now = Date.now();
        const filtersKey = JSON.stringify(filters);
        const cacheKey = `${filtersKey}|${page}|${size}`;

        // 1) Use prefetched next page if we're navigating to it (instant)
        const npc = nextPageCacheRef.current;
        if (!forceRefresh && npc && npc.page === page && npc.size === size && npc.filtersKey === filtersKey) {
            setParcels(npc.parcels);
            setPagination({ page: npc.page, size: npc.size, totalElements: npc.totalElements, totalPages: npc.totalPages });
            setCurrentFilters(filters);
            setCurrentPageable({ page, size });
            lastFetchTimeRef.current = now;
            setLastFetchTime(now);
            nextPageCacheRef.current = null;
            setNextPageCache(null);
            if (page + 1 < npc.totalPages) prefetchNextPage(filters, page + 1, size);
            return;
        }

        // 2) Check page cache (including page 0)
        if (!forceRefresh) {
            const cached = pageCacheRef.current[cacheKey];
            if (cached && (now - cached.timestamp) < CACHE_DURATION) {
                setParcels(cached.parcels);
                setPagination(cached.pagination);
                setCurrentFilters(filters);
                setCurrentPageable({ page, size });
                lastFetchTimeRef.current = now;
                setLastFetchTime(now);
                const nextPage = cached.pagination.page + 1;
                if (cached.pagination.totalPages > 0 && nextPage < cached.pagination.totalPages) {
                    prefetchNextPage(filters, nextPage, cached.pagination.size);
                }
                return;
            }
        }

        if (showLoading) setLoading(true);
        else setBackgroundLoading(true);

        try {
            const response = await frontdeskService.searchParcels(filters, { page, size });

            if (response.success && response.data) {
                const fetchedParcels = response.data.content || [];
                const totalPages = response.data.totalPages ?? 0;
                const totalElements = response.data.totalElements ?? 0;

                const newPagination = {
                    page: response.data.number ?? page,
                    size: response.data.size ?? size,
                    totalElements,
                    totalPages,
                };

                setParcels(fetchedParcels);
                setPagination(newPagination);
                setCurrentFilters(filters);
                setCurrentPageable({ page, size });
                lastFetchTimeRef.current = now;
                setLastFetchTime(now);

                pageCacheRef.current = { ...pageCacheRef.current, [cacheKey]: { parcels: fetchedParcels, pagination: newPagination, timestamp: now } };
                setPageCache(pageCacheRef.current);

                if (totalPages > 0 && page + 1 < totalPages) {
                    prefetchNextPage(filters, page + 1, size);
                }
            }
        } catch (error) {
            console.error("Failed to load parcels:", error);
        } finally {
            if (showLoading) setLoading(false);
            else setBackgroundLoading(false);
        }
    }, [prefetchNextPage]);

    const loadParcelsIfNeeded = useCallback(async (
        filters: ParcelSearchFilters = {},
        page: number = 0,
        size: number = 50,
        showLoading = true
    ) => {
        await loadParcels(filters, page, size, false, showLoading);
    }, [loadParcels]);

    const refreshParcels = useCallback(async (
        filters: ParcelSearchFilters = {},
        page: number = 0,
        size: number = 50
    ) => {
        await loadParcels(filters, page, size, true, true);
    }, [loadParcels]);

    /**
     * Navigate to a page using cache/prefetch first.
     * Keeps current parcels visible (no loading spinner) until new data arrives.
     */
    const navigatePage = useCallback(async (page: number) => {
        await loadParcels(currentFiltersRef.current, page, currentPageableRef.current.size ?? 50, false, false);
    }, [loadParcels]);

    const invalidateCache = useCallback(() => {
        lastFetchTimeRef.current = null;
        nextPageCacheRef.current = null;
        pageCacheRef.current = {};
        setLastFetchTime(null);
        setNextPageCache(null);
        setPageCache({});
        prefetchAbortRef.current?.abort();
    }, []);

    /** Start prefetching the next page in the background when current page has loaded. Call from UI when loading is done. */
    const prefetchNextPageIfPossible = useCallback(() => {
        const { page, size, totalPages } = pagination;
        const nextPage = page + 1;
        if (totalPages <= 0 || nextPage >= totalPages) return;
        const npc = nextPageCacheRef.current;
        if (npc?.page === nextPage && npc.filtersKey === JSON.stringify(currentFiltersRef.current)) return;
        prefetchNextPage(currentFiltersRef.current, nextPage, size);
    }, [pagination, prefetchNextPage]);

    // Sync refs whenever state changes
    useEffect(() => { currentFiltersRef.current = currentFilters; }, [currentFilters]);
    useEffect(() => { currentPageableRef.current = currentPageable; }, [currentPageable]);

    // Load on mount — skip if cache is still valid
    useEffect(() => {
        const now = Date.now();
        if (lastFetchTimeRef.current && (now - lastFetchTimeRef.current) < CACHE_DURATION && parcels.length > 0) return;
        loadParcels({}, 0, 50, false, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <FrontdeskParcelContext.Provider
            value={{
                parcels,
                loading,
                backgroundLoading,
                lastFetchTime,
                pagination,
                currentFilters,
                currentPageable,
                loadParcelsIfNeeded,
                refreshParcels,
                navigatePage,
                prefetchNextPageIfPossible,
                invalidateCache,
            }}
        >
            {children}
        </FrontdeskParcelContext.Provider>
    );
};

export const useFrontdeskParcel = () => {
    const context = useContext(FrontdeskParcelContext);
    if (context === undefined) {
        throw new Error("useFrontdeskParcel must be used within a FrontdeskParcelProvider");
    }
    return context;
};

