import { ShieldAlert, LayoutDashboard, Users } from "lucide-react";
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
      <aside className="w-72 bg-[#0a0f1c] text-white flex flex-col shadow-2xl hidden md:flex sticky top-0 h-screen overflow-y-auto">
        <div className="h-20 flex items-center px-8 border-b border-white/5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">FXNOD<span className="font-light text-slate-400">Admin</span></span>
        </div>
        
        <nav className="flex-1 py-8 px-5 space-y-2">
          <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Menu
          </div>
          <Link 
            href={"/admin/dashboard" as any}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-white/5 transition-all duration-300 text-slate-300 hover:text-white group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link 
            href={"/admin/users" as any}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-white/5 transition-all duration-300 text-slate-300 hover:text-white group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <span className="font-medium">User Management</span>
          </Link>
        </nav>
        
        <div className="p-6 border-t border-white/5 text-xs font-medium text-slate-500 text-center shrink-0">
          &copy; {new Date().getFullYear()} FXNod.
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center justify-between px-8 sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-4 md:hidden">
            <ShieldAlert className="w-8 h-8 text-indigo-600" />
            <span className="font-bold text-slate-800 text-xl">FXNOD Admin</span>
          </div>
          
          {/* Left side empty for desktop alignment */}
          <div className="hidden md:block"></div>
          
          <div className="flex items-center gap-5">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-slate-800">Administrator</span>
              <span className="text-xs font-medium text-slate-500">admin@fxnod.com</span>
            </div>
            <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200 ring-4 ring-indigo-50 shrink-0">
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
