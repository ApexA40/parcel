/**
 * Sample data for mock API mode (`npm run dev:mock`).
 *
 * Everything here is generated deterministically from a fixed seed so the
 * screens look the same on every reload. Timestamps are relative to "now" so
 * today's dashboards always have something to show.
 */

// ── Deterministic RNG ───────────────────────────────────────────
let seed = 20251121;
const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
};
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const now = Date.now();
const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).getTime();

// ── Reference data ──────────────────────────────────────────────
const FIRST = ["Kwame", "Ama", "Kofi", "Akosua", "Yaw", "Abena", "Kojo", "Efua", "Kwabena", "Adwoa", "Kwesi", "Esi", "Nana", "Afia", "Fiifi", "Akua", "Selorm", "Dzifa", "Elikem", "Mawuli"];
const LAST = ["Mensah", "Owusu", "Boateng", "Asante", "Osei", "Addo", "Agyeman", "Appiah", "Darko", "Ofori", "Quaye", "Tetteh", "Amoah", "Badu", "Nkrumah", "Sarpong"];
const AREAS = ["East Legon, Accra", "Osu, Accra", "Madina, Accra", "Spintex Road, Accra", "Dansoman, Accra", "Achimota, Accra", "Labone, Accra", "Adenta, Accra", "Kasoa", "Airport Residential, Accra", "Cantonments, Accra", "Teshie, Accra", "Haatso, Accra", "Dzorwulu, Accra"];
const STREETS = ["Lagos Ave", "Boundary Rd", "Oxford St", "Liberation Rd", "Ring Rd East", "Mission St", "Palm St", "Kwame Nkrumah Ave", "Independence Ave", "Akosombo Rd"];
const ITEMS = ["Phone accessories", "Clothing", "Documents", "Shoes", "Laptop", "Cosmetics", "Food items", "Books", "Kitchen appliance", "Electronics", "Bag", "Hair products", "Medication", "Gift box", "Spare parts"];
const VEHICLES = ["GR-2341-22", "AS-1187-21", "GT-9921-23", "GW-4410-20", "GN-7765-24", "WR-3302-22"];

const phone = () => `0${pick(["24", "54", "55", "20", "50", "27", "26"])}${int(1000000, 9999999)}`;
const person = () => `${pick(FIRST)} ${pick(LAST)}`;

// ── Locations & offices ─────────────────────────────────────────
export const LOCATIONS = [
    { id: "loc-accra", name: "Accra", region: "Greater Accra", country: "Ghana" },
    { id: "loc-kumasi", name: "Kumasi", region: "Ashanti", country: "Ghana" },
    { id: "loc-tema", name: "Tema", region: "Greater Accra", country: "Ghana" },
    { id: "loc-takoradi", name: "Takoradi", region: "Western", country: "Ghana" },
];

const officeRows: Array<[string, string, string, string, string]> = [
    ["off-accra", "Accra Central", "ACC", "12 Kojo Thompson Rd, Adabraka", "loc-accra"],
    ["off-eastlegon", "East Legon", "ELG", "5 Lagos Ave, East Legon", "loc-accra"],
    ["off-kumasi", "Kumasi Adum", "KAD", "Adum Main St, Kumasi", "loc-kumasi"],
    ["off-tema", "Tema Community 1", "TM1", "Harbour Rd, Community 1", "loc-tema"],
    ["off-takoradi", "Takoradi Market Circle", "TKD", "Market Circle, Takoradi", "loc-takoradi"],
];

export const OFFICES = officeRows.map(([id, name, code, address, locationId]) => {
    const loc = LOCATIONS.find((l) => l.id === locationId)!;
    return {
        id, name, code, address,
        phoneNumber: phone(),
        locationName: loc.name,
        managerName: person(),
        location: loc,
        createdAt: now - 200 * DAY,
        updatedAt: now - 10 * DAY,
    };
});

export const HOME_OFFICE = OFFICES[0];
const officeRef = (o = HOME_OFFICE) => ({ id: o.id, name: o.name, code: o.code, address: o.address });

