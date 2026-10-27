import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Home, Upload, Camera, Recycle, BarChart3, History, Info, Leaf, Menu, X } from "lucide-react";
import { api, type Health } from "../lib/api";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/upload", label: "Upload & Classify", icon: Upload },
  { to: "/webcam", label: "Webcam Capture", icon: Camera },
  { to: "/categories", label: "Waste Categories", icon: Recycle },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/history", label: "History", icon: History },
  { to: "/about", label: "About Project", icon: Info },
];

export type Status =
  | { state: "checking" }
  | { state: "offline" }
  | { state: "online"; health: Health };

export function useStatus(): Status {
  const [s, setS] = useState<Status>({ state: "checking" });
  useEffect(() => {
    let alive = true;
    const check = () =>
      api
        .health()
        .then((health) => alive && setS({ state: "online", health }))
        .catch(() => alive && setS({ state: "offline" }));
    check();
    const t = setInterval(check, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  return s;
}

export function StatusDot({ s }: { s: Status }) {
  const ok = s.state === "online" && s.health.model_loaded;
  const color = ok ? "bg-emerald-400" : s.state === "checking" ? "bg-slate-400" : "bg-red-400";
  const text =
    s.state === "checking"
      ? "Checking backend..."
      : s.state === "offline"
      ? "Backend offline"
      : s.health.model_loaded
      ? "Real AI model connected"
      : "Model unavailable";
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span>{text}</span>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const status = useStatus();

  const sidebar = (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#0b1f33] to-[#0b3b3f] p-5 text-white">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500">
          <Leaf size={22} />
        </div>
        <div className="leading-tight">
          <div className="font-bold">Smart Waste AI</div>
          <div className="text-xs italic text-teal-200">Segregation System</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-emerald-500/90 font-semibold text-white"
                  : "text-slate-300 hover:bg-white/10"
              }`
            }
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-1 text-[11px] uppercase tracking-wide text-teal-200">Prediction source</div>
        <StatusDot s={status} />
        {status.state === "online" && !status.health.model_loaded && (
          <p className="mt-2 text-xs text-amber-200">{status.health.message}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">{sidebar}</aside>
        </div>
      )}
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
        <button onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
        <span className="font-semibold">Smart Waste AI</span>
        <span className="w-6" />
      </header>
      <main className="p-4 sm:p-8 lg:ml-64">
        <div className="mb-6 hidden justify-end lg:flex">
          <div className="rounded-full border bg-white px-4 py-1.5 shadow-sm">
            <StatusDot s={status} />
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}