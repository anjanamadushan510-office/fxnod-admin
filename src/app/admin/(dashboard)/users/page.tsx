"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, XCircle, Filter } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { adminApi } from "@/services/adminApi";
import type { UserPublic } from "@/services/authApi";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
      setError("Failed to load users. Please ensure you have admin privileges.");
      toast.error("Error loading users");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (isoString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(isoString));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/30 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-gold/5 to-gold-2/5 rounded-full blur-3xl -z-10"></div>
        
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">User Management</h1>
          <p className="text-slate-500">Manage dBot access and review uploaded payment receipts.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl bg-slate-50/50 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold focus:bg-white transition-all shadow-inner"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="h-11 w-11 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-gold transition-colors shadow-sm">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-medium border border-red-100 shadow-sm flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500" />
          {error}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/30 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 tracking-wider">USER</th>
                <th className="px-8 py-5 tracking-wider">JOINED</th>
                <th className="px-8 py-5 tracking-wider text-right">ACCESS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-medium">Loading user database...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-lg font-medium text-slate-700">No users found</p>
                      <p className="text-sm mt-1">{searchQuery ? `No matches for "${searchQuery}"` : "The database is empty."}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/10 to-gold-2/10 text-gold-3 flex items-center justify-center font-bold mr-4 border border-gold/20 shadow-sm group-hover:scale-110 transition-transform">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{user.full_name || "Unknown"}</div>
                          <div className="text-slate-500 text-xs font-medium mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-500 font-medium">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-8 py-5 text-right">
                      {/* dBot access is decided by the subscription, and is shown
                          on the subscriptions screen. */}
                      <Link
                        href={"/admin/subscriptions" as any}
                        className="text-xs font-semibold text-slate-400 hover:text-gold"
                      >
                        Subscriptions →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