export const locationsWithOffices = () =>
    LOCATIONS.map((l) => ({
        ...l,
        offices: OFFICES.filter((o) => o.location.id === l.id).map(({ location: _location, ...o }) => o),
    }));

// ── Shelves ─────────────────────────────────────────────────────
export const SHELVES = OFFICES.flatMap((o) =>
    ["A1", "A2", "B1", "B2", "C1", "Fragile"].map((n, i) => ({
        id: `shelf-${o.code}-${i}`,
        name: n,
        office: officeRef(o),
    }))
);

// ── Demo login accounts (any password works) ────────────────────
// Roles use the backend's spelling (SUPERADMIN, CALLCENTER), as /api-user/login returns them.
export const DEMO_ACCOUNTS: Record<string, { name: string; role: string; email: string }> = {
    "0200000001": { name: "Abena Owusu", role: "ADMIN", email: "admin@demo.parcelflow" },
    "0200000002": { name: "Kofi Mensah", role: "MANAGER", email: "manager@demo.parcelflow" },
    "0200000003": { name: "Akosua Boateng", role: "FRONTDESK", email: "frontdesk@demo.parcelflow" },
    "0200000004": { name: "Esi Addo", role: "CALLCENTER", email: "caller@demo.parcelflow" },
    "0200000005": { name: "Kwame Asante", role: "RIDER", email: "rider@demo.parcelflow" },
    "0200000006": { name: "Nana Osei", role: "SUPERADMIN", email: "super@demo.parcelflow" },
};

// ── Riders ──────────────────────────────────────────────────────
export const RIDERS = [
    { userId: "rider-1", name: "Kwame Asante", phoneNumber: "0200000005" },
    { userId: "rider-2", name: "Yaw Darko", phoneNumber: phone() },
    { userId: "rider-3", name: "Kojo Appiah", phoneNumber: phone() },
    { userId: "rider-4", name: "Fiifi Quaye", phoneNumber: phone() },
    { userId: "rider-5", name: "Elikem Tetteh", phoneNumber: phone() },
].map((r, i) => ({
    ...r,
    email: `${r.name.split(" ")[0].toLowerCase()}@demo.parcelflow`,
    officeId: HOME_OFFICE.id,
    role: "RIDER" as const,
    status: "ACTIVE" as const,
    riderStatus: i === 3 ? "OFFLINE" : i === 1 ? "ON_TRIP" : "READY",
    // Fiifi Quaye (index 3) has no GPS tracker, so /riders/location answers 422 for him.
    deviceImei: i === 3 ? undefined : `35${String(8810000000000 + i * 7919).slice(0, 13)}`,
}));

/**
 * Sample GPS behaviour for /api-admin/riders/location. Each rider circles a point in Accra,
 * so positions change between refreshes. Elikem's tracker last reported 2 hours ago and
 * Kojo's tracker is on but has no fix.
 */
const RIDER_ROUTES: Record<string, { lat: number; lng: number; radius: number; minutesBehind?: number; noFix?: boolean }> = {
    "rider-1": { lat: 5.6145, lng: -0.1720, radius: 0.012 },
    "rider-2": { lat: 5.5800, lng: -0.2200, radius: 0.010 },
    "rider-3": { lat: 5.6500, lng: -0.1650, radius: 0.008, noFix: true },
    "rider-5": { lat: 5.6350, lng: -0.2350, radius: 0.006, minutesBehind: 120 },
};

const utcStamp = (ms: number) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");

/**
 * Sample GPS history for /api-admin/riders/track: a workday per rider per day, one point a
 * minute from about 08:30, riding at 15-40 km/h between drop-offs around Accra and stopping
 * 8-20 minutes at each. Deterministic per rider and day, so replays look the same.
 */
