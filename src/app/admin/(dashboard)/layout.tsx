import { ShieldAlert, LayoutDashboard, Cpu } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-navy text-[#e9e3cb] flex flex-col shadow-2xl hidden md:flex sticky top-0 h-screen overflow-y-auto border-r border-gold/10">
        <div className="h-20 flex items-center px-8 border-b border-gold/20 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-3 flex items-center justify-center mr-3 shadow-lg shadow-gold/20">
            <ShieldAlert className="w-5 h-5 text-navy" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-gold">FXNOD<span className="font-light text-gold-3 ml-1">Admin</span></span>
        </div>
        
        <nav className="flex-1 py-8 px-5 space-y-2">
          <div className="px-3 mb-2 text-xs font-semibold text-gold/50 uppercase tracking-wider">
            Menu
          </div>
          <Link
            href={"/admin/dashboard" as any}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gold/10 transition-all duration-300 text-gold-soft hover:text-gold group"
          >
            <div className="w-8 h-8 rounded-lg bg-gold/5 flex items-center justify-center group-hover:bg-gold/20 group-hover:text-gold transition-colors">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link
            href={"/admin/subscriptions" as any}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gold/10 transition-all duration-300 text-gold-soft hover:text-gold group"
          >
            <div className="w-8 h-8 rounded-lg bg-gold/5 flex items-center justify-center group-hover:bg-gold/20 group-hover:text-gold transition-colors">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="font-medium">dBot subscriptions</span>
          </Link>
          {/* User Management link removed as requested */}
        </nav>
        
        <div className="p-6 border-t border-gold/10 text-xs font-medium text-gold/50 text-center shrink-0">
          &copy; {new Date().getFullYear()} FXNod.
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gold/20 flex items-center justify-between px-8 sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-4 md:hidden">
            <ShieldAlert className="w-8 h-8 text-gold" />
            <span className="font-bold text-navy text-xl">FXNOD Admin</span>
          </div>
          
          {/* Left side empty for desktop alignment */}
          <div className="hidden md:block"></div>
          
          <div className="flex items-center gap-5">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-navy">Administrator</span>
              <span className="text-xs font-medium text-navy-3">admin@fxnod.com</span>
            </div>
            <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-gold to-gold-2 flex items-center justify-center text-navy font-bold shadow-md shadow-gold/20 ring-4 ring-gold/10 shrink-0">
              A
            </div>
            <div className="w-px h-8 bg-gray-200 mx-1"></div>
            <LogoutButton />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
