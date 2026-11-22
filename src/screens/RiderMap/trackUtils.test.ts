import { describe, it, expect } from "vitest";
import {
    toApiTime, parseGpsTime, validateRange, distanceKm, normalizePoints, summarize,
    positionAt, indexAt, formatDuration, MAX_RANGE_MS, checkDeliveries,
} from "./trackUtils";

const MIN = 60_000;
const T0 = Date.UTC(2026, 10, 20, 8, 0, 0); // 2026-11-20 08:00:00 UTC

describe("API time format", () => {
    it("formats epoch ms as UTC yyyy-MM-dd HH:mm:ss", () => {
        expect(toApiTime(T0 + 5 * MIN + 7000)).toBe("2026-11-20 08:05:07");
    });
    it("round-trips through parseGpsTime", () => {
        expect(parseGpsTime(toApiTime(T0))).toBe(T0);
    });
    it("rejects missing or garbage times", () => {
        expect(parseGpsTime(undefined)).toBeNull();
        expect(parseGpsTime("not a time")).toBeNull();
    });
});

describe("validateRange", () => {
    const now = T0 + 10 * 24 * 60 * MIN;
    it("accepts a range within the limits", () => {
        expect(validateRange(now - 24 * 60 * MIN, now, now)).toBeNull();
    });
    it("rejects end before start", () => {
        expect(validateRange(now, now - MIN, now)).toMatch(/after the start/);
    });
    it("rejects more than 2 days", () => {
        expect(validateRange(now - MAX_RANGE_MS - MIN, now, now)).toMatch(/2 days/);
    });
    it("rejects anything older than 3 months", () => {
        const start = now - 100 * 24 * 60 * MIN;
        expect(validateRange(start, start + 60 * MIN, now)).toMatch(/3 months/);
    });
});

describe("distanceKm", () => {
    it("is about 111 km per degree of latitude", () => {
        expect(distanceKm({ lat: 5, lng: 0 }, { lat: 6, lng: 0 })).toBeCloseTo(111.2, 0);
    });
});

// A route: drive 10 min, stand still 10 min, drive 2 min, pause 2 min (too short to be a stop), drive 1 min.
const raw = [
    ...Array.from({ length: 11 }, (_, i) => ({ lat: 5.6 + i * 0.001, lng: -0.2, speed: 30, t: T0 + i * MIN })),
    ...Array.from({ length: 10 }, (_, i) => ({ lat: 5.61, lng: -0.2, speed: 0, t: T0 + (11 + i) * MIN })),
    ...Array.from({ length: 2 }, (_, i) => ({ lat: 5.611 + i * 0.001, lng: -0.2, speed: 25, t: T0 + (21 + i) * MIN })),
    ...Array.from({ length: 2 }, (_, i) => ({ lat: 5.613, lng: -0.2, speed: 0, t: T0 + (23 + i) * MIN })),
    { lat: 5.614, lng: -0.2, speed: 20, t: T0 + 25 * MIN },
].map((p) => ({ ...p, gpsTime: toApiTime(p.t) }));

describe("normalizePoints", () => {
    it("sorts by time and drops points without a position", () => {
        const pts = normalizePoints([raw[2], raw[0], { ...raw[1], lat: NaN }, { ...raw[3], lat: 0, lng: 0 }]);
        expect(pts.map((p) => p.t)).toEqual([raw[0], raw[2]].map((p) => parseGpsTime(p.gpsTime)));
    });
});

describe("summarize", () => {
    const s = summarize(normalizePoints(raw));
    it("finds the 10-minute stop and ignores the 2-minute pause", () => {
        expect(s.stops).toHaveLength(1);
        expect(s.stops[0].start).toBe(T0 + 11 * MIN);
        // Runs until the rider moves again at minute 21.
        expect(s.stops[0].end - s.stops[0].start).toBe(10 * MIN);
    });
    it("splits moving and stopped time across the whole span", () => {
        expect(s.movingMs + s.stoppedMs).toBe(25 * MIN);
        expect(s.stoppedMs).toBe(10 * MIN);
    });
    it("reports top speed and a plausible distance", () => {
        expect(s.maxSpeed).toBe(30);
        expect(s.distanceKm).toBeGreaterThan(1.5);
        expect(s.distanceKm).toBeLessThan(1.7);
    });
    it("handles an empty track", () => {
        expect(summarize([])).toEqual({ distanceKm: 0, movingMs: 0, stoppedMs: 0, maxSpeed: 0, stops: [] });
    });
});