export const riderTrackPoints = (riderId: string, begin: number, end: number) => {
    const route = RIDER_ROUTES[riderId];
    if (!route || route.noFix) return [];
    const DAY = 24 * 60 * 60_000;
    const until = Math.min(end, Date.now() - (route.minutesBehind ?? 0) * 60_000);
    const points: Array<{ lat: number; lng: number; speed: number; gpsTime: string; direction: number; altitude: number; posType: number }> = [];

    for (let day = Math.floor(begin / DAY) * DAY; day <= until; day += DAY) {
        let seed = (day / DAY) * 31 + riderId.length * 977 + riderId.charCodeAt(riderId.length - 1);
        const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
        const station = { lat: 5.5560, lng: -0.2050 }; // Accra Central
        const stopsToday = 6 + Math.floor(rnd() * 4);
        let pos = { ...station };
        let t = day + (8 * 60 + 30 + Math.floor(rnd() * 20)) * 60_000;
        const legs = [...Array.from({ length: stopsToday }, () => ({
            lat: route.lat + (rnd() - 0.5) * 0.06,
            lng: route.lng + (rnd() - 0.5) * 0.06,
        })), station];

        legs.forEach((target, li) => {
            const km = Math.hypot((target.lat - pos.lat) * 111, (target.lng - pos.lng) * 111);
            const cruise = 18 + rnd() * 17;
            const minutes = Math.max(2, Math.round((km / cruise) * 60 * 1.3)); // roads aren't straight
            const heading = (Math.atan2(target.lng - pos.lng, target.lat - pos.lat) * 180) / Math.PI;
            for (let m = 0; m < minutes; m++) {
                const f = m / minutes;
                const wobble = Math.sin(m * 1.7) * 0.0006;
                points.push({
                    lat: pos.lat + (target.lat - pos.lat) * f + wobble,
                    lng: pos.lng + (target.lng - pos.lng) * f - wobble,
                    speed: Math.round(cruise * (0.6 + 0.8 * Math.abs(Math.sin(m * 0.9)))),
                    direction: Math.round((heading + 360) % 360),
                    altitude: 40 + Math.round(rnd() * 30),
                    gpsTime: utcStamp(t),
                    posType: 1,
                });
                t += 60_000;
            }
            pos = { ...target };
            const dwell = li === legs.length - 1 ? 1 : 8 + Math.floor(rnd() * 13);
            for (let m = 0; m < dwell; m++) {
                points.push({ lat: pos.lat, lng: pos.lng, speed: 0, direction: 0, altitude: 45, gpsTime: utcStamp(t), posType: 1 });
                t += 60_000;
            }
        });
    }
    return points.filter((p) => {
        const ms = Date.parse(p.gpsTime.replace(" ", "T") + "Z");
        return ms >= begin && ms <= until;
    });
};

export const riderLocationNow = (riderId: string) => {
    const r = RIDERS.find((x) => x.userId === riderId);
    if (!r) return { status: 404 as const };
    if (!r.deviceImei) return { status: 422 as const };
    const route = RIDER_ROUTES[riderId];
    const at = Date.now() - (route?.minutesBehind ?? 0) * 60_000;
    const angle = (at / 60_000 / 12) * Math.PI * 2 + riderId.length; // one lap every 12 minutes
    const base = {
        riderId: r.userId, riderName: r.name, riderPhoneNumber: r.phoneNumber, deviceImei: r.deviceImei,
        deviceStatus: route?.minutesBehind ? "OFFLINE" : "ONLINE",
    };
    if (!route || route.noFix) return { status: 200 as const, body: { ...base, located: false, accStatus: "OFF" } };
    return {
        status: 200 as const,
        body: {
            ...base,
            lat: +(route.lat + Math.sin(angle) * route.radius).toFixed(6),
            lng: +(route.lng + Math.cos(angle) * route.radius).toFixed(6),
            speed: route.minutesBehind ? 0 : 18 + Math.round(Math.abs(Math.sin(angle * 3)) * 22),
            accStatus: route.minutesBehind ? "OFF" : "ON",
            gpsTime: utcStamp(at),
            located: true,
        },
    };
};

