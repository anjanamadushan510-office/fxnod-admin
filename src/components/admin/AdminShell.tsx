"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  Cpu,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Newspaper,
  ShieldAlert,
  UserX,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { useAuthStore } from "@/stores/authStore";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// One list for the desktop rail and the phone drawer, so a page cannot be
// reachable on one and missing on the other.
const NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/deposits", label: "Deposits", icon: Wallet },
  { href: "/admin/subscriptions", label: "dBot subscriptions", icon: Cpu },
  { href: "/admin/payouts", label: "Deriv payouts", icon: Banknote },
  { href: "/admin/tickets", label: "Ticket Management", icon: LifeBuoy },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/users/closed", label: "Closed Accounts", icon: UserX },
];

/** The longest matching href wins, so /admin/users/closed does not also light up Users. */
function activeHref(pathname: string): string | null {
  let best: string | null = null;
  for (const item of NAV) {
    if (pathname === item.href || pathname.startsWith(item.href + "/")) {
      if (!best || item.href.length > best.length) best = item.href;
    }
  }
  return best;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  const active = activeHref(pathname);

  return (
    <nav className="flex-1 overflow-y-auto overscroll-contain py-6 px-5 space-y-2">
      <div className="px-3 mb-2 text-xs font-semibold text-gold/50 uppercase tracking-wider">
        Menu
      </div>
      {NAV.map(({ href, label, icon: Icon }) => {
        const on = href === active;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={on ? "page" : undefined}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
              on ? "bg-gold/10 text-gold" : "text-gold-soft hover:bg-gold/10 hover:text-gold"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                on ? "bg-gold/20 text-gold" : "bg-gold/5 group-hover:bg-gold/20 group-hover:text-gold"
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span className="font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <>
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-3 flex items-center justify-center mr-3 shadow-lg shadow-gold/20">
        <ShieldAlert className="w-5 h-5 text-navy" />
      </div>
      <span className="text-2xl font-bold tracking-tight text-gold">
        FXNOD<span className="font-light text-gold-3 ml-1">Admin</span>
      </span>
    </>
  );
}

/**
 * Console chrome: a fixed rail on desktop, a drawer behind a menu button
 * below md. The rail used to be `hidden md:flex` with nothing in its place,
 * so on a phone the console had no navigation at all.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  // A navigation closes the drawer, including browser back/forward.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const email = user?.email ?? "";
  const initial = (email[0] ?? "A").toUpperCase();

  return (
    <div className="flex min-h-[100dvh] bg-slate-50">
      {/* Desktop rail */}
      <aside className="w-64 bg-navy text-[#e9e3cb] flex-col shadow-2xl hidden md:flex sticky top-0 h-[100dvh] border-r border-gold/10">
        <div className="h-20 flex items-center px-8 border-b border-gold/20 shrink-0">
          <Brand />
        </div>
        <NavLinks />
        <div className="p-6 border-t border-gold/10 text-xs font-medium text-gold/50 text-center shrink-0">
          &copy; {new Date().getFullYear()} FXNod.
        </div>
      </aside>

      {/* Phone drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        id="admin-drawer"
        aria-label="Navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,86vw)] flex-col bg-navy text-[#e9e3cb] transition-transform duration-300 ease-in-out pt-safe pb-safe md:hidden ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between pl-5 pr-2 border-b border-gold/20 shrink-0">
          <div className="flex items-center">
            <Brand />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid h-11 w-11 place-items-center text-gold-soft hover:text-gold"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <NavLinks onNavigate={() => setOpen(false)} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-[100dvh] min-w-0">
        <header className="box-content h-16 md:h-20 bg-white/80 backdrop-blur-xl border-b border-gold/20 flex items-center justify-between gap-3 px-4 md:px-8 pt-safe sticky top-0 z-40 shrink-0">
          <div className="flex min-w-0 items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-controls="admin-drawer"
              aria-expanded={open}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-gold/30 text-navy"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="truncate font-bold text-navy text-lg">FXNOD Admin</span>
          </div>

          {/* Left side empty for desktop alignment */}
          <div className="hidden md:block"></div>

          <div className="flex shrink-0 items-center gap-3 md:gap-5">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-navy">Administrator</span>
              {/* The signed-in admin, not a placeholder: an operator must be
                  able to see whose session an action will be audited under. */}
              <span className="text-xs font-medium text-navy-3">{email}</span>
            </div>
            <div className="hidden h-11 w-11 rounded-full bg-gradient-to-tr from-gold to-gold-2 sm:flex items-center justify-center text-navy font-bold shadow-md shadow-gold/20 ring-4 ring-gold/10 shrink-0">
              {initial}
            </div>
            <div className="hidden sm:block w-px h-8 bg-gray-200 mx-1"></div>
            <LogoutButton />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
