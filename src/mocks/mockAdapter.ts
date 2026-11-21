/**
 * Axios adapter that answers API calls from in-memory sample data.
 * Only loaded when the app runs with VITE_USE_MOCK_API=true (see ./setup.ts).
 */
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import {
    ADDRESSES, ASSIGNMENTS, DEMO_ACCOUNTS, DRIVER_ASSIGNMENTS, FUEL_REQUESTS, HOME_OFFICE,
    INCOMING_TRANSFERS, OUTGOING_TRANSFERS, PARCELS, RIDERS, SHELVES, USERS, USER_ACTIONS,
    locationsWithOffices, serializeAssignment, MockParcel,
} from "./mockData";
import API_BASE_URL from "../config/api";

type Handler = (ctx: { params: URLSearchParams; body: any; match: RegExpMatchArray; config: InternalAxiosRequestConfig }) => unknown;
interface Route { method: string; pattern: RegExp; handler: Handler; }

const routes: Route[] = [];
const on = (method: string, pattern: RegExp, handler: Handler) => routes.push({ method, pattern, handler });

// ── Helpers ─────────────────────────────────────────────────────
const page = <T,>(items: T[], params: URLSearchParams) => {
    const size = Number(params.get("size") ?? 50) || 50;
    const number = Number(params.get("page") ?? 0) || 0;
    const content = items.slice(number * size, number * size + size);
    const totalPages = Math.max(1, Math.ceil(items.length / size));
    return {
        content, totalElements: items.length, totalPages, number, size,
        first: number === 0, last: number >= totalPages - 1,
        numberOfElements: content.length, empty: content.length === 0,
    };
};

const bool = (v: string | null) => (v === null ? undefined : v === "true");
const byNewest = (a: MockParcel, b: MockParcel) => (b.createdAt ?? 0) - (a.createdAt ?? 0);
const officeIdOf = (p: MockParcel) => (typeof p.officeId === "string" ? p.officeId : p.officeId?.id);

const filterParcels = (params: URLSearchParams, scopeToHome: boolean) => {
    const office = params.get("officeId") || (scopeToHome ? HOME_OFFICE.id : null);
    const isDelivered = bool(params.get("isDelivered"));
    const isAssigned = bool(params.get("isParcelAssigned"));
    const isPOD = bool(params.get("isPOD"));
    const hasCalled = bool(params.get("hasCalled"));
    return PARCELS.filter((p) =>
        (!office || officeIdOf(p) === office) &&
        (isDelivered === undefined || !!p.delivered === isDelivered) &&
        (isAssigned === undefined || !!p.parcelAssigned === isAssigned) &&
        (isPOD === undefined || !!p.pod === isPOD) &&
        (hasCalled === undefined || !!p.hasCalled === hasCalled)
    ).sort(byNewest);
};

const ok = (message = "Success (mock)") => ({ message, success: true, id: `mock-${Date.now()}` });
const findParcel = (id: string) => PARCELS.find((p) => p.parcelId === id);
const homeParcels = () => PARCELS.filter((p) => officeIdOf(p) === HOME_OFFICE.id);

// ── Auth ────────────────────────────────────────────────────────
on("post", /^\/api-user\/login$/, ({ body }) => {
    const phone = String(body?.phoneNumber ?? "").replace(/\D/g, "").replace(/^233/, "0");
    const byEmail = Object.entries(DEMO_ACCOUNTS).find(([, a]) => a.email === body?.email);
    const [phoneNumber, acct] = DEMO_ACCOUNTS[phone] ? [phone, DEMO_ACCOUNTS[phone]] : byEmail ?? ["0200000002", DEMO_ACCOUNTS["0200000002"]];
    const user = USERS.find((u) => u.phoneNumber === phoneNumber);
    const userId = acct.role === "RIDER" ? "rider-1" : user?.userId ?? "user-2";
    return {
        name: acct.name, phoneNumber, role: acct.role, email: acct.email, userId,
        token: `mock-token-${acct.role.toLowerCase()}`, stationId: HOME_OFFICE.id,
        office: { id: HOME_OFFICE.id, name: HOME_OFFICE.name, code: HOME_OFFICE.code, address: HOME_OFFICE.address, phoneNumber: HOME_OFFICE.phoneNumber, location: HOME_OFFICE.location },
    };
});
on("post", /\/auth\/refresh-token$/, () => ({ token: "mock-token-refreshed" }));

