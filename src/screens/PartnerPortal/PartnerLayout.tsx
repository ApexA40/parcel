import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Send, Package, TrendingUp, History, X, Menu,
  BellIcon, ChevronDownIcon, HelpCircleIcon, Building2,
  ExternalLink, Settings,
} from "lucide-react";
import { Button } from "../../components/ui/button";

interface PartnerLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: "Send Parcels",  path: "/partner",           icon: Send,        description: "Register new parcels" },
  { label: "Track Parcels", path: "/partner/track",     icon: Package,     description: "Monitor parcel status" },
  { label: "Earnings",      path: "/partner/earnings",  icon: TrendingUp,  description: "Revenue & payouts" },
  { label: "History",       path: "/partner/history",   icon: History,     description: "All submitted parcels" },
  { label: "Settings",      path: "/partner/settings",  icon: Settings,    description: "Account & preferences" },
];

const routeTitles: Record<string, { title: string; description: string }> = {
  "/partner":           { title: "Send Parcels",  description: "Register new parcels to M&M stations" },
  "/partner/track":     { title: "Track Parcels", description: "Monitor the status of your submitted parcels" },
  "/partner/earnings":  { title: "Earnings",      description: "View collected amounts and pending payouts" },
  "/partner/history":   { title: "History",       description: "Full history of all your submitted parcels" },
  "/partner/settings":  { title: "Settings",      description: "Manage your account, preferences and security" },
};

export const PartnerLayout = ({ children }: PartnerLayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const routeInfo = routeTitles[location.pathname] ?? routeTitles["/partner"];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowAccountMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200 shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200 bg-white/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo-1.png" alt="M&M" className="h-9 w-9 object-contain rounded-lg shadow ring-2 ring-orange-100" />
            <div>
              <p className="font-bold text-sm bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent leading-tight">
                Mealex &amp; Mailex
              </p>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Partner Portal</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors lg:hidden">
            <X size={20} />
          </button>
        </div>

        {/* Partner badge */}
        <div className="mx-3 mt-3 mb-1 px-3 py-2.5 rounded-xl bg-orange-50 border border-orange-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-800 truncate">Partner Account</p>
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Connected
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Navigation</p>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                    : "text-gray-700 hover:bg-gray-100 hover:translate-x-0.5"
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                  isActive ? "bg-white/20" : "bg-gray-100 group-hover:bg-orange-50"
                }`}>
                  <Icon size={16} className={isActive ? "text-white" : "text-gray-500 group-hover:text-orange-600"} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-tight">{item.label}</p>
                  <p className={`text-[10px] leading-tight mt-0.5 ${isActive ? "text-orange-100" : "text-gray-400"}`}>
                    {item.description}
                  </p>
                </div>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse flex-shrink-0" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 flex-shrink-0 space-y-2 bg-white/50 backdrop-blur-sm">
          <a
            href="/track"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            <ExternalLink size={14} />
            Customer Tracking Portal
          </a>
          <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Need help? Contact M&amp;M support for assistance with your partner account.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Topbar ── */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">

            {/* Left */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
              >
                <Menu size={22} />
              </button>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-neutral-800">{routeInfo.title}</h1>
                <p className="text-xs text-gray-500">{routeInfo.description}</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-base font-bold text-neutral-800">{routeInfo.title}</h1>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1 sm:gap-2">

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg hover:bg-gray-100 transition-colors">
                <BellIcon className="h-5 w-5 text-gray-600" />
                <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">3</span>
              </Button>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

              {/* Account */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowAccountMenu(v => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm flex-shrink-0">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-neutral-800 leading-tight">Partner Account</p>
                    <p className="text-xs text-gray-400 leading-tight">Third-party</p>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 hidden sm:block ${showAccountMenu ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown */}
                {showAccountMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 border-b border-orange-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-neutral-800">Partner Account</p>
                          <p className="text-xs text-gray-500">Third-party logistics</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <a
                        href="/partner/settings"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        <Settings className="w-4 h-4 text-gray-400" />
                        Settings
                      </a>
                      <a
                        href="/track"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                        Customer Tracking
                      </a>
                      <a
                        href="mailto:support@mealexmailex.com"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        <HelpCircleIcon className="w-4 h-4 text-gray-400" />
                        Contact Support
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
