import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Clock,
  Building2,
  CalendarIcon,
  Download,
  RefreshCw,
  Banknote,
  Wallet,
  CheckCircle2,
  XCircle,
  Bike,
  ChevronRight,
  Loader,
} from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { useLocation } from "../../../contexts/LocationContext";
import { formatCurrency } from "../../../utils/dataHelpers";
import { runPool } from "../../../utils/asyncPool";
import adminService from "../../../services/adminService";
import { useToast } from "../../../components/ui/toast";
import { exportService } from "../../../services/exportService";

// MUI X Charts
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";

interface DailySummary {
  dateKey: string;
  date: Date;
  label: string;
  dayOfWeek: number;
  delivered: number;
  failed: number;
  pending: number;
  revenue: number; // delivered + failed parcel amount (attempted value)
  collected: number; // delivered parcel amount (actually collected)
  outstanding: number; // failed/returned parcel amount (not collected)
  deliveryFees: number;
  inboundFees: number;
  cash: number;
  momo: number;
  other: number;
  activeRiders: Set<string>;
}

interface StationStat {
  stationId: string;
  stationName: string;
  delivered: number;
  failed: number;
  pending: number;
  revenue: number;
  collected: number;
  outstanding: number;
  deliveryFees: number;
  inboundFees: number;
  riderIds: Set<string>;
}

interface RiderStat {
  riderId: string;
  riderName: string;
  delivered: number;
  failed: number;
  revenue: number;
  collected: number;
  outstanding: number;
  deliveryFees: number;
  inboundFees: number;
  activeDays: Set<string>;
}

interface RiderDayEntry {
  riderId: string;
  riderName: string;
  date: Date;
  delivered: number;
  collected: number;
}

interface EarningsPeriod {
  periodKey: string;
  periodLabel: string;
  revenue: number;
  collected: number;
  parcels: number;
  riders: { riderId: string; riderName: string; revenue: number; parcels: number }[];
}

const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function periodKeyFor(date: Date, granularity: "day" | "week" | "month" | "year") {
  if (granularity === "day") {
    return { key: dateKey(date), label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
  }
  if (granularity === "month") {
    const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
    return { key, label: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }) };
  }
  if (granularity === "year") {
    return { key: String(date.getFullYear()), label: String(date.getFullYear()) };
  }
  // week: Monday-start
  const d = new Date(date);
  const dow = d.getDay();
  const diffToMonday = (dow + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return { key: dateKey(d), label: `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` };
}

