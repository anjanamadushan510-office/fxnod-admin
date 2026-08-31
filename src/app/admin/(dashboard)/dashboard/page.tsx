"use client";

import { Cpu, Users, ArrowRight, Activity, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-lg text-slate-500">Welcome back. Select a module to manage platform operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* dBot Management Card */}
        <Link href={"/admin/users" as any} className="group block h-full">
          <div className="h-full bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-500 relative overflow-hidden flex flex-col">
            
            {/* Background decoration */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 -z-10"></div>
            
            <div className="flex items-start justify-between mb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform duration-500">
                <Cpu className="w-8 h-8" />
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">dBot Management</h2>
              <p className="text-slate-500 leading-relaxed">
                Access the registered users database for dBot. Review user access requests, payment receipts, and manage permissions.
              </p>
            </div>
            
            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-indigo-600 group-hover:gap-3 transition-all">
              <Users className="w-5 h-5" />
              <span>Manage Users</span>
              <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
            </div>
          </div>
        </Link>
        
        {/* Placeholder for future module 1 */}
        <div className="h-full bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl p-8 border border-gray-100/50 shadow-inner relative overflow-hidden flex flex-col opacity-70">
          <div className="flex items-start justify-between mb-10">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 text-slate-400 flex items-center justify-center">
              <Activity className="w-8 h-8" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-400 mb-3">System Health</h2>
            <p className="text-slate-400 leading-relaxed">
              Monitor core infrastructure, microservices uptime, and api response times.
            </p>
          </div>
          <div className="mt-8 inline-flex items-center px-4 py-2 rounded-full bg-slate-200/50 text-slate-500 text-xs font-bold uppercase tracking-wider w-fit">
            Coming Soon
          </div>
        </div>
        
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