describe("positionAt / indexAt", () => {
    const pts = normalizePoints(raw);
    it("interpolates halfway between two points", () => {
        const p = positionAt(pts, T0 + 30_000)!;
        expect(p.lat).toBeCloseTo(5.6005, 6);
    });
    it("clamps before the start and after the end", () => {
        expect(positionAt(pts, T0 - MIN)!.t).toBe(T0);
        expect(positionAt(pts, T0 + 99 * MIN)!.t).toBe(pts[pts.length - 1].t);
    });
    it("finds the last point at or before a time", () => {
        expect(indexAt(pts, T0 + 90_000)).toBe(1);
        expect(indexAt(pts, T0 - 1)).toBe(-1);
    });
});

describe("formatDuration", () => {
    it("formats minutes and hours", () => {
        expect(formatDuration(14 * MIN)).toBe("14 min");
        expect(formatDuration(125 * MIN)).toBe("2 h 5 min");
        expect(formatDuration(120 * MIN)).toBe("2 h");
    });
});

describe("checkDeliveries", () => {
    // Rider drives north from 5.600 to 5.610 over 10 minutes, then waits at 5.610 for 10 minutes.
    const pts = normalizePoints(raw).filter((p) => p.t <= T0 + 20 * MIN);
    const range = { start: T0, end: T0 + 60 * MIN };
    const stop = (over: Partial<import("./trackUtils").DeliveryStop>) => ({ id: "a", parcelId: "P1", status: "DELIVERED", ...over });

    it("marks a drop-off the rider waited at as visited, with arrival and departure", () => {
        const [r] = checkDeliveries(pts, [stop({ lat: 5.61, lng: -0.2, completedAt: T0 + 15 * MIN })], range);
        expect(r.kind).toBe("visited");
        if (r.kind !== "visited") return;
        expect(r.arrivedAt).toBe(T0 + 9 * MIN); // 5.609 is ~111 m away, inside 150 m
        expect(r.leftAt).toBe(T0 + 20 * MIN);
        expect(r.markedAwayM).toBeUndefined();
    });

    it("reports a drop-off the GPS never reached, with the closest approach", () => {
        const [r] = checkDeliveries(pts, [stop({ lat: 5.63, lng: -0.2, completedAt: T0 + 15 * MIN })], range);
        expect(r.kind).toBe("not-visited");
        if (r.kind !== "not-visited") return;
        expect(r.closestM).toBeGreaterThan(2000);
        expect(r.closestM).toBeLessThan(2300);
        expect(r.markedAwayM).toBeGreaterThan(2000); // marked done ~2.2 km away
    });

    it("flags a visit that was marked done somewhere else", () => {
        // Visited at the start (5.600), but marked done at minute 15 while waiting at 5.610 (~1.1 km away).
        const [r] = checkDeliveries(pts, [stop({ lat: 5.6, lng: -0.2, completedAt: T0 + 15 * MIN })], range);
        expect(r.kind).toBe("visited");
        expect(r.kind === "visited" && r.markedAwayM! > 1000).toBe(true);
    });

    it("handles parcels without a pin and periods without GPS", () => {
        const [a, b] = checkDeliveries(pts, [
            stop({}),
            stop({ id: "b", lat: 5.61, lng: -0.2, assignedAt: T0 + 40 * MIN, completedAt: T0 + 45 * MIN }),
        ], range);
        expect(a.kind).toBe("no-location");
        expect(b.kind).toBe("no-data");
    });

    it("treats unfinished deliveries the rider hasn't reached as pending, not failed", () => {
        const [r] = checkDeliveries(pts, [stop({ lat: 5.63, lng: -0.2, status: "ACCEPTED" })], range);
        expect(r.kind).toBe("pending");
    });
});