// ── Offices, locations, shelves ─────────────────────────────────
on("get", /^\/api\/offices\/locations$/, () => locationsWithOffices());
on("get", /^\/api\/offices\/locations?\/([^/]+)$/, ({ match }) => locationsWithOffices().find((l) => l.id === match[1]));
on("get", /^\/api-user\/shelf\/office\/([^/]+)$/, ({ match }) => SHELVES.filter((s) => s.office.id === match[1]));

// ── Frontdesk parcels ───────────────────────────────────────────
on("get", /^\/api-frontdesk\/parcels$/, ({ params }) => page(filterParcels(params, true), params));
on("get", /^\/api-frontdesk\/parcels-uncalled$/, ({ params }) => page(homeParcels().filter((p) => !p.hasCalled).sort(byNewest), params));
on("get", /^\/api-frontdesk\/parcels\/home-delivery$/, () => homeParcels().filter((p) => p.homeDelivery && !p.delivered && !p.parcelAssigned && !p.returned));
on("get", /^\/api-frontdesk\/parcels\/delivered$/, ({ params }) => page(homeParcels().filter((p) => p.delivered).sort(byNewest), params));
on("get", /^\/api-frontdesk\/parcels\/transfer\/in-transit$/, () => INCOMING_TRANSFERS);
on("get", /^\/api-frontdesk\/parcels\/transfer\/outgoing$/, () => OUTGOING_TRANSFERS);
on("get", /^\/api-frontdesk\/riders\/office$/, () => RIDERS);
on("get", /^\/api-frontdesk\/addresses$/, ({ params }) => {
    const q = params.get("name")?.toLowerCase();
    return q ? ADDRESSES.filter((a) => a.name.toLowerCase().includes(q)) : ADDRESSES;
});
on("get", /^\/api-frontdesk\/parcel-assignment$/, ({ params }) => {
    const parcelId = params.get("parcelId");
    const list = ASSIGNMENTS.filter((a) => !parcelId || a.parcels.some((p) => p.parcelId === parcelId));
    return page(list.sort((a, b) => b.assignedAt - a.assignedAt).map(serializeAssignment), params);
});
on("get", /^\/api-frontdesk\/rider\/([^/]+)\/assignments$/, ({ match, params }) => {
    const payed = bool(params.get("payed"));
    return ASSIGNMENTS.filter((a) => a.riderId === match[1] && (payed === undefined || a.payed === payed)).map(serializeAssignment);
});
on("get", /^\/api-frontdesk\/driver\/([^/]+)\/parcels$/, ({ match }) => homeParcels().filter((p) => p.driverId === match[1]));
on("get", /^\/api-frontdesk\/driver-assignments\/unpaid$/, ({ params }) => page(DRIVER_ASSIGNMENTS, params));
on("get", /^\/api-frontdesk\/reconciliations\/by-date$/, () => []);
on("get", /^\/api-frontdesk\/fuel-requests$/, ({ params }) => page(FUEL_REQUESTS, params));
on("get", /^\/api-tracking\/([^/]+)(\/track)?$/, ({ match }) => {
    const p = findParcel(match[1]);
    if (!p) return undefined;
    return { ...p, status: p.delivered ? "DELIVERED" : p.parcelAssigned ? "OUT_FOR_DELIVERY" : "AT_STATION", officeName: HOME_OFFICE.name };
});