// Inline sub-component: collapsible period row with per-rider breakdown
function EarningsPeriodRow({ period }: { period: EarningsPeriod }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-neutral-800">{period.periodLabel}</span>
        </div>
        <span className="text-xs text-gray-500">{period.parcels} parcels</span>
        <span className="text-sm font-bold text-[#ea690c] w-28 text-right">{formatCurrency(period.revenue)}</span>
        <span className="text-xs font-medium text-green-600 w-28 text-right">{formatCurrency(period.collected)} collected</span>
        <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Per-Rider Breakdown</p>
          {period.riders.length > 0 ? (
            <div className="space-y-1.5">
              {period.riders.sort((a, b) => b.revenue - a.revenue).map((r) => (
                <div key={r.riderId} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28 truncate">{r.riderName}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#ea690c] h-1.5 rounded-full"
                      style={{ width: `${period.revenue > 0 ? Math.round((r.revenue / period.revenue) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#ea690c] w-20 text-right">{formatCurrency(r.revenue)}</span>
                  <span className="text-xs text-gray-400 w-16 text-right">{r.parcels} parcels</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No rider activity in this period</p>
          )}
        </div>
      )}
    </div>
  );
}

export const AdminFinancialDashboard = (): JSX.Element => {
  const { stations, loading: stationsLoading, refreshLocations } = useLocation();
  const { showToast } = useToast();

  useEffect(() => {
    if (stations.length === 0) refreshLocations();
  }, []);

  const [selectedOfficeId, setSelectedOfficeId] = useState("");
  const [dateRange, setDateRange] = useState<"7" | "30" | "90">("30");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "revenue" | "operations" | "riders">("overview");
  const [earningsPeriod, setEarningsPeriod] = useState<"day" | "week" | "month" | "year">("day");

  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [stationStats, setStationStats] = useState<StationStat[]>([]);
  const [riderStats, setRiderStats] = useState<RiderStat[]>([]);
  const [riderDayEntries, setRiderDayEntries] = useState<RiderDayEntry[]>([]);

  useEffect(() => {
    if (!selectedOfficeId && stations.length > 0) {
      setSelectedOfficeId("all");
    }
  }, [stations, selectedOfficeId]);

  const selectedOfficeName =
    selectedOfficeId === "all"
      ? "All Stations"
      : stations.find((s) => s.id === selectedOfficeId)?.name || "All Stations";

  // ── Real data fetch: reconciliations for every scoped station × day in range ──
  useEffect(() => {
    if (stations.length === 0 || !selectedOfficeId) return;

    const load = async () => {
      setLoading(true);
      try {
        const days = parseInt(dateRange, 10);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dates: Date[] = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          dates.push(d);
        }

        const scopedStations =
          selectedOfficeId === "all" ? stations : stations.filter((s) => s.id === selectedOfficeId);

        const tasks: (() => Promise<{ stationId: string; date: Date; assignments: any[] }>)[] = [];
        scopedStations.forEach((station) => {
          dates.forEach((date) => {
            tasks.push(() =>
              adminService.getOfficeReconciliationsByDate(station.id, date.getTime()).then((res) => ({
                stationId: station.id,
                date,
                assignments:
                  res.success && res.data
                    ? Array.isArray(res.data)
                      ? (res.data as any)
                      : (res.data as any).content || []
                    : [],
              }))
            );
          });
        });

        const results = await runPool(tasks, 12);

        const dailyMap = new Map<string, DailySummary>();
        dates.forEach((date) => {
          const key = dateKey(date);
          dailyMap.set(key, {
            dateKey: key,
            date,
            label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            dayOfWeek: date.getDay(),
            delivered: 0,
            failed: 0,
            pending: 0,
            revenue: 0,
            collected: 0,
            outstanding: 0,
            deliveryFees: 0,
            inboundFees: 0,
            cash: 0,
            momo: 0,
            other: 0,
            activeRiders: new Set(),
          });
        });

        const stationMap = new Map<string, StationStat>();
        scopedStations.forEach((s) =>
          stationMap.set(s.id, {
            stationId: s.id,
            stationName: s.name,
            delivered: 0,
            failed: 0,
            pending: 0,
            revenue: 0,
            collected: 0,
            outstanding: 0,
            deliveryFees: 0,
            inboundFees: 0,
            riderIds: new Set(),
          })
        );

        const riderMap = new Map<string, RiderStat>();
        const riderDayMap = new Map<string, RiderDayEntry>();

        results.forEach(({ stationId, date, assignments }) => {
          const key = dateKey(date);
          const day = dailyMap.get(key)!;
          const station = stationMap.get(stationId)!;

          assignments.forEach((assignment: any) => {
            const riderId = assignment.riderInfo?.riderId || assignment.riderId || "unknown";
            const riderName = assignment.riderInfo?.riderName || assignment.riderName || "Unknown";

            if (!riderMap.has(riderId)) {
              riderMap.set(riderId, {
                riderId,
                riderName,
                delivered: 0,
                failed: 0,
                revenue: 0,
                collected: 0,
                outstanding: 0,
                deliveryFees: 0,
                inboundFees: 0,
                activeDays: new Set(),
              });
            }
            const rider = riderMap.get(riderId)!;

            (assignment.parcels || []).forEach((parcel: any) => {
              const isDelivered = parcel.delivered && !parcel.cancelled;
              const isReturned = !!parcel.returned;
              const amount = parcel.parcelAmount || 0;
              const deliveryFee = parcel.deliveryCost || 0;
              const inboundFee = parcel.inboundCost || 0;

              if (isDelivered) {
                day.delivered++;
                day.revenue += amount;
                day.collected += amount;
                day.deliveryFees += deliveryFee;
                day.inboundFees += inboundFee;
                day.activeRiders.add(riderId);

                station.delivered++;
                station.revenue += amount;
                station.collected += amount;
                station.deliveryFees += deliveryFee;
                station.inboundFees += inboundFee;
                station.riderIds.add(riderId);

                rider.delivered++;
                rider.revenue += amount;
                rider.collected += amount;
                rider.deliveryFees += deliveryFee;
                rider.inboundFees += inboundFee;
                rider.activeDays.add(key);

                const method = (parcel.paymentMethod || "other").toLowerCase();
                if (method === "cash") day.cash += amount;
                else if (method === "momo") day.momo += amount;
                else day.other += amount;

                const rdKey = `${key}__${riderId}`;
                if (!riderDayMap.has(rdKey)) {
                  riderDayMap.set(rdKey, { riderId, riderName, date, delivered: 0, collected: 0 });
                }
                const rd = riderDayMap.get(rdKey)!;
                rd.delivered++;
                rd.collected += amount;
              } else if (isReturned) {
                day.failed++;
                day.revenue += amount;
                day.outstanding += amount;
                day.activeRiders.add(riderId);

                station.failed++;
                station.revenue += amount;
                station.outstanding += amount;
                station.riderIds.add(riderId);

                rider.failed++;
                rider.revenue += amount;
                rider.outstanding += amount;
                rider.activeDays.add(key);
              } else if (!parcel.cancelled) {
                day.pending++;
                station.pending++;
              }
            });
          });
        });

        setDailySummaries(Array.from(dailyMap.values()));
        setStationStats(Array.from(stationMap.values()).sort((a, b) => b.revenue - a.revenue));
        setRiderStats(Array.from(riderMap.values()).sort((a, b) => b.delivered - a.delivered));
        setRiderDayEntries(Array.from(riderDayMap.values()));
      } catch (err) {
        console.error("Failed to load financial statistics:", err);
        showToast("Failed to load statistics. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOfficeId, dateRange, stations, refreshKey]);

  const kpis = useMemo(() => {
    const totalDelivered = dailySummaries.reduce((s, d) => s + d.delivered, 0);
    const totalFailed = dailySummaries.reduce((s, d) => s + d.failed, 0);
    const totalPending = dailySummaries.reduce((s, d) => s + d.pending, 0);
    const totalRevenue = dailySummaries.reduce((s, d) => s + d.revenue, 0);
    const totalCollected = dailySummaries.reduce((s, d) => s + d.collected, 0);
    const totalOutstanding = dailySummaries.reduce((s, d) => s + d.outstanding, 0);
    const totalDeliveryFees = dailySummaries.reduce((s, d) => s + d.deliveryFees, 0);
    const totalInboundFees = dailySummaries.reduce((s, d) => s + d.inboundFees, 0);
    const totalParcels = totalDelivered + totalFailed;
    const successRate = totalParcels > 0 ? ((totalDelivered / totalParcels) * 100).toFixed(1) : "0.0";
    const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;
    return {
      totalDelivered, totalFailed, totalPending, totalParcels,
      totalRevenue, totalCollected, totalOutstanding,
      totalDeliveryFees, totalInboundFees,
      successRate, collectionRate,
    };
  }, [dailySummaries]);

  const activeRiderCount = useMemo(() => riderStats.filter((r) => r.delivered + r.failed > 0).length, [riderStats]);
  const activeStationCount = useMemo(() => stationStats.filter((s) => s.delivered + s.failed > 0).length, [stationStats]);

  const paymentTotals = useMemo(() => {
    const cash = dailySummaries.reduce((s, d) => s + d.cash, 0);
    const momo = dailySummaries.reduce((s, d) => s + d.momo, 0);
    const other = dailySummaries.reduce((s, d) => s + d.other, 0);
    return [
      { category: "Cash", value: cash },
      { category: "MoMo", value: momo },
      { category: "Other", value: other },
    ].filter((p) => p.value > 0);
  }, [dailySummaries]);

  const dayOfWeekRevenue = useMemo(() => {
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const buckets = labels.map((label, i) => {
      const days = dailySummaries.filter((d) => d.dayOfWeek === i);
      const avg = days.length > 0 ? Math.round(days.reduce((s, d) => s + d.revenue, 0) / days.length) : 0;
      return { day: label, revenue: avg };
    });
    // Reorder to Mon..Sun for display
    return [...buckets.slice(1), buckets[0]];
  }, [dailySummaries]);

  const dailySuccessRate = useMemo(
    () =>
      dailySummaries.map((d) => ({
        label: d.label,
        rate: d.delivered + d.failed > 0 ? Math.round((d.delivered / (d.delivered + d.failed)) * 1000) / 10 : 0,
      })),
    [dailySummaries]
  );

  const earningsPeriods = useMemo<EarningsPeriod[]>(() => {
    const bucketMap = new Map<
      string,
      { periodKey: string; periodLabel: string; revenue: number; collected: number; parcels: number; riders: Map<string, { riderId: string; riderName: string; revenue: number; parcels: number }> }
    >();

    dailySummaries.forEach((day) => {
      const { key, label } = periodKeyFor(day.date, earningsPeriod);
      if (!bucketMap.has(key)) {
        bucketMap.set(key, { periodKey: key, periodLabel: label, revenue: 0, collected: 0, parcels: 0, riders: new Map() });
      }
      const bucket = bucketMap.get(key)!;
      bucket.revenue += day.revenue;
      bucket.collected += day.collected;
      bucket.parcels += day.delivered;
    });

    riderDayEntries.forEach((rd) => {
      const { key } = periodKeyFor(rd.date, earningsPeriod);
      const bucket = bucketMap.get(key);
      if (!bucket) return;
      if (!bucket.riders.has(rd.riderId)) {
        bucket.riders.set(rd.riderId, { riderId: rd.riderId, riderName: rd.riderName, revenue: 0, parcels: 0 });
      }
      const r = bucket.riders.get(rd.riderId)!;
      r.revenue += rd.collected;
      r.parcels += rd.delivered;
    });

    return Array.from(bucketMap.values())
      .sort((a, b) => a.periodKey.localeCompare(b.periodKey))
      .map((b) => ({
        periodKey: b.periodKey,
        periodLabel: b.periodLabel,
        revenue: b.revenue,
        collected: b.collected,
        parcels: b.parcels,
        riders: Array.from(b.riders.values()),
      }));
  }, [dailySummaries, riderDayEntries, earningsPeriod]);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const handleExport = (format: "pdf" | "excel") => {
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `Financial_Report_${selectedOfficeName.replace(/\s+/g, "_")}_${timestamp}`;

    if (activeTab === "riders") {
      const columns = [
        { header: "Rank", key: "rank", width: 8 },
        { header: "Rider Name", key: "riderName", width: 20 },
        { header: "Delivered", key: "delivered", width: 12 },
        { header: "Failed", key: "failed", width: 10 },
        { header: "Collected", key: "collected", width: 15 },
        { header: "Outstanding", key: "outstanding", width: 15 },
        { header: "Success Rate", key: "successRate", width: 12 },
        { header: "Active Days", key: "activeDays", width: 12 },
      ];
      const data = riderStats.map((r, i) => ({
        rank: i + 1,
        riderName: r.riderName,
        delivered: r.delivered,
        failed: r.failed,
        collected: formatCurrency(r.collected),
        outstanding: formatCurrency(r.outstanding),
        successRate: `${r.delivered + r.failed > 0 ? ((r.delivered / (r.delivered + r.failed)) * 100).toFixed(1) : "0.0"}%`,
        activeDays: r.activeDays.size,
      }));
      const options = { title: "Rider Performance Report", subtitle: `${selectedOfficeName} — Last ${dateRange} days`, columns, data, filename };
      format === "pdf" ? exportService.exportToPDF(options) : exportService.exportToExcel(options);
    } else if (activeTab === "overview" || activeTab === "operations") {
      const columns = [
        { header: "Station", key: "stationName", width: 20 },
        { header: "Parcels", key: "parcels", width: 12 },
        { header: "Revenue", key: "revenue", width: 15 },
        { header: "Success Rate", key: "successRate", width: 15 },
      ];
      const data = stationStats.map((s) => ({
        stationName: s.stationName,
        parcels: s.delivered + s.failed,
        revenue: formatCurrency(s.revenue),
        successRate: `${s.delivered + s.failed > 0 ? ((s.delivered / (s.delivered + s.failed)) * 100).toFixed(1) : "0.0"}%`,
      }));
      const options = { title: "Financial Overview Report", subtitle: `${selectedOfficeName} — Last ${dateRange} days`, columns, data, filename };
      format === "pdf" ? exportService.exportToPDF(options) : exportService.exportToExcel(options);
    } else {
      const columns = [
        { header: "Date", key: "date", width: 15 },
        { header: "Revenue", key: "revenue", width: 15 },
        { header: "Collected", key: "collected", width: 15 },
        { header: "Outstanding", key: "outstanding", width: 15 },
      ];
      const data = dailySummaries.map((d) => ({
        date: d.date.toLocaleDateString(),
        revenue: formatCurrency(d.revenue),
        collected: formatCurrency(d.collected),
        outstanding: formatCurrency(d.outstanding),
      }));
      const options = { title: "Revenue Analytics Report", subtitle: `${selectedOfficeName} — Last ${dateRange} days`, columns, data, filename };
      format === "pdf" ? exportService.exportToPDF(options) : exportService.exportToExcel(options);
    }
  };

  const kpiCards = [
    { label: "Total Revenue", value: formatCurrency(kpis.totalRevenue), icon: DollarSign, color: "text-[#ea690c]", bg: "bg-orange-50" },
    { label: "Total Parcels", value: kpis.totalParcels.toLocaleString(), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Success Rate", value: `${kpis.successRate}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Active Riders", value: activeRiderCount, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Active Stations", value: activeStationCount, icon: Building2, color: "text-cyan-600", bg: "bg-cyan-50" },
  ];

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "revenue", label: "Revenue Analytics" },
    { key: "operations", label: "Operations" },
    { key: "riders", label: "Rider Performance" },
  ] as const;

  const gradientMap: Record<string, string> = {
    "bg-orange-50": "bg-gradient-to-br from-orange-50 to-orange-100/50",
    "bg-green-50": "bg-gradient-to-br from-green-50 to-green-100/50",
    "bg-red-50": "bg-gradient-to-br from-red-50 to-red-100/50",
    "bg-blue-50": "bg-gradient-to-br from-blue-50 to-blue-100/50",
    "bg-purple-50": "bg-gradient-to-br from-purple-50 to-purple-100/50",
    "bg-indigo-50": "bg-gradient-to-br from-indigo-50 to-indigo-100/50",
    "bg-cyan-50": "bg-gradient-to-br from-cyan-50 to-cyan-100/50",
    "bg-amber-50": "bg-gradient-to-br from-amber-50 to-amber-100/50",
  };

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-800 dark:text-gray-100 tracking-tight">Delivery Statistics</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {selectedOfficeName} — built from live reconciliation records
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} disabled={loading} variant="outline" className="border-gray-300 active:scale-95 transition-transform">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => handleExport("pdf")} className="bg-[#ea690c] hover:bg-[#d45e0a] active:scale-95 transition-transform">
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button onClick={() => handleExport("excel")} variant="outline" className="border-[#ea690c] text-[#ea690c] hover:bg-orange-50 active:scale-95 transition-transform">
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">

        {/* Filters */}
        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Station</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <select
                    value={selectedOfficeId}
                    onChange={(e) => setSelectedOfficeId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                  >
                    <option value="all">All Stations</option>
                    {stationsLoading ? (
                      <option value="">Loading...</option>
                    ) : (
                      stations.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Date Range</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as "7" | "30" | "90")}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                  >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader className="w-10 h-10 text-[#ea690c] animate-spin" />
            <p className="text-neutral-600 font-medium">Loading statistics for {selectedOfficeName}...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {kpiCards.map((card, index) => {
                const Icon = card.icon;
                const gradient = gradientMap[card.bg] || card.bg;
                return (
                  <div key={card.label} style={{ animation: `fadeInUp 0.6s ease-out ${index * 60}ms both` }}>
                    <Card className="group relative overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
                      <CardContent className="p-4">
                        <div className={`w-10 h-10 ${gradient} rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-all duration-300`}>
                          <Icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                        <p className={`text-xl font-bold ${card.color} mb-1 tracking-tight`}>{card.value}</p>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{card.label}</p>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>

            <style>{`
              @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              .animate-fade-in { animation: fadeIn 0.4s ease-out both; }
            `}</style>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.key
                    ? "bg-white text-[#ea690c] border-b-2 border-[#ea690c]"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {dailySummaries.every((d) => d.delivered === 0 && d.failed === 0) ? (
              <Card className="border border-gray-200 bg-white shadow-sm">
                <CardContent className="py-16 flex flex-col items-center gap-3">
                  <Package className="w-12 h-12 text-gray-300" />
                  <p className="text-neutral-600 font-medium">No reconciliation data for the last {dateRange} days</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* ══════════════ OVERVIEW TAB ══════════════ */}
                {activeTab === "overview" && (
                  <div className="space-y-6 animate-fade-in">

                    {/* Financial Summary Strip */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: "Total Revenue", value: formatCurrency(kpis.totalRevenue), icon: DollarSign, color: "text-[#ea690c]", bg: "bg-orange-50", border: "border-orange-200" },
                        { label: "Collected", value: formatCurrency(kpis.totalCollected), icon: Banknote, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
                        { label: "Outstanding", value: formatCurrency(kpis.totalOutstanding), icon: Wallet, color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
                        { label: "Delivery Fees Earned", value: formatCurrency(kpis.totalDeliveryFees), icon: Bike, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
                      ].map((item) => (
                        <Card key={item.label} className={`border ${item.border} bg-white shadow-sm`}>
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                              <item.icon className={`w-5 h-5 ${item.color}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">{item.label}</p>
                              <p className={`text-lg font-bold ${item.color} tracking-tight`}>{item.value}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-base font-bold text-neutral-800">Revenue vs Collected</h3>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#ea690c] inline-block rounded" />Revenue</span>
                              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#10b981] inline-block rounded" />Collected</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Daily trend over selected period</p>
                          <LineChart
                            xAxis={[{
                              data: dailySummaries.map((d) => d.label),
                              scaleType: "point",
                              tickLabelStyle: { fontSize: 11 },
                              tickMinStep: Math.ceil(dailySummaries.length / 7),
                            }]}
                            yAxis={[{ valueFormatter: (v: number) => `GHC ${(v / 1000).toFixed(0)}k` }]}
                            series={[
                              { data: dailySummaries.map((d) => d.revenue), label: "Revenue", color: "#ea690c", curve: "catmullRom", area: true, showMark: false, valueFormatter: (v: number | null) => `GHC ${v?.toLocaleString()}` },
                              { data: dailySummaries.map((d) => d.collected), label: "Collected", color: "#10b981", curve: "catmullRom", area: true, showMark: false, valueFormatter: (v: number | null) => `GHC ${v?.toLocaleString()}` },
                            ]}
                            height={260}
                            margin={{ top: 10, right: 10, bottom: 30, left: 65 }}
                            sx={{ "& .MuiAreaElement-root": { fillOpacity: 0.12 }, "& .MuiLineElement-root": { strokeWidth: 2.5 }, "& .MuiChartsLegend-root": { display: "none" } }}
                          />
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-base font-bold text-neutral-800">Delivered vs Failed</h3>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#3b82f6] inline-block rounded-sm" />Delivered</span>
                              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#ef4444] inline-block rounded-sm" />Failed</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Daily delivery outcomes over selected period</p>
                          <BarChart
                            xAxis={[{
                              data: dailySummaries.map((d) => d.label),
                              scaleType: "band",
                              tickLabelStyle: { fontSize: 11 },
                              tickMinStep: Math.ceil(dailySummaries.length / 7),
                            }]}
                            series={[
                              { data: dailySummaries.map((d) => d.delivered), label: "Delivered", color: "#3b82f6", valueFormatter: (v) => `${v} parcels` },
                              { data: dailySummaries.map((d) => d.failed), label: "Failed", color: "#ef4444", valueFormatter: (v) => `${v} parcels` },
                            ]}
                            height={260}
                            margin={{ top: 10, right: 10, bottom: 30, left: 45 }}
                            sx={{ "& .MuiBarElement-root": { rx: 4, transition: "opacity 0.2s", "&:hover": { opacity: 0.8 } }, "& .MuiChartsLegend-root": { display: "none" } }}
                          />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Delivery Outcome + Station Table Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-base font-bold text-neutral-800 dark:text-gray-100 mb-1">Delivery Outcome Breakdown</h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Delivered, failed, and pending across the selected period</p>
                          <div className="space-y-3">
                            {[
                              { label: "Delivered", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", bar: "bg-green-500", count: kpis.totalDelivered },
                              { label: "Failed / Returned", icon: XCircle, color: "text-red-500", bg: "bg-red-50", bar: "bg-red-400", count: kpis.totalFailed },
                              { label: "Pending", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", bar: "bg-amber-400", count: kpis.totalPending },
                            ].map((stage) => {
                              const total = kpis.totalDelivered + kpis.totalFailed + kpis.totalPending;
                              const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0;
                              return (
                                <div key={stage.label} className="flex items-center gap-3">
                                  <div className={`w-7 h-7 ${stage.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                    <stage.icon className={`w-3.5 h-3.5 ${stage.color}`} />
                                  </div>
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-32 flex-shrink-0">{stage.label}</span>
                                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div className={`${stage.bar} h-2 rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-neutral-700 dark:text-gray-300 w-8 text-right">{stage.count}</span>
                                  <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-base font-bold text-neutral-800 dark:text-gray-100 mb-4">Station Snapshot</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-700">
                                  <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase">Station</th>
                                  <th className="pb-2 text-right text-xs font-semibold text-gray-500 uppercase">Parcels</th>
                                  <th className="pb-2 text-right text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                                  <th className="pb-2 text-right text-xs font-semibold text-gray-500 uppercase">Rate</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {stationStats.map((s, i) => {
                                  const total = s.delivered + s.failed;
                                  const rate = total > 0 ? Math.round((s.delivered / total) * 100) : 0;
                                  return (
                                    <tr key={s.stationId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                      <td className="py-2.5">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-blue-50 text-blue-600"}`}>{i + 1}</div>
                                          <span className="text-sm font-medium text-neutral-800 dark:text-gray-200">{s.stationName}</span>
                                        </div>
                                      </td>
                                      <td className="py-2.5 text-right text-sm text-neutral-700 dark:text-gray-300">{total}</td>
                                      <td className="py-2.5 text-right text-sm font-semibold text-[#ea690c]">{formatCurrency(s.revenue)}</td>
                                      <td className="py-2.5 text-right">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rate >= 90 ? "bg-green-100 text-green-700" : rate >= 80 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>{rate}%</span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Bottom Row: Revenue outcome + Payment Methods + Top Riders */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-base font-bold text-neutral-800 dark:text-gray-100 mb-4">Revenue by Outcome</h3>
                          {kpis.totalRevenue > 0 ? (
                            <>
                              <PieChart
                                series={[{
                                  data: [
                                    { id: 0, value: kpis.totalCollected, label: `Collected (${kpis.collectionRate}%)`, color: "#10b981" },
                                    { id: 1, value: kpis.totalOutstanding, label: `Outstanding (${100 - kpis.collectionRate}%)`, color: "#ef4444" },
                                  ],
                                  innerRadius: 45, outerRadius: 75, paddingAngle: 2, cornerRadius: 4,
                                  highlightScope: { fade: "global", highlight: "item" },
                                  faded: { innerRadius: 35, additionalRadius: -10, color: "gray" },
                                }]}
                                height={200}
                                sx={{ "& .MuiChartsLegend-root": { display: "none" } }}
                              />
                              <div className="space-y-2 mt-2">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /><span className="text-gray-600">Collected</span></div>
                                  <span className="font-bold text-neutral-800">{kpis.collectionRate}%</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /><span className="text-gray-600">Outstanding</span></div>
                                  <span className="font-bold text-neutral-800">{100 - kpis.collectionRate}%</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-gray-400 text-center py-8">No data</p>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-base font-bold text-neutral-800 dark:text-gray-100 mb-4">Payment Methods</h3>
                          {paymentTotals.length > 0 ? (
                            <>
                              <PieChart
                                series={[{
                                  data: paymentTotals.map((item, i) => ({ id: item.category, value: item.value, label: item.category, color: ["#10b981", "#8b5cf6", "#6b7280"][i] })),
                                  innerRadius: 45, outerRadius: 75, paddingAngle: 2, cornerRadius: 4,
                                  highlightScope: { fade: "global", highlight: "item" },
                                  faded: { innerRadius: 35, additionalRadius: -10, color: "gray" },
                                }]}
                                height={200}
                                sx={{ "& .MuiChartsLegend-root": { display: "none" } }}
                              />
                              <div className="space-y-2 mt-2">
                                {paymentTotals.map((item, i) => (
                                  <div key={item.category} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ["#10b981", "#8b5cf6", "#6b7280"][i] }} /><span className="text-gray-600">{item.category}</span></div>
                                    <span className="font-bold text-neutral-800">{formatCurrency(item.value)}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-gray-400 text-center py-8">No data</p>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-base font-bold text-neutral-800 dark:text-gray-100 mb-4">Top Riders</h3>
                          {riderStats.length > 0 ? (
                            <div className="space-y-3">
                              {riderStats.slice(0, 3).map((rider, i) => {
                                const total = rider.delivered + rider.failed;
                                const rate = total > 0 ? ((rider.delivered / total) * 100).toFixed(0) : "0";
                                return (
                                  <div key={rider.riderId} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : "bg-orange-100 text-orange-600"}`}>{i + 1}</div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-neutral-800 truncate">{rider.riderName}</p>
                                      <p className="text-xs text-gray-500">{rider.delivered} deliveries</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="text-sm font-bold text-[#ea690c]">{formatCurrency(rider.collected)}</p>
                                      <p className="text-xs font-semibold text-green-600">{rate}% success</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 text-center py-8">No data</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* ══════════════ REVENUE ANALYTICS TAB ══════════════ */}
                {activeTab === "revenue" && (
                  <div className="space-y-6 animate-fade-in">

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {[
                        { label: "Total Revenue", value: formatCurrency(kpis.totalRevenue), color: "text-[#ea690c]", bg: "bg-orange-50", border: "border-orange-200", icon: DollarSign },
                        { label: "Collected", value: formatCurrency(kpis.totalCollected), color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: Banknote },
                        { label: "Outstanding", value: formatCurrency(kpis.totalOutstanding), color: "text-red-500", bg: "bg-red-50", border: "border-red-200", icon: Wallet },
                        { label: "Collection Rate", value: `${kpis.collectionRate}%`, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: TrendingUp },
                        { label: "Avg per Parcel", value: formatCurrency(kpis.totalParcels > 0 ? Math.round(kpis.totalRevenue / kpis.totalParcels) : 0), color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", icon: Package },
                        { label: "Delivery Fees", value: formatCurrency(kpis.totalDeliveryFees), color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: Bike },
                      ].map((k) => (
                        <Card key={k.label} className={`border ${k.border} bg-white shadow-sm`}>
                          <CardContent className="p-4">
                            <div className={`w-8 h-8 ${k.bg} rounded-lg flex items-center justify-center mb-2`}>
                              <k.icon className={`w-4 h-4 ${k.color}`} />
                            </div>
                            <p className={`text-lg font-bold ${k.color} tracking-tight`}>{k.value}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <h3 className="text-base font-bold text-neutral-800">Revenue vs Collected vs Outstanding</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Daily trend — the gap between revenue and collected is outstanding balance</p>
                          </div>
                          <div className="flex items-center gap-4 text-xs flex-shrink-0">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#ea690c] inline-block rounded" />Revenue</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#10b981] inline-block rounded" />Collected</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#ef4444] inline-block rounded" />Outstanding</span>
                          </div>
                        </div>
                        <LineChart
                          xAxis={[{ data: dailySummaries.map((d) => d.label), scaleType: "point", tickLabelStyle: { fontSize: 11 }, tickMinStep: Math.ceil(dailySummaries.length / 8) }]}
                          yAxis={[{ valueFormatter: (v: number) => `GHC ${(v / 1000).toFixed(0)}k` }]}
                          series={[
                            { data: dailySummaries.map((d) => d.revenue), label: "Revenue", color: "#ea690c", curve: "catmullRom", area: true, showMark: false, valueFormatter: (v: number | null) => `GHC ${v?.toLocaleString()}` },
                            { data: dailySummaries.map((d) => d.collected), label: "Collected", color: "#10b981", curve: "catmullRom", area: true, showMark: false, valueFormatter: (v: number | null) => `GHC ${v?.toLocaleString()}` },
                            { data: dailySummaries.map((d) => d.outstanding), label: "Outstanding", color: "#ef4444", curve: "catmullRom", showMark: false, valueFormatter: (v: number | null) => `GHC ${v?.toLocaleString()}` },
                          ]}
                          height={300}
                          margin={{ top: 10, right: 10, bottom: 30, left: 70 }}
                          sx={{ "& .MuiAreaElement-root": { fillOpacity: 0.1 }, "& .MuiLineElement-root": { strokeWidth: 2.5 }, "& .MuiChartsLegend-root": { display: "none" } }}
                        />
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          {selectedOfficeId === "all" ? (
                            <>
                              <h3 className="text-base font-bold text-neutral-800 dark:text-gray-100 mb-1">Revenue by Station</h3>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Collected vs outstanding per station</p>
                              {stationStats.length > 0 ? (
                                <div className="space-y-4">
                                  {stationStats.map((s, i) => {
                                    const collectedPct = s.revenue > 0 ? Math.round((s.collected / s.revenue) * 100) : 0;
                                    const outstandingPct = 100 - collectedPct;
                                    const maxRevenue = stationStats[0].revenue || 1;
                                    const barWidth = Math.round((s.revenue / maxRevenue) * 100);
                                    return (
                                      <div key={s.stationId}>
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-blue-50 text-blue-600"}`}>{i + 1}</div>
                                            <span className="text-sm font-semibold text-neutral-800">{s.stationName}</span>
                                          </div>
                                          <span className="text-sm font-bold text-[#ea690c]">{formatCurrency(s.revenue)}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                          <div className="h-3 flex rounded-full overflow-hidden" style={{ width: `${barWidth}%` }}>
                                            <div className="bg-green-500 h-3" style={{ width: `${collectedPct}%` }} />
                                            <div className="bg-red-400 h-3" style={{ width: `${outstandingPct}%` }} />
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                          <span className="text-[10px] text-green-600">{collectedPct}% collected</span>
                                          <span className="text-[10px] text-red-500">{outstandingPct}% outstanding</span>
                                          <span className="text-[10px] text-gray-400 ml-auto">{s.delivered + s.failed} parcels</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : <p className="text-sm text-gray-400 text-center py-8">No data</p>}
                              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs">
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-500 rounded-sm inline-block" />Collected</span>
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-400 rounded-sm inline-block" />Outstanding</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <h3 className="text-base font-bold text-neutral-800 dark:text-gray-100 mb-1">{selectedOfficeName} — Station Detail</h3>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Performance breakdown for this station</p>
                              <div className="grid grid-cols-2 gap-3 mb-5">
                                {[
                                  { label: "Total Parcels", value: kpis.totalParcels.toLocaleString(), color: "text-blue-600", bg: "bg-blue-50" },
                                  { label: "Delivered", value: kpis.totalDelivered.toLocaleString(), color: "text-green-600", bg: "bg-green-50" },
                                  { label: "Failed", value: kpis.totalFailed.toLocaleString(), color: "text-red-500", bg: "bg-red-50" },
                                  { label: "Active Riders", value: String(activeRiderCount), color: "text-purple-600", bg: "bg-purple-50" },
                                ].map((item) => (
                                  <div key={item.label} className={`${item.bg} rounded-xl p-3`}>
                                    <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="mb-4">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="font-semibold text-gray-600">Collection Rate</span>
                                  <span className="font-bold text-[#ea690c]">{kpis.collectionRate}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                  <div className="h-3 rounded-full bg-gradient-to-r from-[#ea690c] to-orange-400 transition-all duration-700" style={{ width: `${kpis.collectionRate}%` }} />
                                </div>
                                <div className="flex justify-between text-[10px] mt-1">
                                  <span className="text-green-600">{formatCurrency(kpis.totalCollected)} collected</span>
                                  <span className="text-red-500">{formatCurrency(kpis.totalOutstanding)} outstanding</span>
                                </div>
                              </div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top Riders at this Station</p>
                              <div className="space-y-2">
                                {riderStats.slice(0, 4).map((r, i) => (
                                  <div key={r.riderId} className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-blue-50 text-blue-600"}`}>{i + 1}</div>
                                    <span className="text-sm font-medium text-neutral-800 flex-1 truncate">{r.riderName}</span>
                                    <span className="text-xs text-gray-500">{r.delivered} deliveries</span>
                                    <span className="text-sm font-bold text-[#ea690c]">{formatCurrency(r.collected)}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <h3 className="text-base font-bold text-neutral-800">Payment Method Trend</h3>
                              <p className="text-xs text-gray-400 mt-0.5">Cash vs MoMo vs Other over time</p>
                            </div>
                            <div className="flex flex-col gap-1 text-xs">
                              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block" />Cash</span>
                              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] inline-block" />MoMo</span>
                              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#6b7280] inline-block" />Other</span>
                            </div>
                          </div>
                          <LineChart
                            xAxis={[{ data: dailySummaries.map((d) => d.label), scaleType: "point", tickLabelStyle: { fontSize: 10 }, tickMinStep: Math.ceil(dailySummaries.length / 7) }]}
                            yAxis={[{ valueFormatter: (v: number) => `GHC ${(v / 1000).toFixed(0)}k` }]}
                            series={[
                              { data: dailySummaries.map((d) => d.cash), label: "Cash", color: "#10b981", curve: "catmullRom", area: true, showMark: false, valueFormatter: (v: number | null) => `GHC ${v?.toLocaleString()}` },
                              { data: dailySummaries.map((d) => d.momo), label: "MoMo", color: "#8b5cf6", curve: "catmullRom", area: true, showMark: false, valueFormatter: (v: number | null) => `GHC ${v?.toLocaleString()}` },
                              { data: dailySummaries.map((d) => d.other), label: "Other", color: "#6b7280", curve: "catmullRom", area: true, showMark: false, valueFormatter: (v: number | null) => `GHC ${v?.toLocaleString()}` },
                            ]}
                            height={280}
                            margin={{ top: 10, right: 10, bottom: 30, left: 65 }}
                            sx={{ "& .MuiAreaElement-root": { fillOpacity: 0.1 }, "& .MuiLineElement-root": { strokeWidth: 2 }, "& .MuiChartsLegend-root": { display: "none" } }}
                          />
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-base font-bold text-neutral-800 dark:text-gray-100 mb-1">Revenue by Outcome</h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Collected vs outstanding split</p>
                          {kpis.totalRevenue > 0 ? (
                            <>
                              <PieChart
                                series={[{
                                  data: [
                                    { id: 0, value: kpis.totalCollected, label: "Collected", color: "#10b981" },
                                    { id: 1, value: kpis.totalOutstanding, label: "Outstanding", color: "#ef4444" },
                                  ],
                                  innerRadius: 50, outerRadius: 80, paddingAngle: 3, cornerRadius: 5,
                                  highlightScope: { fade: "global", highlight: "item" },
                                  faded: { innerRadius: 40, additionalRadius: -10, color: "gray" },
                                }]}
                                height={190}
                                sx={{ "& .MuiChartsLegend-root": { display: "none" } }}
                              />
                              <div className="space-y-2.5 mt-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /><span className="text-xs text-gray-600">Collected</span></div>
                                  <div className="text-right"><span className="text-xs font-bold text-neutral-800">{kpis.collectionRate}%</span><span className="text-xs text-gray-400 ml-2">{formatCurrency(kpis.totalCollected)}</span></div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /><span className="text-xs text-gray-600">Outstanding</span></div>
                                  <div className="text-right"><span className="text-xs font-bold text-neutral-800">{100 - kpis.collectionRate}%</span><span className="text-xs text-gray-400 ml-2">{formatCurrency(kpis.totalOutstanding)}</span></div>
                                </div>
                              </div>
                            </>
                          ) : <p className="text-sm text-gray-400 text-center py-8">No data</p>}
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-base font-bold text-neutral-800 dark:text-gray-100 mb-1">Payment Methods</h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Cash vs MoMo vs Other</p>
                          {paymentTotals.length > 0 ? (
                            <>
                              <PieChart
                                series={[{
                                  data: paymentTotals.map((item, i) => ({ id: item.category, value: item.value, label: item.category, color: ["#10b981", "#8b5cf6", "#6b7280"][i] })),
                                  innerRadius: 50, outerRadius: 80, paddingAngle: 3, cornerRadius: 5,
                                  highlightScope: { fade: "global", highlight: "item" },
                                  faded: { innerRadius: 40, additionalRadius: -10, color: "gray" },
                                }]}
                                height={190}
                                sx={{ "& .MuiChartsLegend-root": { display: "none" } }}
                              />
                              <div className="space-y-2.5 mt-1">
                                {paymentTotals.map((item, i) => (
                                  <div key={item.category} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ["#10b981", "#8b5cf6", "#6b7280"][i] }} /><span className="text-xs text-gray-600">{item.category}</span></div>
                                    <span className="text-xs font-bold text-neutral-800">{formatCurrency(item.value)}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : <p className="text-sm text-gray-400 text-center py-8">No data</p>}
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-base font-bold text-neutral-800 dark:text-gray-100 mb-1">Revenue by Day of Week</h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Average daily revenue pattern over the selected period</p>
                          {(() => {
                            const maxRev = Math.max(...dayOfWeekRevenue.map((d) => d.revenue), 1);
                            return (
                              <div className="space-y-2.5">
                                {dayOfWeekRevenue.map((d, i) => (
                                  <div key={d.day} className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-gray-500 w-8">{d.day}</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                      <div
                                        className="h-3 rounded-full transition-all duration-700"
                                        style={{ width: `${(d.revenue / maxRev) * 100}%`, background: d.revenue === maxRev ? "#ea690c" : i >= 5 ? "#d1d5db" : "#fb923c" }}
                                      />
                                    </div>
                                    <span className="text-xs font-bold text-neutral-700 w-20 text-right">{formatCurrency(d.revenue)}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* ══════════════ OPERATIONS TAB ══════════════ */}
                {activeTab === "operations" && (
                  <div className="space-y-6 animate-fade-in">

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: "Total Parcels", value: kpis.totalParcels.toLocaleString(), icon: Package, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
                        { label: "Delivered", value: kpis.totalDelivered.toLocaleString(), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
                        { label: "Failed", value: kpis.totalFailed.toLocaleString(), icon: XCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
                        { label: "Pending", value: kpis.totalPending.toLocaleString(), icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
                      ].map((item) => (
                        <Card key={item.label} className={`border ${item.border} bg-white shadow-sm`}>
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                              <item.icon className={`w-5 h-5 ${item.color}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">{item.label}</p>
                              <p className={`text-lg font-bold ${item.color} tracking-tight`}>{item.value}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-base font-bold text-neutral-800">Delivered vs Failed</h3>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#3b82f6] rounded-sm inline-block" />Delivered</span>
                              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#ef4444] rounded-sm inline-block" />Failed</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Daily outcomes over selected period</p>
                          <BarChart
                            xAxis={[{ data: dailySummaries.map((d) => d.label), scaleType: "band", tickLabelStyle: { fontSize: 10 }, tickMinStep: Math.ceil(dailySummaries.length / 7) }]}
                            series={[
                              { data: dailySummaries.map((d) => d.delivered), label: "Delivered", color: "#3b82f6", stack: "total", valueFormatter: (v: number | null) => `${v} parcels` },
                              { data: dailySummaries.map((d) => d.failed), label: "Failed", color: "#ef4444", stack: "total", valueFormatter: (v: number | null) => `${v} parcels` },
                            ]}
                            height={280}
                            margin={{ top: 10, right: 10, bottom: 30, left: 45 }}
                            sx={{ "& .MuiBarElement-root": { rx: 3 }, "& .MuiChartsLegend-root": { display: "none" } }}
                          />
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-base font-bold text-neutral-800 dark:text-gray-100 mb-1">Delivery Outcome Breakdown</h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Current status distribution across the selected period</p>
                          <div className="space-y-3">
                            {[
                              { label: "Delivered", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", bar: "bg-green-500", count: kpis.totalDelivered },
                              { label: "Failed / Returned", icon: XCircle, color: "text-red-500", bg: "bg-red-50", bar: "bg-red-400", count: kpis.totalFailed },
                              { label: "Pending", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", bar: "bg-amber-400", count: kpis.totalPending },
                            ].map((stage) => {
                              const total = kpis.totalDelivered + kpis.totalFailed + kpis.totalPending;
                              const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0;
                              return (
                                <div key={stage.label} className="flex items-center gap-3">
                                  <div className={`w-7 h-7 ${stage.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                    <stage.icon className={`w-3.5 h-3.5 ${stage.color}`} />
                                  </div>
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-32 flex-shrink-0">{stage.label}</span>
                                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div className={`${stage.bar} h-2 rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-neutral-700 dark:text-gray-300 w-8 text-right">{stage.count}</span>
                                  <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-base font-bold text-neutral-800 dark:text-gray-100 mb-1">Success Rate Trend</h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Daily delivery success rate over selected period</p>
                          <LineChart
                            xAxis={[{ data: dailySuccessRate.map((d) => d.label), scaleType: "point", tickLabelStyle: { fontSize: 10 }, tickMinStep: Math.ceil(dailySuccessRate.length / 7) }]}
                            yAxis={[{ min: 0, max: 100, valueFormatter: (v: number) => `${v}%` }]}
                            series={[{ data: dailySuccessRate.map((d) => d.rate), label: "Success Rate", color: "#10b981", curve: "catmullRom", area: true, showMark: false, valueFormatter: (v: number | null) => `${v}%` }]}
                            height={260}
                            margin={{ top: 10, right: 10, bottom: 30, left: 50 }}
                            sx={{ "& .MuiAreaElement-root": { fillOpacity: 0.12 }, "& .MuiLineElement-root": { strokeWidth: 2.5 }, "& .MuiChartsLegend-root": { display: "none" } }}
                          />
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-base font-bold text-neutral-800 dark:text-gray-100 mb-1">Active Riders per Day</h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Distinct riders who moved a parcel each day</p>
                          <LineChart
                            xAxis={[{ data: dailySummaries.map((d) => d.label), scaleType: "point", tickLabelStyle: { fontSize: 10 }, tickMinStep: Math.ceil(dailySummaries.length / 7) }]}
                            series={[{ data: dailySummaries.map((d) => d.activeRiders.size), label: "Active Riders", color: "#f59e0b", curve: "catmullRom", area: true, showMark: false, valueFormatter: (v: number | null) => `${v} riders` }]}
                            height={260}
                            margin={{ top: 10, right: 10, bottom: 30, left: 50 }}
                            sx={{ "& .MuiAreaElement-root": { fillOpacity: 0.12 }, "& .MuiLineElement-root": { strokeWidth: 2.5 }, "& .MuiChartsLegend-root": { display: "none" } }}
                          />
                        </CardContent>
                      </Card>
                    </div>

                    {selectedOfficeId === "all" && (
                      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-base font-bold text-neutral-800 dark:text-gray-100 mb-1">Station Comparison</h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Parcels handled and success rate per station</p>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <BarChart
                              xAxis={[{ data: stationStats.map((s) => s.stationName.split(" ")[0]), scaleType: "band" }]}
                              series={[{ data: stationStats.map((s) => s.delivered + s.failed), label: "Parcels", color: "#6366f1", valueFormatter: (v: number | null) => `${v} parcels` }]}
                              height={240}
                              margin={{ top: 10, right: 10, bottom: 30, left: 50 }}
                              sx={{ "& .MuiBarElement-root": { rx: 4 }, "& .MuiChartsLegend-root": { display: "none" } }}
                            />
                            <div className="space-y-3 self-center">
                              {stationStats.map((s, i) => {
                                const total = s.delivered + s.failed;
                                const rate = total > 0 ? Math.round((s.delivered / total) * 100) : 0;
                                return (
                                  <div key={s.stationId}>
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-blue-50 text-blue-600"}`}>{i + 1}</div>
                                        <span className="text-sm font-semibold text-neutral-800">{s.stationName}</span>
                                      </div>
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rate >= 90 ? "bg-green-100 text-green-700" : rate >= 80 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>{rate}% rate</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                      <div className="h-2 rounded-full bg-indigo-500 transition-all duration-700" style={{ width: `${rate}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* ══════════════ RIDER PERFORMANCE TAB ══════════════ */}
                {activeTab === "riders" && (
                  <div className="space-y-6 animate-fade-in">

                    <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-base font-bold text-neutral-800">Station Earnings by Period</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Revenue & collections — drill into each period to see per-rider breakdown</p>
                          </div>
                          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                            {(["day", "week", "month", "year"] as const).map((p) => (
                              <button
                                key={p}
                                onClick={() => setEarningsPeriod(p)}
                                className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${earningsPeriod === p ? "bg-white text-[#ea690c] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                              >
                                {p === "day" ? "Daily" : p === "week" ? "Weekly" : p === "month" ? "Monthly" : "Yearly"}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs mb-2">
                          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#ea690c] inline-block rounded" />Revenue</span>
                          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#10b981] inline-block rounded" />Collected</span>
                        </div>
                        <LineChart
                          xAxis={[{ data: earningsPeriods.map((e) => e.periodLabel), scaleType: "point", tickLabelStyle: { fontSize: 10 }, tickMinStep: Math.ceil(earningsPeriods.length / 8) }]}
                          yAxis={[{ valueFormatter: (v: number) => `GHC ${(v / 1000).toFixed(0)}k` }]}
                          series={[
                            { data: earningsPeriods.map((e) => e.revenue), label: "Revenue", color: "#ea690c", curve: "catmullRom", area: true, showMark: false, valueFormatter: (v: number | null) => `GHC ${v?.toLocaleString()}` },
                            { data: earningsPeriods.map((e) => e.collected), label: "Collected", color: "#10b981", curve: "catmullRom", area: true, showMark: false, valueFormatter: (v: number | null) => `GHC ${v?.toLocaleString()}` },
                          ]}
                          height={220}
                          margin={{ top: 10, right: 10, bottom: 30, left: 65 }}
                          sx={{ "& .MuiAreaElement-root": { fillOpacity: 0.1 }, "& .MuiLineElement-root": { strokeWidth: 2.5 }, "& .MuiChartsLegend-root": { display: "none" } }}
                        />

                        <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
                          {earningsPeriods.slice().reverse().map((period) => (
                            <EarningsPeriodRow key={period.periodKey} period={period} />
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base font-bold text-neutral-800">Rider Leaderboard</h3>
                          <p className="text-xs text-gray-400">{riderStats.length} riders active this period</p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead className="bg-gray-50">
                              <tr>
                                {["Rank", "Rider", "Delivered", "Failed", "Collected", "Outstanding", "Success Rate", "Active Days"].map((h) => (
                                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {riderStats.map((rider, index) => {
                                const total = rider.delivered + rider.failed;
                                const rate = total > 0 ? ((rider.delivered / total) * 100).toFixed(1) : "0.0";
                                return (
                                  <tr key={rider.riderId} className="hover:bg-orange-50/40 transition-colors">
                                    <td className="px-4 py-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? "bg-yellow-100 text-yellow-800" : index === 1 ? "bg-gray-100 text-gray-800" : index === 2 ? "bg-orange-100 text-orange-800" : "bg-blue-50 text-blue-600"}`}>{index + 1}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm font-semibold text-neutral-800">{rider.riderName}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-bold text-blue-600">{rider.delivered}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-red-500">{rider.failed}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-[#ea690c]">{formatCurrency(rider.collected)}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-red-600">{formatCurrency(rider.outstanding)}</td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[70px]"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${rate}%` }} /></div>
                                        <span className="text-xs font-medium text-neutral-700">{rate}%</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{rider.activeDays.size}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="text-base font-bold text-neutral-800 dark:text-gray-100 mb-1">Rider Deliveries Comparison</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Top {Math.min(15, riderStats.length)} riders by deliveries</p>
                        <div className="flex items-center gap-4 text-xs mb-2">
                          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#3b82f6] rounded-sm inline-block" />Delivered</span>
                          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#ef4444] rounded-sm inline-block" />Failed</span>
                        </div>
                        <BarChart
                          xAxis={[{ data: riderStats.slice(0, 15).map((r) => r.riderName.split(" ")[0]), scaleType: "band" }]}
                          series={[
                            { data: riderStats.slice(0, 15).map((r) => r.delivered), label: "Delivered", color: "#3b82f6", valueFormatter: (v: number | null) => `${v} parcels` },
                            { data: riderStats.slice(0, 15).map((r) => r.failed), label: "Failed", color: "#ef4444", valueFormatter: (v: number | null) => `${v} parcels` },
                          ]}
                          height={320}
                          margin={{ top: 10, right: 10, bottom: 60, left: 50 }}
                          sx={{ "& .MuiBarElement-root": { rx: 4 }, "& .MuiChartsLegend-root": { display: "none" } }}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
