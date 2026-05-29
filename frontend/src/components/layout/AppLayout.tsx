import { NavLink, Outlet } from "react-router-dom";
import { BadgeCheck, Grid2X2, Images, Layers3, LogOut, Palette, SlidersHorizontal } from "lucide-react";

import { useAuth } from "../../auth/AuthProvider";

const links = [
  { to: "/", label: "Dashboard", icon: Grid2X2 },
  { to: "/templates", label: "Moldes", icon: Layers3 },
  { to: "/color-presets", label: "Cores", icon: Palette },
  { to: "/process", label: "Processar", icon: Images },
  { to: "/batch", label: "Lote", icon: BadgeCheck },
  { to: "/review", label: "Revisao", icon: SlidersHorizontal },
];

export function AppLayout() {
  const { signOut, user } = useAuth();

  return (
    <div className="app-gradient min-h-screen overflow-x-hidden text-ink">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-1 bg-gradient-to-r from-violet-950 via-purple-600 to-fuchsia-500" />
      <header className="sticky top-0 z-30 px-3 pt-4 sm:px-5">
        <div className="mx-auto flex min-h-[78px] w-full max-w-[1500px] items-center gap-4 rounded-[28px] border border-white/80 bg-white/90 px-3 shadow-[0_22px_70px_rgba(60,20,120,0.14)] backdrop-blur-2xl sm:px-4 lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-[20px] bg-violet-950 text-lg font-black text-white shadow-[0_18px_42px_rgba(78,25,150,0.36)]">
              <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.24),transparent_42%),linear-gradient(315deg,#d946ef,#7c3aed_50%,#2e1065)]" />
              <span className="relative">F</span>
            </div>
            <div className="min-w-0">
              <div className="text-lg font-black leading-tight text-violet-950 sm:text-xl">FlowImage</div>
              <div className="text-[11px] font-black uppercase text-fuchsia-600">studio</div>
            </div>
          </div>

          <nav className="ml-auto flex min-w-0 flex-1 justify-end gap-1.5 overflow-x-auto rounded-[22px] border border-violet-100/70 bg-violet-50/60 p-1.5 shadow-inner shadow-violet-100/80">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex min-h-10 shrink-0 items-center gap-2 rounded-2xl border px-3 text-sm font-black transition ${
                    isActive
                      ? "border-violet-200 bg-violet-950 text-white shadow-[0_14px_28px_rgba(91,33,182,0.28)]"
                      : "border-transparent bg-white/60 text-violet-950 hover:-translate-y-0.5 hover:border-white hover:bg-white"
                  }`
                }
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-violet-100 bg-white/70 p-1.5 shadow-inner shadow-violet-100/70">
            <span className="hidden max-w-44 truncate px-2 text-xs font-black text-violet-950 lg:block">{user?.email}</span>
            <button
              className="grid h-10 w-10 place-items-center rounded-xl text-violet-950 transition hover:bg-violet-950 hover:text-white"
              type="button"
              title="Sair"
              aria-label="Sair"
              onClick={() => void signOut()}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