// ── Users (admin user management) ───────────────────────────────
export const USERS = [
    ...Object.entries(DEMO_ACCOUNTS).map(([phoneNumber, a], i) => ({
        userId: `user-${i + 1}`, name: a.name, phoneNumber, email: a.email, role: a.role,
        deviceImei: RIDERS.find((r) => r.phoneNumber === phoneNumber)?.deviceImei as string | undefined,
    })),
    ...RIDERS.slice(1).map((r) => ({ userId: r.userId, name: r.name, phoneNumber: r.phoneNumber, email: r.email, role: "RIDER", deviceImei: r.deviceImei })),
    ...Array.from({ length: 8 }, (_, i) => ({
        userId: `user-x${i}`, name: person(), phoneNumber: phone(),
        email: undefined as string | undefined, role: pick(["FRONTDESK", "MANAGER", "CALLCENTER", "FRONTDESK"]),
    })),
].map((u, i) => {
    const o = i < 6 ? HOME_OFFICE : pick(OFFICES);
    return {
        ...u,
        status: i === 13 ? "SUSPENDED" : "ACTIVE",
        officeId: o.id,
        officeIds: [o.id],
        companyId: "company-demo",
        availability: true,
        createdAt: now - int(20, 300) * DAY,
        updatedAt: now - int(0, 20) * DAY,
    };
});

// ── Parcels ─────────────────────────────────────────────────────
type Stage = "shelf" | "called" | "assigned" | "delivered" | "returned" | "picked";

export interface MockParcel {
    parcelId: string;
    [key: string]: any;
}

const makeParcel = (i: number, stage: Stage, createdAt: number, office = HOME_OFFICE): MockParcel => {
    const homeDelivery = stage === "assigned" || stage === "delivered" || stage === "returned" || rand() < 0.4;
    const inboundCost = pick([10, 15, 20, 25, 30]);
    const deliveryCost = homeDelivery ? pick([15, 20, 25, 30, 35, 40]) : 0;
    const shelf = pick(SHELVES.filter((s) => s.office.id === office.id));
    const driverName = person();
    const pod = rand() < 0.25;
    return {
        parcelId: `PF${String(240000 + i * 37).padStart(6, "0")}`,
        senderName: person(),
        senderPhoneNumber: phone(),
        receiverName: person(),
        recieverPhoneNumber: phone(),
        alternativePhoneNumber: rand() < 0.3 ? phone() : undefined,
        receiverAddress: homeDelivery ? `${int(1, 60)} ${pick(STREETS)}, ${pick(AREAS)}` : undefined,
        parcelDescription: pick(ITEMS),
        driverName,
        driverPhoneNumber: phone(),
        driverId: `drv-${int(1, 6)}`,
        vehicleNumber: pick(VEHICLES),
        inboundCost,
        pickUpCost: 0,
        deliveryCost,
        storageCost: rand() < 0.15 ? 5 : 0,
        itemCost: pod ? pick([120, 250, 400, 680, 1200]) : undefined,
        shelfNumber: shelf.name,
        shelfName: shelf.name,
        shelfId: shelf.id,
        officeId: office.id,
        companyId: "company-demo",
        pod,
        fragile: rand() < 0.15,
        homeDelivery,
        typeofParcel: pick(["PARCEL", "PARCEL", "PARCEL", "ONLINE"]),
        parcelWeight: Math.round((0.3 + rand() * 8) * 10) / 10,
        hasCalled: stage !== "shelf",
        inboudPayed: rand() < 0.7,
        parcelAssigned: stage === "assigned",
        delivered: stage === "delivered" || stage === "picked",
        pickedUp: stage === "picked",
        returned: stage === "returned",
        cancelled: false,
        returnCount: stage === "returned" ? 1 : 0,
        parcelStatus: stage === "delivered" || stage === "picked" ? "DELIVERD" : stage === "returned" ? "FAILED" : "RECEIVED",
        registeredDate: createdAt,
        createdAt,
        updatedAt: createdAt + int(1, 30) * HOUR,
        barCode: `PF${240000 + i * 37}`,
        images: [],
        imageUrls: [],
    };
};

const stages: Stage[] = [];
// A realistic mix for the home branch
for (let i = 0; i < 18; i++) stages.push("shelf");
for (let i = 0; i < 12; i++) stages.push("called");
for (let i = 0; i < 14; i++) stages.push("assigned");
for (let i = 0; i < 30; i++) stages.push("delivered");
for (let i = 0; i < 4; i++) stages.push("returned");
for (let i = 0; i < 10; i++) stages.push("picked");

