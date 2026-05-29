import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AlertCircle, Bell, Box, Home, Layers, LogOut, Menu, Palette, Play, Search } from "lucide-react";

import { useAuth } from "../../auth/AuthProvider";

const links = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/templates", label: "Moldes", icon: Layers },
  { to: "/color-presets", label: "Cores", icon: Palette },
  { to: "/process", label: "Processar", icon: Play },
  { to: "/batch", label: "Lote", icon: Box },
  { to: "/review", label: "Revisao", icon: AlertCircle },
];

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/templates": "Moldes",
  "/color-presets": "Cores",
  "/process": "Processar",
  "/batch": "Lote",
  "/review": "Revisao",
};

export function AppLayout() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const title = pageTitles[location.pathname] ?? (location.pathname.startsWith("/templates") ? "Moldes" : "FlowImage");
  const initials = (user?.email?.slice(0, 2) || "FI").toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-gray-900">
      <aside className={`hidden shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 lg:flex ${collapsed ? "w-20" : "w-64"}`}>
        <div className="flex h-20 shrink-0 items-center border-b border-gray-100 px-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-violet-700 text-xl font-bold text-white">F</div>
          {!collapsed ? (
            <div className="ml-3 min-w-0">
              <div className="truncate text-xl font-bold leading-none text-gray-900">FlowImage</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-violet-600">Studio</div>
            </div>
          ) : null}
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                `my-1 flex items-center rounded-lg px-4 py-3 transition-colors duration-200 ${
                  isActive ? "bg-violet-100 text-violet-800" : "text-gray-600 hover:bg-gray-100 hover:text-violet-700"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-6 w-6 ${isActive ? "text-violet-700" : "text-gray-500"}`} />
                  {!collapsed ? <span className="ml-4 font-medium">{label}</span> : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-gray-100 p-4">
          <button className="flex w-full items-center rounded-lg px-2 py-2 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600" type="button" onClick={() => void signOut()}>
            <LogOut className="h-6 w-6" />
            {!collapsed ? <span className="ml-4 font-medium">Sair</span> : null}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-violet-700" type="button" onClick={() => setCollapsed((current) => !current)}>
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden w-72 max-w-[38vw] md:block xl:w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm placeholder-gray-400 transition focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  placeholder="Buscar moldes, jobs..."
                  type="text"
                />
              </div>
            </div>
            <div className="lg:hidden">
              <div className="text-base font-bold leading-none">FlowImage</div>
              <div className="text-xs font-semibold uppercase text-violet-600">Studio</div>
            </div>
          </div>

          <nav className="mx-2 flex min-w-0 flex-1 gap-1 overflow-x-auto lg:hidden">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                className={({ isActive }) =>
                  `grid h-10 w-10 shrink-0 place-items-center rounded-lg ${isActive ? "bg-violet-100 text-violet-700" : "text-gray-500 hover:bg-gray-100"}`
                }
              >
                <Icon className="h-5 w-5" />
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-4 sm:gap-6">
            <button className="relative text-gray-400 transition-colors hover:text-violet-600" type="button" title="Alertas">
              <Bell className="h-6 w-6" />
              <span className="absolute right-0 top-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <div className="hidden items-center gap-3 border-l border-gray-200 pl-6 sm:flex">
              <div className="text-right">
                <div className="max-w-48 truncate text-sm font-bold text-gray-900">{user?.email ?? "Usuario"}</div>
                <div className="text-xs text-gray-500">FlowImage Studio</div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-violet-300 bg-violet-200 text-sm font-bold text-violet-700">
                {initials}
              </div>
            </div>
            <button className="grid h-10 w-10 place-items-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600 sm:hidden" type="button" onClick={() => void signOut()} title="Sair">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="text-2xl font-extrabold text-gray-900">{title}</h1>
              <p className="mt-1 text-gray-600">Visao geral das suas atividades e ativos.</p>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
