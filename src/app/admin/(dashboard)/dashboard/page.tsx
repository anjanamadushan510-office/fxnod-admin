"use client";

import { Cpu, Users, ArrowRight, Activity, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold text-navy tracking-tight">Dashboard Overview</h1>
        <p className="text-lg text-navy-3">Welcome back. Select a module to manage platform operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* dBot Management Card */}
        <Link href={"/admin/users" as any} className="group block h-full">
          <div className="h-full bg-white rounded-3xl p-8 border border-gold/20 shadow-xl shadow-gold/5 hover:shadow-2xl hover:shadow-gold/20 hover:border-gold/40 transition-all duration-500 relative overflow-hidden flex flex-col">
            
            {/* Background decoration */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-gold/10 to-gold-2/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 -z-10"></div>
            
            <div className="flex items-start justify-between mb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-gold-2 text-navy flex items-center justify-center shadow-lg shadow-gold/30 group-hover:scale-110 transition-transform duration-500">
                <Cpu className="w-8 h-8" />
              </div>
              <div className="w-10 h-10 rounded-full bg-gold/5 flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                <ArrowRight className="w-5 h-5 text-gold-3 group-hover:text-gold transition-colors" />
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-navy mb-3">dBot Management</h2>
              <p className="text-navy-3 leading-relaxed">
                Access the registered users database for dBot. Review user access requests, payment receipts, and manage permissions.
              </p>
            </div>
            
            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-gold group-hover:gap-3 transition-all">
              <Users className="w-5 h-5" />
              <span>Manage Users</span>
              <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
            </div>
          </div>
        </Link>
        
        {/* Wallet Management Card */}
        <Link href={"/admin/deposits" as any} className="group block h-full">
          <div className="h-full bg-white rounded-3xl p-8 border border-gold/20 shadow-xl shadow-gold/5 hover:shadow-2xl hover:shadow-gold/20 hover:border-gold/40 transition-all duration-500 relative overflow-hidden flex flex-col">
            
            {/* Background decoration */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-gold/10 to-gold-2/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 -z-10"></div>
            
            <div className="flex items-start justify-between mb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-gold-2 text-navy flex items-center justify-center shadow-lg shadow-gold/30 group-hover:scale-110 transition-transform duration-500">
                <Activity className="w-8 h-8" />
              </div>
              <div className="w-10 h-10 rounded-full bg-gold/5 flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                <ArrowRight className="w-5 h-5 text-gold-3 group-hover:text-gold transition-colors" />
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-navy mb-3">Wallet Management</h2>
              <p className="text-navy-3 leading-relaxed">
                Approve or reject manual crypto deposits from users. Monitor wallet transactions and system balances.
              </p>
            </div>
            
            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-gold group-hover:gap-3 transition-all">
              <Activity className="w-5 h-5" />
              <span>Manage Deposits</span>
              <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
            </div>
          </div>
        </Link>
        
        {/* Placeholder for future module 2 */}
        <div className="h-full bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl p-8 border border-gray-100/50 shadow-inner relative overflow-hidden flex flex-col opacity-70">
          <div className="flex items-start justify-between mb-10">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 text-slate-400 flex items-center justify-center">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-400 mb-3">Analytics</h2>
            <p className="text-slate-400 leading-relaxed">
              View trading volume, user acquisition metrics, and platform revenue reports.
            </p>
          </div>
          <div className="mt-8 inline-flex items-center px-4 py-2 rounded-full bg-slate-200/50 text-slate-500 text-xs font-bold uppercase tracking-wider w-fit">
            Coming Soon
          </div>
        </div>

      </div>
    </div>
  );
}