export const PARCELS: MockParcel[] = stages.map((stage, i) => {
    const ageDays = stage === "assigned" ? 0 : stage === "shelf" ? int(0, 3) : int(0, 9);
    return makeParcel(i, stage, now - ageDays * DAY - int(1, 9) * HOUR);
});

// A few parcels at other branches so admin views look system-wide
OFFICES.slice(1).forEach((o, oi) => {
    for (let k = 0; k < 6; k++) {
        PARCELS.push(makeParcel(200 + oi * 10 + k, pick(["shelf", "delivered", "called", "picked"] as Stage[]), now - int(0, 8) * DAY, o));
    }
});

// ── Rider assignments ───────────────────────────────────────────
export interface MockAssignment {
    assignmentId: string;
    riderId: string;
    status: string;
    assignedAt: number;
    acceptedAt?: number;
    completedAt?: number;
    payed: boolean;
    paymentMethod?: string;
    returnReason?: string;
    parcels: MockParcel[];
}

export const ASSIGNMENTS: MockAssignment[] = [];

const homeParcels = PARCELS.filter((p) => p.officeId === HOME_OFFICE.id);
const assignedParcels = homeParcels.filter((p) => p.parcelAssigned);
const deliveredHomeParcels = homeParcels.filter((p) => (p.delivered && !p.pickedUp) || p.returned);

// Active: the logged-in demo rider (rider-1) gets six of today's parcels
assignedParcels.forEach((p, idx) => {
    const rider = idx < 6 ? RIDERS[0] : RIDERS[1 + (idx % 4)];
    const assignedAt = Math.max(startOfToday + 7 * HOUR + idx * 9 * 60 * 1000, now - 6 * HOUR);
    p.riderId = rider.userId;
    p.riderInfo = { riderId: rider.userId, riderName: rider.name, riderPhoneNumber: rider.phoneNumber };
    ASSIGNMENTS.push({
        assignmentId: `asg-${p.parcelId}`,
        riderId: rider.userId,
        status: idx % 3 === 0 ? "ASSIGNED" : "ACCEPTED",
        assignedAt,
        acceptedAt: assignedAt + 10 * 60 * 1000,
        payed: false,
        parcels: [p],
    });
});

// Completed: spread across riders and days. rider-1 gets a good history.
deliveredHomeParcels.forEach((p, idx) => {
    const rider = idx % 2 === 0 ? RIDERS[0] : RIDERS[1 + (idx % 4)];
    // First few of rider-1's are today so "today collected" has a value
    const dayOffset = idx < 6 ? 0 : int(1, 9);
    const assignedAt = startOfToday - dayOffset * DAY + int(8, 11) * HOUR;
    const completedAt = Math.min(assignedAt + int(1, 5) * HOUR, now - 5 * 60 * 1000);
    p.riderId = rider.userId;
    p.riderInfo = { riderId: rider.userId, riderName: rider.name, riderPhoneNumber: rider.phoneNumber };
    p.deliveryDate = completedAt;
    ASSIGNMENTS.push({
        assignmentId: `asg-${p.parcelId}`,
        riderId: rider.userId,
        status: p.returned ? "RETURNED" : "DELIVERED",
        assignedAt,
        acceptedAt: assignedAt + 5 * 60 * 1000,
        completedAt,
        payed: dayOffset > 1,
        paymentMethod: p.returned ? undefined : pick(["cash", "momo"]),
        parcels: [p],
    });
});

export const parcelAmount = (p: MockParcel) =>
    (p.inboundCost || 0) + (p.pickUpCost || 0) + (p.deliveryCost || 0) + (p.storageCost || 0);