on("post", /^\/api-frontdesk\/parcel$/, ({ body }) => {
    const parcel: MockParcel = {
        ...body,
        parcelId: `PF${Math.floor(300000 + Math.random() * 600000)}`,
        officeId: { id: HOME_OFFICE.id, name: HOME_OFFICE.name, code: HOME_OFFICE.code },
        createdAt: Date.now(), registeredDate: Date.now(), updatedAt: Date.now(),
        delivered: false, parcelAssigned: false, hasCalled: false,
    };
    PARCELS.unshift(parcel);
    return parcel;
});
on("put", /^\/api-frontdesk\/parcel\/([^/]+)$/, ({ match, body }) => {
    const p = findParcel(match[1]);
    if (p) Object.assign(p, body, { updatedAt: Date.now() });
    return p ?? ok();
});
on("delete", /^\/api-frontdesk\/parcel\/([^/]+)$/, ({ match }) => {
    const i = PARCELS.findIndex((p) => p.parcelId === match[1]);
    if (i >= 0) PARCELS.splice(i, 1);
    return ok("Parcel deleted");
});
on("post", /^\/api-frontdesk\/parcel\/picked-up$/, ({ body }) => {
    const p = findParcel(body?.parcelId);
    if (p) Object.assign(p, { pickedUp: true, delivered: true, updatedAt: Date.now() });
    return ok("Parcel marked as picked up");
});
on("post", /^\/api-frontdesk\/assign-parcels$/, ({ body }) => {
    const ids: string[] = body?.parcelIds ?? [];
    const parcels = ids.map(findParcel).filter(Boolean) as MockParcel[];
    parcels.forEach((p) => (p.parcelAssigned = true));
    ASSIGNMENTS.unshift({ assignmentId: `asg-${Date.now()}`, riderId: body?.riderId ?? "rider-1", status: "ASSIGNED", assignedAt: Date.now(), payed: false, parcels });
    return ok(`${parcels.length} parcel(s) assigned`);
});
on("post", /^\/api-frontdesk\/(reconcilation-parcels|driver-assignments\/pay)$/, ({ body }) => {
    const ids: string[] = (Array.isArray(body) ? body : [body]).map((x: any) => (typeof x === "string" ? x : x?.assignmentId));
    ASSIGNMENTS.forEach((a) => ids.includes(a.assignmentId) && (a.payed = true));
    DRIVER_ASSIGNMENTS.forEach((d) => ids.includes(d.id) && (d.payed = true));
    return ok("Payments reconciled");
});
on("post", /^\/api-frontdesk\/addresses$/, ({ body }) => {
    const a = { id: ADDRESSES.length + 1, name: body?.name, cost: Number(body?.cost) || 0 };
    ADDRESSES.push(a);
    return a;
});

// ── Admin ───────────────────────────────────────────────────────
on("get", /^\/api-admin\/parcels$/, ({ params }) => page(filterParcels(params, false), params));
on("get", /^\/api-admin\/users$/, () => USERS);
on("get", /^\/api-admin\/user-actions$/, ({ params }) => page(USER_ACTIONS, params));
on("get", /^\/api-admin\/reconciliations\/by-date$/, () => []);
on("get", /^\/api-admin\/fuel-requests$/, ({ params }) => page(FUEL_REQUESTS, params));

// ── Call center ─────────────────────────────────────────────────
on("get", /^\/api-call-center\/stats$/, () => ({ totalDeliveredYesterday: 23, reached: 15, unreachable: 3, notCalled: 5 }));
on("get", /^\/api-call-center\/parcels\/uncalled$/, ({ params }) => page(homeParcels().filter((p) => !p.hasCalled && !p.delivered).sort(byNewest), params));
on("get", /^\/api-call-center\/parcels\/not-delivered-uncalled$/, ({ params }) => page(homeParcels().filter((p) => !p.delivered).sort(byNewest), params));
on("get", /^\/api-call-center\/parcels\/delivered-uncalled$/, ({ params }) =>
    page(homeParcels().filter((p) => p.delivered).map((p, i) => ({ ...p, followUpStatus: i % 3 === 0 ? "FOLLOWED_UP" : "PENDING" })), params));

