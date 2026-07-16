import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight, BarChart3, Bike, Building2, CheckCircle2, ClipboardList,
    Headphones, LayoutDashboard, MapPin, Menu, Package, PackageSearch,
    Palette, PhoneCall, Quote, Search, ShieldCheck, Store, Truck,
    TrendingUp, Users, Wallet, X, Zap,
} from "lucide-react";

const ORANGE = "#ea690c";
const BLUE = "#1e40af";

/* ── Shared bits ─────────────────────────────────────────────── */

const DotGrid = ({ className = "" }: { className?: string }) => (
    <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${className}`}
        style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
        }}
    />
);

const Blob = ({ className = "", color }: { className?: string; color: string }) => (
    <div
        aria-hidden
        className={`pointer-events-none absolute rounded-full opacity-25 blur-3xl ${className}`}
        style={{ background: `radial-gradient(circle at center, ${color}, transparent 70%)` }}
    />
);

const SectionLabel = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
    <span
        className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] ${
            dark ? "border-white/15 bg-white/5 text-orange-300" : "border-orange-200 bg-orange-50 text-[#ea690c]"
        }`}
    >
        <span className="h-1.5 w-1.5 rounded-full bg-[#ea690c]" />
        {children}
    </span>
);

const Logo = ({ light = false }: { light?: boolean }) => (
    <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ea690c] to-[#c2470a] shadow-lg shadow-orange-900/30">
            <Package className="h-5 w-5 text-white" />
        </div>
        <span className={`text-lg font-bold tracking-tight ${light ? "text-white" : "text-neutral-900"}`}>
            ParcelFlow
        </span>
    </div>
);

/* ── Hero dashboard mockup (pure CSS, tilted 3D) ─────────────── */