// Field lists copied from the backend OpenAPI spec (/shortly/v3/api-docs).
// Responses are trimmed to these so the mock can't hide a field the real API lacks.
const PARCEL_FIELDS = ["parcelId", "barCode", "parcelDescription", "inboundCost", "deliveryCost", "storageCost", "hasCalled", "pickedUp", "driverId", "officeId", "companyId", "paymentMethod", "driverName", "driverPhoneNumber", "vehicleNumber", "senderName", "senderPhoneNumber", "receiverName", "receiverAddress", "recieverPhoneNumber", "alternativePhoneNumber", "shelfName", "inboudPayed", "shelfId", "homeDelivery", "returnCount", "riderId", "riderInfo", "typeofParcel", "from", "to", "fromOfficeId", "toOfficeId", "hasArrivedAtOffice", "parcelTransfer", "pickupAddress", "pickupContactName", "pickupContactPhoneNumber", "pickupInstructions", "deliveryAddress", "deliveryContactName", "deliveryContactPhoneNumber", "specialInstructions", "pickUpCost", "parcelStatus", "imageUrls", "vendorName", "vendorId", "vendorDeliveryFee", "numberOfItems", "itemQuantity", "parcelWeight", "createdAt", "updatedAt", "callerName", "callerPhoneNumber", "notes", "hasCallCenterSpokenToClient", "callOutCome", "callCenterRemark", "pod", "delivered", "parcelAssigned", "itemCost", "vendorPayed", "fragile", "itemOwnerPaid"];
const PARCEL_INFO_FIELDS = ["parcelId", "receiverName", "receiverPhoneNumber", "alternativePhoneNumber", "receiverAddress", "senderName", "senderPhoneNumber", "parcelAmount", "parcelWeight", "payed", "returned", "delivered", "paymentMethod", "inboundCost", "deliveryCost", "imageUrls", "storageCost", "pickUpCost", "pickedUp", "homeDelivery", "vehicleNumber", "driverName", "driverPhoneNumber", "driverId", "officeId", "shelfName", "inboudPayed", "shelfId", "typeofParcel", "pickupAddress", "pickupContactName", "pickupContactPhoneNumber", "pickupInstructions", "deliveryAddress", "deliveryContactName", "deliveryContactPhoneNumber", "specialInstructions", "pod", "itemCost", "fragile"];
export const USER_FIELDS = ["userId", "name", "officeId", "companyId", "phoneNumber", "email", "availability", "status", "officeIds", "role", "departmentRole", "deviceImei", "createdAt", "updatedAt"];

export const only = (obj: Record<string, any>, fields: string[]) =>
    Object.fromEntries(fields.filter((f) => obj[f] !== undefined).map((f) => [f, obj[f]]));

export const serializeParcel = (p: MockParcel) => only(p, PARCEL_FIELDS);

const serializeParcelInfo = (p: MockParcel, a?: MockAssignment) =>
    only({ ...p, receiverPhoneNumber: p.recieverPhoneNumber, parcelAmount: parcelAmount(p), payed: a?.payed, paymentMethod: a?.paymentMethod }, PARCEL_INFO_FIELDS);

const riderInfo = (riderId: string) => {
    const r = RIDERS.find((x) => x.userId === riderId)!;
    return { riderId: r.userId, riderName: r.name, riderPhoneNumber: r.phoneNumber, stationName: HOME_OFFICE.name };
};

/** Shape of DeliveryAssignments in the spec. */
export const serializeAssignment = (a: MockAssignment) => ({
    assignmentId: a.assignmentId,
    riderInfo: riderInfo(a.riderId),
    parcels: a.parcels.map((p) => serializeParcelInfo(p, a)),
    officeId: HOME_OFFICE.id,
    companyId: "company-demo",
    status: a.status,
    assignedAt: a.assignedAt,
    acceptedAt: a.acceptedAt,
    completedAt: a.completedAt,
    payementMethod: a.paymentMethod,
    payed: a.payed,
    amount: a.parcels.reduce((s, p) => s + parcelAmount(p), 0),
    inboundCost: a.parcels.reduce((s, p) => s + (p.inboundCost || 0), 0),
    deliveryCost: a.parcels.reduce((s, p) => s + (p.deliveryCost || 0), 0),
    returnReason: a.returnReason,
    amountPayed: a.payed ? a.parcels.reduce((s, p) => s + parcelAmount(p), 0) : undefined,
    payedAt: a.payed ? a.completedAt : undefined,
    createdAt: a.assignedAt,
    updatedAt: a.completedAt ?? a.acceptedAt ?? a.assignedAt,
});

