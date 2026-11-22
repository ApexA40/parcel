import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Pause, Play, RotateCcw, Loader, MapPin } from "lucide-react";
import { Button } from "../../components/ui/button";
import adminService from "../../services/adminService";
import {
    TimedPoint, formatDuration, indexAt, normalizePoints, positionAt, summarize, toApiTime, validateRange,
} from "./trackUtils";

type Preset = "today" | "yesterday" | "custom";
const SPEEDS = [1, 10, 60] as const;
const DAY = 24 * 60 * 60 * 1000;

const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0)).getTime();

/** "2026-11-22T08:30" for <input type="datetime-local"> in local time. */
const toLocalInput = (ms: number) => {
    const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60_000);
    return d.toISOString().slice(0, 16);
};
const fromLocalInput = (v: string) => (v ? new Date(v).getTime() : NaN);

const clock = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const clockSec = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

interface Props {
    rider: { name: string; phoneNumber: string };
    /** The shared google.maps.Map, or null while it loads / if it can't. */
    map: any;
    onClose: () => void;
}

/**
 * Route playback for one rider, drawn on the Rider Map's Google Map.
 * Uses GET /api-admin/riders/track (max 2 days per request, last 3 months).
 */
export const RouteHistoryPanel = ({ rider, map, onClose }: Props) => {
    const [preset, setPreset] = useState<Preset>("today");
    const [customStart, setCustomStart] = useState(() => toLocalInput(startOfToday() - DAY));
    const [customEnd, setCustomEnd] = useState(() => toLocalInput(Date.now()));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [points, setPoints] = useState<TimedPoint[] | null>(null);
    const [current, setCurrent] = useState(0); // playback time, epoch ms
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(60);

    const range = useMemo(() => {
        const now = Date.now();
        if (preset === "today") return { start: startOfToday(), end: now };
        if (preset === "yesterday") return { start: startOfToday() - DAY, end: startOfToday() - 1 };
        return { start: fromLocalInput(customStart), end: Math.min(fromLocalInput(customEnd), now) };
    }, [preset, customStart, customEnd]);
    const rangeError = validateRange(range.start, range.end);

    // ── Load ────────────────────────────────────────────────────
    const load = useCallback(async () => {
        if (rangeError) return;
        setLoading(true);
        setError(null);
        setPlaying(false);
        const res = await adminService.getRiderTrack(rider.phoneNumber, toApiTime(range.start), toApiTime(range.end));
        setLoading(false);
        if (!res.success) {
            setPoints(null);
            setError(
                res.status === 422 ? "This rider has no GPS device assigned. Assign one in User Management." :
                res.status === 404 ? "This rider wasn't found in the tracking system." :
                res.status === 403 ? "Your account isn't allowed to view rider routes." :
                res.status === 502 ? "The GPS tracking service didn't respond. Try again in a moment." :
                res.message || "Couldn't load the route."
            );
            return;
        }
        const pts = normalizePoints(res.data?.trackPoints);
        setPoints(pts);
        setCurrent(pts[0]?.t ?? 0);
    }, [rider.phoneNumber, range.start, range.end, rangeError]);

    // Presets load straight away; custom ranges wait for the Load button.
    useEffect(() => {
        if (preset !== "custom") load();
        else { setPlaying(false); setPoints(null); setError(null); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preset, rider.phoneNumber]);

    const summary = useMemo(() => (points ? summarize(points) : null), [points]);
    const first = points?.[0]?.t ?? 0;
    const last = points?.[points.length - 1]?.t ?? 0;
    const here = points ? positionAt(points, current) : null;

    // ── Playback loop ───────────────────────────────────────────
    const frame = useRef<number>();
    useEffect(() => {
        if (!playing || !points?.length) return;
        let prev = performance.now();
        const tick = (now: number) => {
            const dt = now - prev;
            prev = now;
            setCurrent((t) => {
                const next = t + dt * speed;
                if (next >= last) { setPlaying(false); return last; }
                return next;
            });
            frame.current = requestAnimationFrame(tick);
        };
        frame.current = requestAnimationFrame(tick);
        return () => { if (frame.current) cancelAnimationFrame(frame.current); };
    }, [playing, speed, points, last]);

    const togglePlay = () => {
        if (!points?.length) return;
        if (!playing && current >= last) setCurrent(first); // replay from the start
        setPlaying((p) => !p);
    };

    // ── Map drawing ─────────────────────────────────────────────
    const shapes = useRef<{ route?: any; travelled?: any; rider?: any; fixed: any[] }>({ fixed: [] });
    const lastIdx = useRef(-2);

    useEffect(() => {
        const g = (window as any).google;
        if (!g || !map || !points || points.length === 0) return;
        const path = points.map((p) => ({ lat: p.lat, lng: p.lng }));
        const s = shapes.current;
        s.route = new g.maps.Polyline({ map, path, strokeColor: "#9ca3af", strokeOpacity: 0.9, strokeWeight: 4 });
        s.travelled = new g.maps.Polyline({ map, path: [], strokeColor: "#ea690c", strokeOpacity: 1, strokeWeight: 5 });
        const pin = (pos: { lat: number; lng: number }, color: string, text: string, title: string, scale = 11) =>
            new g.maps.Marker({
                map, position: pos, title,
                icon: { path: g.maps.SymbolPath.CIRCLE, scale, fillColor: color, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
                label: text ? { text, color: "#fff", fontSize: "10px", fontWeight: "700" } : undefined,
            });
        s.fixed.push(pin(path[0], "#16a34a", "S", `Start ${clock(points[0].t)}`));
        s.fixed.push(pin(path[path.length - 1], "#111827", "E", `End ${clock(points[points.length - 1].t)}`));
        summary?.stops.forEach((st) => {
            const m = pin({ lat: st.lat, lng: st.lng }, "#d97706", "", `Stopped ${formatDuration(st.end - st.start)} (${clock(st.start)}–${clock(st.end)})`, 7);
            m.addListener("click", () => { setPlaying(false); setCurrent(st.start); });
            s.fixed.push(m);
        });
        s.rider = new g.maps.Marker({
            map, position: path[0], title: rider.name, zIndex: 10,
            icon: { path: g.maps.SymbolPath.CIRCLE, scale: 9, fillColor: "#ea690c", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 },
        });
        const bounds = new g.maps.LatLngBounds();
        path.forEach((p) => bounds.extend(p));
        map.fitBounds(bounds, 48);
        lastIdx.current = -2;
        return () => {
            s.route?.setMap(null);
            s.travelled?.setMap(null);
            s.rider?.setMap(null);
            s.fixed.forEach((m) => m.setMap(null));
            shapes.current = { fixed: [] };
        };
    }, [map, points, summary, rider.name]);

    // Move the rider marker every frame; extend the orange line only when a new point is passed.
    useEffect(() => {
        const s = shapes.current;
        if (!points || !here || !s.rider) return;
        s.rider.setPosition({ lat: here.lat, lng: here.lng });
        const idx = indexAt(points, current);
        if (idx !== lastIdx.current) {
            lastIdx.current = idx;
            s.travelled?.setPath(points.slice(0, idx + 1).map((p) => ({ lat: p.lat, lng: p.lng })));
        }
    }, [points, here, current]);

    // ── UI ──────────────────────────────────────────────────────
    const presetBtn = (key: Preset, label: string) => (
        <button
            key={key}
            onClick={() => setPreset(key)}
            className={`flex-1 h-9 rounded-md text-sm font-medium transition ${preset === key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600"}`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-col">
            <div className="flex items-center gap-2 p-3 border-b border-[#ececec]">
                <button onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-gray-100 flex items-center justify-center" aria-label="Back to live map">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-800 truncate">{rider.name} · route history</p>
                    <p className="text-xs text-[#9a9a9a]">{rider.phoneNumber}</p>
                </div>
            </div>

            <div className="p-3 space-y-3 border-b border-[#ececec]">
                <div className="flex p-1 rounded-lg bg-gray-100">
                    {presetBtn("today", "Today")}
                    {presetBtn("yesterday", "Yesterday")}
                    {presetBtn("custom", "Custom")}
                </div>
                {preset === "custom" && (
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-neutral-700">
                            From
                            <input type="datetime-local" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                                className="mt-1 w-full h-9 px-2 rounded-lg border border-[#d1d1d1] text-sm" />
                        </label>
                        <label className="block text-xs font-medium text-neutral-700">
                            To
                            <input type="datetime-local" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                                className="mt-1 w-full h-9 px-2 rounded-lg border border-[#d1d1d1] text-sm" />
                        </label>
                        {rangeError ? (
                            <p className="text-xs text-red-600">{rangeError}</p>
                        ) : (
                            <p className="text-xs text-[#9a9a9a]">Up to 2 days at a time, within the last 3 months.</p>
                        )}
                        <Button onClick={load} disabled={!!rangeError || loading} className="w-full bg-[#ea690c] text-white hover:bg-[#ea690c]/90">
                            Load route
                        </Button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="p-8 flex items-center justify-center gap-2 text-sm text-[#5d5d5d]">
                    <Loader className="w-4 h-4 animate-spin" /> Loading route…
                </div>
            ) : error ? (
                <div className="p-6 text-sm text-red-600 space-y-3">
                    <p>{error}</p>
                    <Button onClick={load} variant="outline" className="border border-[#d1d1d1]">Try again</Button>
                </div>
            ) : points && points.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#5d5d5d]">
                    <MapPin className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    No GPS points were recorded in this period.
                </div>
            ) : points && summary ? (
                <>
                    {/* Player */}
                    <div className="p-3 space-y-2 border-b border-[#ececec]">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={togglePlay}
                                className="h-10 w-10 shrink-0 rounded-full bg-[#ea690c] text-white flex items-center justify-center active:scale-95"
                                aria-label={playing ? "Pause" : current >= last ? "Replay" : "Play"}
                            >
                                {playing ? <Pause className="w-4 h-4" /> : current >= last ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </button>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-neutral-800 tabular-nums">{clockSec(current || first)}</p>
                                <p className="text-xs text-[#5d5d5d]">{here ? `${Math.round(here.speed)} km/h` : ""}</p>
                            </div>
                            <div className="flex rounded-lg border border-[#d1d1d1] overflow-hidden" role="group" aria-label="Playback speed">
                                {SPEEDS.map((sp) => (
                                    <button
                                        key={sp}
                                        onClick={() => setSpeed(sp)}
                                        className={`px-2.5 h-8 text-xs font-medium ${speed === sp ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-gray-50"}`}
                                        aria-pressed={speed === sp}
                                    >
                                        {sp}×
                                    </button>
                                ))}
                            </div>
                        </div>
                        <input
                            type="range"
                            min={first}
                            max={last}
                            step={1000}
                            value={current || first}
                            onChange={(e) => { setPlaying(false); setCurrent(Number(e.target.value)); }}
                            className="w-full accent-[#ea690c]"
                            aria-label="Playback position"
                        />
                        <div className="flex justify-between text-[11px] text-[#9a9a9a] tabular-nums">
                            <span>{clock(first)}</span>
                            <span>{clock(last)}</span>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-px bg-[#ececec] border-b border-[#ececec]">
                        {[
                            ["Distance", `${summary.distanceKm.toFixed(1)} km`],
                            ["Top speed", `${Math.round(summary.maxSpeed)} km/h`],
                            ["Moving", formatDuration(summary.movingMs)],
                            ["Stopped", formatDuration(summary.stoppedMs)],
                        ].map(([k, v]) => (
                            <div key={k} className="bg-white px-3 py-2.5">
                                <p className="text-[11px] text-[#9a9a9a]">{k}</p>
                                <p className="text-sm font-semibold text-neutral-800">{v}</p>
                            </div>
                        ))}
                    </div>

                    {/* Stops */}
                    <div className="p-3">
                        <p className="text-xs font-semibold text-neutral-700 mb-2">
                            Stops over 5 min · {summary.stops.length}
                        </p>
                        {summary.stops.length === 0 ? (
                            <p className="text-xs text-[#9a9a9a]">No long stops in this period.</p>
                        ) : (
                            <ul className="space-y-1 max-h-[220px] overflow-y-auto">
                                {summary.stops.map((st) => (
                                    <li key={st.start}>
                                        <button
                                            onClick={() => { setPlaying(false); setCurrent(st.start); map?.panTo({ lat: st.lat, lng: st.lng }); }}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 text-left"
                                        >
                                            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                                            <span className="text-sm text-neutral-800 tabular-nums">{clock(st.start)}–{clock(st.end)}</span>
                                            <span className="ml-auto text-xs text-[#5d5d5d]">{formatDuration(st.end - st.start)}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <p className="px-3 pb-3 text-[11px] text-[#9a9a9a]">
                        {points.length} GPS points · {clock(first)}–{clock(last)}
                    </p>
                </>
            ) : null}
        </div>
    );
};
