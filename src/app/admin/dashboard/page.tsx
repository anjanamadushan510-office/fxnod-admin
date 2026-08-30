"use client";

import { Cpu, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-navy mb-2">Welcome to the Admin Console</h1>
        <p className="text-gray-500">Select an administrative module to manage the platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* The requested dBot Card */}
        <Link href={"/admin/users" as any} className="group block h-full">
          <div className="h-full bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 relative overflow-hidden">
            
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
            
            <div className="flex items-start justify-between mb-8">
              <div className="w-14 h-14 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                <Cpu className="w-7 h-7" />
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-navy mb-2">dBot Management</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Access the registered users database for dBot. View all FXNOD accounts, roles, and KYC statuses.
            </p>
            
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
              <Users className="w-4 h-4" />
              <span>View All Users</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