// ── Driver (inbound) assignments for the driver tracker ─────────
export const DRIVER_ASSIGNMENTS = homeParcels
    .filter((p) => !p.inboudPayed)
    .map((p, i) => ({
        id: `drva-${i}`,
        driverName: p.driverName,
        driverPhoneNumber: p.driverPhoneNumber,
        officeId: HOME_OFFICE.id,
        parcelId: p.parcelId,
        parcelInfo: serializeParcelInfo(p),
        payed: false,
        amount: p.inboundCost,
        delivered: !!p.delivered,
        createdAt: p.createdAt,
    }));

// ── Transfers ───────────────────────────────────────────────────
const transfer = (i: number, from: (typeof OFFICES)[number], to: (typeof OFFICES)[number]) => ({
    ...makeParcel(500 + i, "shelf", now - int(0, 3) * DAY, from),
    parcelTransfer: true,
    fromOfficeId: from.id,
    toOfficeId: to.id,
    destinationOfficeId: to.id,
    from: { officeId: from.id, officeName: from.name },
    to: { officeId: to.id, officeName: to.name },
    typeofParcel: "TRANSFER",
    hasArrivedAtOffice: false,
});
export const INCOMING_TRANSFERS = Array.from({ length: 5 }, (_, i) => transfer(i, OFFICES[1 + (i % 4)], HOME_OFFICE));
export const OUTGOING_TRANSFERS = Array.from({ length: 4 }, (_, i) => transfer(10 + i, HOME_OFFICE, OFFICES[1 + (i % 4)]));

// ── Fuel requests ───────────────────────────────────────────────
export const FUEL_REQUESTS = Array.from({ length: 7 }, (_, i) => {
    const rider = RIDERS[i % RIDERS.length];
    const createdAt = now - i * 1.3 * DAY - int(1, 5) * HOUR;
    return {
        id: `fuel-${i}`,
        status: (["PENDING", "APPROVED", "APPROVED", "APPROVED", "REJECTED", "APPROVED", "APPROVED"] as const)[i],
        riderInfo: { riderId: rider.userId, riderName: rider.name, riderPhoneNumber: rider.phoneNumber, stationName: HOME_OFFICE.name },
        officeId: HOME_OFFICE.id,
        station: pick(["Shell Ring Road", "GOIL Airport", "Total Osu", "Star Oil Madina"]),
        notes: i === 0 ? "Running low before afternoon route" : "",
        tank: pick(["FULL_TANK", "HALF_TANK", "LITRES"]),
        amount: i === 0 ? null : pick([80, 120, 150, 200]),
        fuleStationPhoneNumber: phone(),
        attendantPhoneNumber: phone(),
        createdAt,
        updatedAt: createdAt + 2 * HOUR,
    };
});

// ── Addresses (delivery zones & prices) ─────────────────────────
export const ADDRESSES = AREAS.map((name, i) => ({ id: `addr-${i + 1}`, name, officeId: HOME_OFFICE.id, cost: [20, 25, 30, 35, 40][i % 5] }));

// ── Audit log ───────────────────────────────────────────────────
export const USER_ACTIONS = Array.from({ length: 40 }, (_, i) => {
    const u = pick(USERS);
    return {
        id: `act-${i}`,
        userId: u.userId,
        userName: u.name,
        role: u.role,
        action: pick(["LOGIN", "CREATE_PARCEL", "UPDATE_PARCEL", "ASSIGN_PARCEL", "RECONCILE", "DELIVER_PARCEL"]),
        description: pick(["Registered parcel", "Updated shelf location", "Assigned 4 parcels to rider", "Reconciled rider payments", "Signed in"]),
        officeId: u.officeId,
        createdAt: now - i * 47 * 60 * 1000,
        timestamp: now - i * 47 * 60 * 1000,
    };
});