const DashboardMockup = ({ transform }: { transform?: string }) => (
    <div className="relative mx-auto w-full max-w-3xl" style={{ perspective: "1600px" }}>
        <div
            className="animate-float rounded-2xl border border-white/10 bg-[#11131f]/90 shadow-[0_40px_120px_-20px_rgba(234,105,12,0.35)] backdrop-blur"
            style={{ transform: transform ?? "rotateX(14deg) rotateZ(-2deg)" }}
        >
            {/* window chrome */}
            <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                <div className="ml-4 h-5 flex-1 max-w-xs rounded-md bg-white/5" />
            </div>
            <div className="flex">
                {/* sidebar */}
                <div className="hidden w-40 flex-shrink-0 flex-col gap-1 border-r border-white/5 p-3 sm:flex">
                    <div className="mb-2 flex items-center gap-2 px-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#ea690c]">
                            <Package className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="h-2.5 w-16 rounded bg-white/20" />
                    </div>
                    {[1, 0, 0, 0, 0].map((active, i) => (
                        <div
                            key={i}
                            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${active ? "bg-[#ea690c]/20" : ""}`}
                        >
                            <div className={`h-3.5 w-3.5 rounded ${active ? "bg-[#ea690c]" : "bg-white/15"}`} />
                            <div className={`h-2 rounded ${active ? "w-16 bg-[#ea690c]/80" : "w-14 bg-white/15"}`} />
                        </div>
                    ))}
                </div>
                {/* main */}
                <div className="flex-1 p-4">
                    <div className="mb-4 grid grid-cols-3 gap-3">
                        {[
                            { label: "In transit", value: "128", color: ORANGE },
                            { label: "Delivered", value: "1,204", color: "#22c55e" },
                            { label: "Collected", value: "GH₵ 18.4k", color: BLUE },
                        ].map((s, i) => (
                            <div key={i} className="rounded-xl border border-white/5 bg-white/[0.04] p-3">
                                <p className="text-[9px] uppercase tracking-wider text-white/40">{s.label}</p>
                                <p className="mt-1 text-base font-bold text-white sm:text-lg">{s.value}</p>
                                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                                    <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: s.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                        {/* table */}
                        <div className="col-span-3 rounded-xl border border-white/5 bg-white/[0.04] p-3">
                            <div className="mb-2 h-2.5 w-24 rounded bg-white/20" />
                            {[70, 55, 80, 45, 62].map((w, i) => (
                                <div key={i} className="flex items-center gap-2 border-t border-white/5 py-2">
                                    <div className="h-4 w-4 rounded-full bg-gradient-to-br from-[#ea690c]/60 to-[#1e40af]/60" />
                                    <div className="h-2 rounded bg-white/15" style={{ width: `${w}%` }} />
                                    <div className="ml-auto h-3.5 w-10 rounded-full bg-[#ea690c]/30" />
                                </div>
                            ))}
                        </div>
                        {/* map-ish block */}
                        <div className="relative col-span-2 overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-[#1e40af]/30 to-[#11131f]">
                            <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 200 160">
                                <path d="M20 130 Q60 60 110 90 T190 30" fill="none" stroke={ORANGE} strokeWidth="2.5" strokeDasharray="6 5" />
                                <circle cx="20" cy="130" r="5" fill={ORANGE} />
                                <circle cx="190" cy="30" r="5" fill="#fff" />
                            </svg>
                            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur">
                                <MapPin className="h-3 w-3 text-[#ea690c]" />
                                <span className="text-[9px] font-medium text-white/80">Rider en route · 4 min</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

/* ── Hero-only pieces ────────────────────────────────────────── */

const HERO_WORDS = ["register parcels", "dispatch riders", "track deliveries", "reconcile cash", "grow branches"];

const TICKER_EVENTS: { icon: React.ComponentType<{ className?: string }>; text: string }[] = [
    { icon: CheckCircle2, text: "PF-88213 delivered · Kumasi → Accra" },
    { icon: Bike, text: "Rider dispatched · Adum Station" },
    { icon: Wallet, text: "GH₵ 2,140 reconciled · 0 discrepancies" },
    { icon: Package, text: "New parcel registered · East Legon" },
    { icon: MapPin, text: "Out for delivery · Tema Branch" },
    { icon: Building2, text: "Branch transfer complete · Takoradi" },
];

const TrackingCard = () => (
    <div className="w-60 rounded-2xl border border-white/10 bg-[#11131f]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur">
        <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Tracking</p>
            <span className="rounded-full bg-[#ea690c]/15 px-2 py-0.5 text-[10px] font-bold text-[#ea690c]">#PF-88213</span>
        </div>
        <div className="mt-3 space-y-0">
            {[
                { label: "Registered · Kumasi", state: "done" },
                { label: "In transit · Accra hub", state: "done" },
                { label: "Out for delivery", state: "active" },
                { label: "Delivered", state: "todo" },
            ].map(({ label, state }, i, arr) => (
                <div key={label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <span
                            className={
                                state === "done" ? "h-2.5 w-2.5 rounded-full bg-[#ea690c]"
                                : state === "active" ? "relative h-2.5 w-2.5 rounded-full bg-[#ea690c]"
                                : "h-2.5 w-2.5 rounded-full border border-white/25"
                            }
                        >
                            {state === "active" && (
                                <span className="absolute -inset-1 animate-ping rounded-full bg-[#ea690c]/50" />
                            )}
                        </span>
                        {i < arr.length - 1 && (
                            <span className={`w-px flex-1 ${state === "done" ? "bg-[#ea690c]/60" : "bg-white/10"}`} style={{ minHeight: 14 }} />
                        )}
                    </div>
                    <p className={`pb-3 text-xs ${state === "todo" ? "text-white/30" : state === "active" ? "font-semibold text-white" : "text-white/60"}`}>
                        {label}
                    </p>
                </div>
            ))}
        </div>
    </div>
);

const ActivityCard = () => (
    <div className="w-64 rounded-2xl border border-white/10 bg-[#11131f]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur">
        <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
                <span className="absolute h-full w-full animate-ping rounded-full bg-green-400/60" />
                <span className="h-2 w-2 rounded-full bg-green-400" />
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Live across your branches</p>
        </div>
        <div className="mt-3 space-y-2.5">
            {[
                { icon: Bike, text: "Kwame collected 12 parcels", sub: "Adum Station · just now" },
                { icon: Wallet, text: "GH₵ 2,140 reconciled", sub: "End of day · 2 min ago" },
                { icon: Package, text: "Pickup request received", sub: "East Legon · 5 min ago" },
            ].map(({ icon: Icon, text, sub }) => (
                <div key={text} className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
                        <Icon className="h-3.5 w-3.5 text-[#ea690c]" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white/90">{text}</p>
                        <p className="text-[10px] text-white/35">{sub}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

/* ── Page ────────────────────────────────────────────────────── */

export const Landing = (): JSX.Element => {
    const [menuOpen, setMenuOpen] = useState(false);
    const navLinks = [
        { label: "Product", href: "#workspaces" },
        { label: "Features", href: "#features" },
        { label: "How it works", href: "#how-it-works" },
        { label: "Pricing", href: "#pricing" },
    ];

    return (
        <div className="min-h-screen scroll-smooth bg-[#0b0d17] font-sans text-white antialiased">

            {/* ══ NAV ══ */}
            <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#0b0d17]/80 backdrop-blur-md">
                <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Logo light />
                    <div className="hidden items-center gap-8 md:flex">
                        {navLinks.map(l => (
                            <a key={l.href} href={l.href} className="text-sm font-medium text-white/60 transition-colors hover:text-white">
                                {l.label}
                            </a>
                        ))}
                    </div>
                    <div className="hidden items-center gap-3 md:flex">
                        <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:text-white">
                            Log in
                        </Link>
                        <Link
                            to="/signup"
                            className="rounded-lg bg-[#ea690c] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-900/40 transition-all hover:bg-[#ff7a1a] hover:shadow-orange-800/50"
                        >
                            Start Free Trial
                        </Link>
                    </div>
                    <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
                        {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </nav>
                {menuOpen && (
                    <div className="border-t border-white/5 bg-[#0b0d17] px-4 pb-4 pt-2 md:hidden">
                        {navLinks.map(l => (
                            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block py-2.5 text-sm font-medium text-white/70">
                                {l.label}
                            </a>
                        ))}
                        <div className="mt-3 flex gap-3">
                            <Link to="/login" className="flex-1 rounded-lg border border-white/15 px-4 py-2.5 text-center text-sm font-semibold text-white">
                                Log in
                            </Link>
                            <Link to="/signup" className="flex-1 rounded-lg bg-[#ea690c] px-4 py-2.5 text-center text-sm font-semibold text-white">
                                Start Free
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* ══ 1. HERO ══ */}
            <section className="relative overflow-hidden pt-16">
                <style>{`
                    @keyframes pf-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                    @keyframes pf-dash { to { stroke-dashoffset: -200; } }
                `}</style>
                <DotGrid />
                <Blob color={ORANGE} className="-top-40 left-1/3 h-[500px] w-[500px]" />
                <Blob color={BLUE} className="-right-20 top-64 h-[450px] w-[450px]" />

                {/* ghost brand word */}
                <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-6 left-0 select-none whitespace-nowrap text-[16vw] font-extrabold leading-none tracking-tighter opacity-[0.04]"
                    style={{ WebkitTextStroke: "2px #fff", color: "transparent" }}
                >
                    PARCELFLOW
                </span>

                {/* animated route line across the hero */}
                <svg aria-hidden className="pointer-events-none absolute inset-x-0 top-24 h-[520px] w-full opacity-25" viewBox="0 0 1440 520" fill="none" preserveAspectRatio="none">
                    <path
                        d="M-40 420 C 240 300, 420 480, 720 330 S 1200 140, 1500 220"
                        stroke={ORANGE} strokeWidth="2" strokeDasharray="10 12"
                        style={{ animation: "pf-dash 6s linear infinite" }}
                    />
                    <path
                        d="M-40 200 C 300 320, 560 120, 880 220 S 1300 380, 1500 300"
                        stroke={BLUE} strokeWidth="2" strokeDasharray="4 14"
                        style={{ animation: "pf-dash 9s linear infinite" }}
                    />
                    <circle cx="720" cy="330" r="6" fill={ORANGE} />
                    <circle cx="880" cy="220" r="6" fill={BLUE} />
                </svg>

                <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-2 lg:gap-8 lg:px-8">
                    {/* ── Left: editorial type ── */}
                    <div className="animate-slide-up text-center lg:text-left">
                        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-[11px] font-medium text-white/60">
                            <Zap className="h-3 w-3 text-[#ea690c]" />
                            Built for delivery businesses
                        </span>
                        <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.2rem]">
                            Every parcel.{" "}
                            <span className="text-white/30">Every branch.</span>
                            <br />
                            <span className="bg-gradient-to-r from-[#ea690c] to-[#ff8c3a] bg-clip-text text-transparent">
                                One platform.
                            </span>
                        </h1>
                        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/50 sm:text-base lg:mx-0">
                            From intake to doorstep — one workspace for your front desk, dispatch, call center, and riders.
                        </p>
                        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                            <Link
                                to="/signup"
                                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#ea690c] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-900/40 transition-all hover:bg-[#ff7a1a] sm:w-auto"
                            >
                                Start Free Trial
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <a
                                href="#how-it-works"
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 sm:w-auto"
                            >
                                See How It Works
                            </a>
                        </div>
                        <div className="mt-8 flex items-center justify-center gap-6 lg:justify-start">
                            {[
                                { value: "12k+", label: "parcels daily" },
                                { value: "98.4%", label: "on-time rate" },
                                { value: "40+", label: "branches" },
                            ].map(({ value, label }, i) => (
                                <div key={label} className={`${i > 0 ? "border-l border-white/10 pl-6" : ""}`}>
                                    <p className="text-lg font-extrabold text-white">{value}</p>
                                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/35">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Right: layered product composition ── */}
                    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
                        <DashboardMockup transform="rotateY(-10deg) rotateX(6deg) rotateZ(1deg)" />
                        <div className="absolute -top-8 -right-2 hidden animate-float sm:block lg:-right-4" style={{ animationDelay: "1.4s" }}>
                            <TrackingCard />
                        </div>
                        <div className="absolute -bottom-10 -left-2 hidden animate-float sm:block lg:-left-6" style={{ animationDelay: "2.6s" }}>
                            <ActivityCard />
                        </div>
                    </div>
                </div>

                {/* ── Live events ticker ── */}
                <div className="relative border-t border-white/5 bg-white/[0.02] py-3.5">
                    <div className="overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
                        <div className="flex w-max items-center gap-10" style={{ animation: "pf-marquee 32s linear infinite" }}>
                            {[...TICKER_EVENTS, ...TICKER_EVENTS].map(({ icon: Icon, text }, i) => (
                                <div key={i} className="flex items-center gap-2.5 whitespace-nowrap">
                                    <Icon className="h-3.5 w-3.5 text-[#ea690c]" />
                                    <span className="text-xs font-medium text-white/50">{text}</span>
                                    <span className="ml-6 h-1 w-1 rounded-full bg-white/15" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ 2. SOCIAL PROOF ══ */}
            <section className="border-y border-white/5 bg-white/[0.02]">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-white/40">
                        Trusted by logistics companies managing thousands of parcels daily
                    </p>
                    <div className="mt-7 flex flex-wrap items-center justify-center gap-x-12 gap-y-5 opacity-50">
                        {[
                            { icon: Truck, name: "SwiftHaul" },
                            { icon: Package, name: "BoxLine" },
                            { icon: MapPin, name: "RouteWave" },
                            { icon: Store, name: "MetroShip" },
                            { icon: Building2, name: "CityCourier" },
                        ].map(({ icon: Icon, name }) => (
                            <div key={name} className="flex items-center gap-2 text-white/70">
                                <Icon className="h-5 w-5" />
                                <span className="text-sm font-bold tracking-wide">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ 3. PROBLEM ══ */}
            <section className="bg-[#f7f7f5] py-20 text-neutral-900 sm:py-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <SectionLabel>The problem</SectionLabel>
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
                            Running a delivery business is chaos.{" "}
                            <span className="text-[#ea690c]">It doesn't have to be.</span>
                        </h2>
                    </div>
                    <div className="mt-14 grid gap-6 md:grid-cols-3">
                        {[
                            {
                                icon: ClipboardList,
                                title: "Spreadsheets and WhatsApp groups",
                                text: "Tracking parcels across branches with no single source of truth.",
                            },
                            {
                                icon: Bike,
                                title: "No visibility on riders",
                                text: "You don't know who has what, where they are, or what they've collected.",
                            },
                            {
                                icon: Wallet,
                                title: "Reconciliation nightmares",
                                text: "End-of-day cash collection is manual, error-prone, and slow.",
                            },
                        ].map(({ icon: Icon, title, text }) => (
                            <div key={title} className="rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-md">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
                                    <Icon className="h-6 w-6 text-[#ea690c]" />
                                </div>
                                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{text}</p>
                            </div>
                        ))}
                    </div>
                    <p className="mt-14 text-center text-xl font-bold sm:text-2xl">
                        ParcelFlow fixes <span className="underline decoration-[#ea690c] decoration-4 underline-offset-4">all of this</span>.
                    </p>
                </div>
            </section>

            {/* ══ 4. TWO WORKSPACES ══ */}
            <section id="workspaces" className="bg-white py-20 text-neutral-900 sm:py-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <SectionLabel>The product</SectionLabel>
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
                            Two Focused Workspaces. One Powerful Platform.
                        </h2>
                        <p className="mt-4 text-base text-neutral-500 sm:text-lg">
                            ParcelFlow separates your operations into two purpose-built hubs so every team
                            member only sees what they need.
                        </p>
                    </div>
                    <div className="mt-14 grid gap-6 lg:grid-cols-2">
                        {/* Parcel Hub — blue */}
                        <div className="group relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50/80 to-white p-8 transition-shadow hover:shadow-xl hover:shadow-blue-100 sm:p-10">
                            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#1e40af]/10 blur-2xl" />
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1e40af] shadow-lg shadow-blue-200">
                                <PackageSearch className="h-7 w-7 text-white" />
                            </div>
                            <h3 className="mt-6 text-2xl font-extrabold tracking-tight">Parcel Hub</h3>
                            <p className="mt-3 text-sm leading-relaxed text-neutral-500 sm:text-base">
                                Built for your front desk and station staff. Register incoming parcels, manage
                                shelves, handle transfers between branches, track inbound drivers, and process
                                pickup requests — all from one clean interface.
                            </p>
                            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                                {[
                                    "Parcel intake & registration",
                                    "Shelf & address management",
                                    "Branch-to-branch transfers",
                                    "Inbound driver tracking",
                                    "Incoming & outgoing logs",
                                    "Pickup request management",
                                ].map(f => (
                                    <li key={f} className="flex items-start gap-2 text-sm text-neutral-700">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1e40af]" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {/* Delivery Hub — orange */}
                        <div className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-b from-orange-50/80 to-white p-8 transition-shadow hover:shadow-xl hover:shadow-orange-100 sm:p-10">
                            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#ea690c]/10 blur-2xl" />
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ea690c] shadow-lg shadow-orange-200">
                                <Truck className="h-7 w-7 text-white" />
                            </div>
                            <h3 className="mt-6 text-2xl font-extrabold tracking-tight">Delivery Hub</h3>
                            <p className="mt-3 text-sm leading-relaxed text-neutral-500 sm:text-base">
                                Built for your operations managers and call center team. Assign parcels to
                                riders, monitor active deliveries, manage call center queues, and close the day
                                with automated reconciliation and financial analytics.
                            </p>
                            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                                {[
                                    "Rider assignment & dispatch",
                                    "Live delivery monitoring",
                                    "Pre & post-delivery call center",
                                    "Home delivery watchlist",
                                    "Daily reconciliation & cash",
                                    "Analytics & rider leaderboard",
                                ].map(f => (
                                    <li key={f} className="flex items-start gap-2 text-sm text-neutral-700">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ea690c]" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ 5. FEATURES BENTO ══ */}
            <section id="features" className="relative overflow-hidden py-20 sm:py-28">
                <DotGrid />
                <Blob color={BLUE} className="-left-40 top-20 h-[400px] w-[400px]" />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <SectionLabel dark>Features</SectionLabel>
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
                            Everything your operation needs.{" "}
                            <span className="text-white/40">Nothing it doesn't.</span>
                        </h2>
                    </div>
                    <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                icon: MapPin, span: "lg:col-span-2",
                                title: "Real-Time Delivery Tracking",
                                text: "Monitor every active delivery as it happens. Know which rider has which parcel at any moment.",
                            },
                            {
                                icon: Search, span: "",
                                title: "Smart Parcel Search",
                                text: "Find any parcel instantly by name, phone, tracking ID, or address. Across all branches.",
                            },
                            {
                                icon: BarChart3, span: "",
                                title: "Reconciliation & Analytics",
                                text: "Automated end-of-day reconciliation with visual breakdowns by rider, zone, and payment method.",
                            },
                            {
                                icon: Building2, span: "",
                                title: "Multi-Branch Management",
                                text: "One account. Multiple branches. Each operates independently with its own staff and settings.",
                            },
                            {
                                icon: ShieldCheck, span: "",
                                title: "Role-Based Access",
                                text: "Front desk, managers, call center agents, and riders each get a tailored workspace.",
                            },
                            {
                                icon: Bike, span: "",
                                title: "Rider Mobile App",
                                text: "Riders get a lightweight app to view assignments, mark deliveries, and log returns.",
                            },
                            {
                                icon: Store, span: "",
                                title: "Vendor & Partner Portal",
                                text: "Give partners a self-service portal to send parcels, track shipments, and view earnings.",
                            },
                            {
                                icon: Palette, span: "lg:col-span-2",
                                title: "Custom Branding Per Branch",
                                text: "Each branch can carry its own logo and identity, all inheriting from your company's master brand.",
                            },
                        ].map(({ icon: Icon, span, title, text }) => (
                            <div
                                key={title}
                                className={`group rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-colors hover:border-[#ea690c]/40 hover:bg-white/[0.07] ${span}`}
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors group-hover:border-[#ea690c]/40">
                                    <Icon className="h-5 w-5 text-[#ea690c]" />
                                </div>
                                <h3 className="mt-4 text-base font-bold">{title}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-white/50">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ 6. HOW IT WORKS ══ */}
            <section id="how-it-works" className="bg-white py-20 text-neutral-900 sm:py-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <SectionLabel>How it works</SectionLabel>
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Up and running in minutes.</h2>
                    </div>
                    <div className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
                        <div aria-hidden className="absolute left-[16.6%] right-[16.6%] top-7 hidden h-0.5 bg-gradient-to-r from-[#ea690c] via-orange-200 to-[#ea690c] md:block" />
                        {[
                            {
                                step: "1", icon: Building2,
                                title: "Create your company account",
                                text: "Register your business, set up your branches, and invite your team. Takes less than 5 minutes.",
                            },
                            {
                                step: "2", icon: Users,
                                title: "Assign roles to your team",
                                text: "Front desk staff, managers, call center agents, and riders each get the right workspace automatically.",
                            },
                            {
                                step: "3", icon: Package,
                                title: "Start managing parcels",
                                text: "Register your first parcel, assign a rider, and track it to the door. Your operation is live.",
                            },
                        ].map(({ step, icon: Icon, title, text }) => (
                            <div key={step} className="relative text-center">
                                <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ea690c] shadow-lg shadow-orange-200">
                                    <Icon className="h-6 w-6 text-white" />
                                    <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#1e40af] text-[11px] font-bold text-white">
                                        {step}
                                    </span>
                                </div>
                                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-neutral-500">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ 7. ROLE SPOTLIGHT ══ */}
            <section className="bg-[#f7f7f5] py-20 text-neutral-900 sm:py-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <SectionLabel>Who it's for</SectionLabel>
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
                            Built for every person in your operation.
                        </h2>
                    </div>
                    <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                        {[
                            { icon: Store, role: "Front Desk Staff", text: "Register parcels, manage shelves, handle transfers and pickups. Your station runs smoothly." },
                            { icon: LayoutDashboard, role: "Operations Manager", text: "Full visibility across parcel and delivery operations. Switch between hubs with one click." },
                            { icon: Headphones, role: "Call Center Agents", text: "Pre-delivery queues, post-delivery follow-ups, and home delivery watchlists in one screen." },
                            { icon: Bike, role: "Riders", text: "A clean mobile dashboard showing today's assignments, delivery status, and history." },
                            { icon: PhoneCall, role: "Partners / Vendors", text: "A self-service portal to send parcels, track them, and view transaction history." },
                        ].map(({ icon: Icon, role, text }) => (
                            <div key={role} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ea690c] to-[#1e40af] p-[1.5px]">
                                    <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white">
                                        <Icon className="h-5 w-5 text-[#ea690c]" />
                                    </div>
                                </div>
                                <h3 className="mt-4 text-sm font-bold">{role}</h3>
                                <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ 8. MULTI-TENANT ══ */}
            <section className="relative overflow-hidden py-20 sm:py-28">
                <DotGrid />
                <Blob color={ORANGE} className="-right-40 top-0 h-[400px] w-[400px]" />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <SectionLabel dark>Built to scale</SectionLabel>
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">One platform. Infinite businesses.</h2>
                        <p className="mt-4 text-base text-white/50 sm:text-lg">
                            ParcelFlow is built for scale. Whether you run one branch or fifty, the platform
                            grows with you.
                        </p>
                    </div>
                    <div className="mt-14 grid gap-5 md:grid-cols-3">
                        {[
                            { icon: Building2, title: "Multi-tenant architecture", text: "Every company gets its own isolated environment. Your data is always yours." },
                            { icon: Palette, title: "White-label branding", text: "Your logo, your colors, your identity — applied across every branch." },
                            { icon: TrendingUp, title: "Scales with your growth", text: "Add branches, add staff, add riders. No migrations, no downtime." },
                        ].map(({ icon: Icon, title, text }) => (
                            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 text-center backdrop-blur">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ea690c] to-[#1e40af]">
                                    <Icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-white/50">{text}</p>
                            </div>
                        ))}
                    </div>

                    {/* ══ 9. TESTIMONIAL ══ */}
                    <div className="relative mx-auto mt-20 max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur sm:p-14">
                        <svg className="absolute inset-0 h-full w-full opacity-10" viewBox="0 0 400 200" preserveAspectRatio="none">
                            <path d="M0 160 Q100 80 200 120 T400 40" fill="none" stroke={ORANGE} strokeWidth="1.5" strokeDasharray="5 6" />
                            <path d="M0 60 Q150 140 280 80 T400 140" fill="none" stroke={BLUE} strokeWidth="1.5" strokeDasharray="5 6" />
                        </svg>
                        <Quote className="mx-auto h-10 w-10 text-[#ea690c]" />
                        <blockquote className="relative mt-6 text-xl font-semibold leading-relaxed text-white/90 sm:text-2xl">
                            "ParcelFlow transformed how we manage our 8 branches. What used to take 3 people
                            and a spreadsheet now runs automatically."
                        </blockquote>
                        <p className="relative mt-6 text-sm font-medium text-white/40">
                            — Operations Director, Regional Logistics Company
                        </p>
                    </div>
                </div>
            </section>

            {/* ══ 10. PRICING ══ */}
            <section id="pricing" className="bg-white py-20 text-neutral-900 sm:py-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <SectionLabel>Pricing</SectionLabel>
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Simple pricing. No surprises.</h2>
                        <p className="mt-4 text-base text-neutral-500 sm:text-lg">
                            Plans for every size of operation. Start free, scale as you grow.
                        </p>
                    </div>
                    <div className="mt-14 grid gap-6 lg:grid-cols-3">
                        {[
                            {
                                name: "Starter", highlight: false,
                                blurb: "Perfect for small courier operations.",
                                features: ["1 branch", "Up to 5 users", "Parcel & Delivery Hubs", "Rider mobile app", "Community support"],
                            },
                            {
                                name: "Growth", highlight: true,
                                blurb: "For expanding logistics businesses.",
                                features: ["Up to 5 branches", "Unlimited users", "Everything in Starter", "Reconciliation & analytics", "Partner portal", "Priority support"],
                            },
                            {
                                name: "Enterprise", highlight: false,
                                blurb: "For large-scale operations.",
                                features: ["Unlimited branches", "Custom branding", "Everything in Growth", "Dedicated support", "Custom onboarding"],
                            },
                        ].map(({ name, highlight, blurb, features }) => (
                            <div
                                key={name}
                                className={`relative rounded-3xl border p-8 transition-shadow hover:shadow-lg ${
                                    highlight
                                        ? "border-[#ea690c] bg-gradient-to-b from-orange-50/70 to-white shadow-xl shadow-orange-100"
                                        : "border-neutral-200 bg-white"
                                }`}
                            >
                                {highlight && (
                                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#ea690c] px-4 py-1 text-xs font-bold text-white shadow-md">
                                        Most popular
                                    </span>
                                )}
                                <h3 className="text-xl font-extrabold">{name}</h3>
                                <p className="mt-1.5 text-sm text-neutral-500">{blurb}</p>
                                <ul className="mt-6 space-y-2.5">
                                    {features.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-sm text-neutral-700">
                                            <CheckCircle2 className={`mt-0.5 h-4 w-4 flex-shrink-0 ${highlight ? "text-[#ea690c]" : "text-[#1e40af]"}`} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    to="/signup"
                                    className={`mt-8 block rounded-xl px-5 py-3 text-center text-sm font-semibold transition-colors ${
                                        highlight
                                            ? "bg-[#ea690c] text-white hover:bg-[#ff7a1a]"
                                            : "border border-neutral-300 text-neutral-800 hover:bg-neutral-50"
                                    }`}
                                >
                                    Get started
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ 11. FINAL CTA ══ */}
            <section className="relative overflow-hidden py-24 sm:py-32">
                <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-[#ea690c]/20 via-transparent to-[#1e40af]/20" />
                <DotGrid />
                <Blob color={ORANGE} className="left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2" />
                <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
                    <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-6xl">
                        Your parcels deserve better than a spreadsheet.
                    </h2>
                    <p className="mx-auto mt-5 max-w-xl text-base text-white/60 sm:text-lg">
                        Join logistics companies already running smarter operations with ParcelFlow.
                    </p>
                    <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                            to="/signup"
                            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#ea690c] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-orange-900/50 transition-all hover:bg-[#ff7a1a] sm:w-auto"
                        >
                            Get Started Free
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            to="/login"
                            className="flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white/90 backdrop-blur transition-colors hover:bg-white/10 sm:w-auto"
                        >
                            Book a Demo
                        </Link>
                    </div>
                    <p className="mt-5 text-xs text-white/40">No credit card required. Set up in under 5 minutes.</p>
                </div>
            </section>

            {/* ══ 12. FOOTER ══ */}
            <footer className="border-t border-white/5 bg-[#080a12]">
                <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                    <div className="grid gap-10 lg:grid-cols-5">
                        <div className="lg:col-span-2">
                            <Logo light />
                            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/40">
                                Every parcel. Every branch. One platform. From intake to doorstep — manage your
                                entire delivery operation in one place.
                            </p>
                        </div>
                        {[
                            { heading: "Product", links: ["Parcel Hub", "Delivery Hub", "Rider App", "Partner Portal"] },
                            { heading: "Company", links: ["About", "Careers", "Contact", "Blog"] },
                            { heading: "Resources", links: ["Help Center", "Track a Parcel", "API Docs", "Status"] },
                        ].map(({ heading, links }) => (
                            <div key={heading}>
                                <h4 className="text-sm font-bold text-white/80">{heading}</h4>
                                <ul className="mt-4 space-y-2.5">
                                    {links.map(l => (
                                        <li key={l}>
                                            <a href="#" className="text-sm text-white/40 transition-colors hover:text-white/80">{l}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-7 sm:flex-row">
                        <p className="text-xs text-white/30">© 2026 Synergetics Hub. All rights reserved.</p>
                        <div className="flex items-center gap-5 text-xs text-white/30">
                            <a href="#" className="transition-colors hover:text-white/70">Terms</a>
                            <a href="#" className="transition-colors hover:text-white/70">Privacy</a>
                            <Link to="/track" className="transition-colors hover:text-white/70">Track a parcel</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
