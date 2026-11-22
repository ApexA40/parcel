/**
 * Helpers for rider GPS history: API time formats, range limits, route summary,
 * stop detection and the interpolated position used by playback.
 */

export interface TrackPointLike {
    lat: number;
    lng: number;
    speed?: number;
    direction?: number;
    gpsTime: string;
}

export interface TimedPoint {
    lat: number;
    lng: number;
    speed: number;
    direction?: number;
    t: number; // epoch ms
}

export interface Stop {
    lat: number;
    lng: number;
    start: number;
    end: number;
}

export interface TrackSummary {
    distanceKm: number;
    movingMs: number;
    stoppedMs: number;
    maxSpeed: number;
    stops: Stop[];
}

const MINUTE = 60_000;
export const MAX_RANGE_MS = 2 * 24 * 60 * MINUTE; // API limit: 2 days per request
export const MAX_AGE_MS = 90 * 24 * 60 * MINUTE; // API limit: last 3 months

/** Below this speed (km/h) a rider counts as standing still. */
export const STOP_SPEED_KMH = 3;
/** A standstill shorter than this isn't reported as a stop. */
export const MIN_STOP_MS = 5 * MINUTE;
/** Gaps between points longer than this aren't counted as moving or stopped time. */
const MAX_GAP_MS = 15 * MINUTE;

const pad = (n: number) => String(n).padStart(2, "0");

/** The tracking API takes and returns UTC "yyyy-MM-dd HH:mm:ss". */
export const toApiTime = (ms: number) => {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
};

/** Parses the API's UTC "yyyy-MM-dd HH:mm:ss"; falls back to Date parsing for other formats. */
export const parseGpsTime = (t?: string): number | null => {
    if (!t) return null;
    const m = t.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    const ms = Date.parse(t);
    return Number.isNaN(ms) ? null : ms;
};

/** Returns a reason the range can't be requested, or null if it's fine. */
export const validateRange = (start: number, end: number, now = Date.now()): string | null => {
    if (!Number.isFinite(start) || !Number.isFinite(end)) return "Choose a start and end time.";
    if (end <= start) return "The end must be after the start.";
    if (start > now) return "The start is in the future.";
    if (end - start > MAX_RANGE_MS) return "Pick at most 2 days at a time.";
    if (start < now - MAX_AGE_MS) return "History only goes back 3 months.";
    return null;
};

/** Great-circle distance in kilometres. */
export const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** Drops points without a usable position or time, and sorts by time. */
export const normalizePoints = (points: TrackPointLike[] | undefined): TimedPoint[] =>
    (points ?? [])
        .map((p) => ({ lat: p.lat, lng: p.lng, speed: p.speed ?? 0, direction: p.direction, t: parseGpsTime(p.gpsTime) ?? NaN }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Number.isFinite(p.t) && !(p.lat === 0 && p.lng === 0))
        .sort((a, b) => a.t - b.t);

export const summarize = (points: TimedPoint[]): TrackSummary => {
    let distance = 0, moving = 0, stopped = 0, maxSpeed = 0;
    const stops: Stop[] = [];
    let runStart: number | null = null; // index where the current standstill began

    const closeRun = (endIdx: number) => {
        if (runStart === null) return;
        const s = points[runStart];
        const e = points[endIdx];
        if (e.t - s.t >= MIN_STOP_MS) stops.push({ lat: s.lat, lng: s.lng, start: s.t, end: e.t });
        runStart = null;
    };

    points.forEach((p, i) => {
        maxSpeed = Math.max(maxSpeed, p.speed);
        const still = p.speed < STOP_SPEED_KMH;
        if (still && runStart === null) runStart = i;
        if (!still) closeRun(i);
        if (i === 0) return;
        const prev = points[i - 1];
        const dt = p.t - prev.t;
        distance += distanceKm(prev, p);
        if (dt > MAX_GAP_MS) { closeRun(i - 1); if (still) runStart = i; return; }
        if (still && prev.speed < STOP_SPEED_KMH) stopped += dt;
        else moving += dt;
    });
    if (points.length) closeRun(points.length - 1);

    return { distanceKm: distance, movingMs: moving, stoppedMs: stopped, maxSpeed, stops };
};

/** Position at time t, interpolated between the two surrounding points. */
export const positionAt = (points: TimedPoint[], t: number): TimedPoint | null => {
    if (points.length === 0) return null;
    if (t <= points[0].t) return points[0];
    const last = points[points.length - 1];
    if (t >= last.t) return last;
    // binary search for the last point at or before t
    let lo = 0, hi = points.length - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (points[mid].t <= t) lo = mid; else hi = mid;
    }
    const a = points[lo], b = points[hi];
    const f = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
    return {
        lat: a.lat + (b.lat - a.lat) * f,
        lng: a.lng + (b.lng - a.lng) * f,
        speed: a.speed + (b.speed - a.speed) * f,
        direction: b.direction ?? a.direction,
        t,
    };
};

/** Index of the last point at or before t (for drawing the travelled part of the route). */
export const indexAt = (points: TimedPoint[], t: number) => {
    let lo = 0, hi = points.length - 1;
    if (hi < 0 || t < points[0].t) return -1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (points[mid].t <= t) lo = mid; else hi = mid - 1;
    }
    return lo;
};

export const formatDuration = (ms: number) => {
    const m = Math.round(ms / MINUTE);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
};