// ── Rider ───────────────────────────────────────────────────────
const riderAssignments = () => ASSIGNMENTS.filter((a) => a.riderId === "rider-1").sort((a, b) => b.assignedAt - a.assignedAt);
on("get", /^\/api-rider\/assignments$/, ({ params }) => page(riderAssignments().map(serializeAssignment), params));
on("put", /^\/api-rider\/(?:manager\/)?assignments\/([^/]+)\/status$/, ({ match, body }) => {
    const a = ASSIGNMENTS.find((x) => x.assignmentId === match[1]);
    if (!a) return ok();
    a.status = body?.status ?? a.status;
    if (body?.status === "DELIVERED" || body?.status === "RETURNED") {
        a.completedAt = Date.now();
        a.paymentMethod = body?.payementMethod;
        a.parcels.forEach((p) => {
            p.parcelAssigned = false;
            p.delivered = body.status === "DELIVERED";
            p.returned = body.status === "RETURNED";
            p.deliveryDate = Date.now();
        });
    }
    return ok("Assignment status updated");
});
on("post", /^\/api-rider\/rider-status$/, () => ok("Status updated"));
on("get", /^\/api-rider\/fuel-requests$/, ({ params }) => page(FUEL_REQUESTS.filter((f) => f.riderInfo.riderId === "rider-1"), params));
on("post", /^\/api-rider\/fuel-request$/, ({ body }) => {
    const r = RIDERS[0];
    const req = {
        id: `fuel-${Date.now()}`, status: "PENDING" as const,
        riderInfo: { riderId: r.userId, riderName: r.name, riderPhoneNumber: r.phoneNumber, stationName: HOME_OFFICE.name },
        officeId: HOME_OFFICE.id, station: body?.station ?? "", notes: body?.notes ?? "", tank: body?.tank ?? "FULL_TANK",
        amount: null, fuleStationPhoneNumber: body?.fuelStationNumber ?? "", attendantPhoneNumber: body?.attendantNumber ?? "",
        createdAt: Date.now(), updatedAt: Date.now(),
    };
    FUEL_REQUESTS.unshift(req as any);
    return req;
});

// ── Adapter ─────────────────────────────────────────────────────
const basePath = new URL(API_BASE_URL, window.location.origin).pathname.replace(/\/$/, "");

const toPath = (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? "";
    const joined = /^https?:\/\//.test(url) || !config.baseURL
        ? url
        : `${config.baseURL.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
    const u = new URL(joined, window.location.origin);
    let path = u.pathname.replace(/\/$/, "");
    if (basePath && path.startsWith(basePath)) path = path.slice(basePath.length);
    const params = new URLSearchParams(u.search);
    if (config.params) Object.entries(config.params).forEach(([k, v]) => v !== undefined && params.set(k, String(v)));
    return { path: path || "/", params };
};

export const mockAdapter: AxiosAdapter = async (config) => {
    const method = (config.method ?? "get").toLowerCase();
    const { path, params } = toPath(config);
    let body: any = config.data;
    if (typeof body === "string") {
        try { body = JSON.parse(body); } catch { /* leave as string */ }
    }

    await new Promise((r) => setTimeout(r, 120 + Math.random() * 180)); // feel like a network

    const respond = (status: number, data: unknown): AxiosResponse => ({
        data, status, statusText: status === 200 ? "OK" : "Error", headers: {}, config, request: {},
    });

    for (const r of routes) {
        if (r.method !== method) continue;
        const match = path.match(r.pattern);
        if (!match) continue;
        const data = r.handler({ params, body, match, config });
        if (data === undefined) {
            const err: any = new Error(`Mock: not found ${method.toUpperCase()} ${path}`);
            err.response = respond(404, { message: "Not found" });
            err.config = config;
            throw err;
        }
        return respond(200, JSON.parse(JSON.stringify(data)));
    }

    // Unknown endpoint: answer with an empty list so screens render their empty state.
    console.info(`[mock api] no handler for ${method.toUpperCase()} ${path}; returning []`);
    return respond(200, method === "get" ? [] : ok());
};
