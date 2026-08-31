"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, CheckCircle, XCircle, Eye, X, Filter } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { adminApi } from "@/services/adminApi";
import type { UserPublic } from "@/services/authApi";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

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

  const handleUpdateAccess = async (userId: string, newStatus: string) => {
    try {
      setIsUpdating(userId);
      await adminApi.updateUserAccess(userId, { dbot_access_status: newStatus });
      toast.success(`User access updated to ${newStatus}`);
      // Refresh list
      await loadUsers();
    } catch (err) {
      console.error("Failed to update access", err);
      toast.error("Failed to update user access");
    } finally {
      setIsUpdating(null);
    }
  };

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
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -z-10"></div>
        
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
              className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl bg-slate-50/50 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="h-11 w-11 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm">
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
                <th className="px-8 py-5 tracking-wider">dBOT STATUS</th>
                <th className="px-8 py-5 tracking-wider">JOINED</th>
                <th className="px-8 py-5 tracking-wider text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-medium">Loading user database...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-500">
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-bold mr-4 border border-indigo-200/50 shadow-sm group-hover:scale-110 transition-transform">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{user.full_name || "Unknown"}</div>
                          <div className="text-slate-500 text-xs font-medium mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize shadow-sm ${
                        user.dbot_access_status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 
                        user.dbot_access_status === 'pending_verification' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' : 
                        user.dbot_access_status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200/60' :
                        'bg-slate-100 text-slate-600 border border-slate-200/60'
                      }`}>
                        {user.dbot_access_status === 'active' && <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                        {user.dbot_access_status === 'pending_verification' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2 animate-pulse" />}
                        {user.dbot_access_status ? user.dbot_access_status.replace('_', ' ') : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-slate-500 font-medium">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                        {user.dbot_receipt_url ? (
                          <button
                            onClick={() => setSelectedReceipt(user.dbot_receipt_url)}
                            className="inline-flex items-center px-3 py-2 bg-white border border-gray-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                            title="View Receipt"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Receipt
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic mr-2 bg-slate-50 px-3 py-2 rounded-xl border border-transparent">No Receipt</span>
                        )}
                        
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-gray-100">
                          <button
                            onClick={() => handleUpdateAccess(user.id, "active")}
                            disabled={isUpdating === user.id || user.dbot_access_status === "active"}
                            className={`inline-flex items-center p-2 rounded-lg transition-all ${
                              user.dbot_access_status === "active" 
                                ? "bg-white text-emerald-500 shadow-sm cursor-default" 
                                : "text-slate-400 hover:bg-white hover:text-emerald-600 hover:shadow-sm"
                            }`}
                            title="Approve Access"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleUpdateAccess(user.id, "rejected")}
                            disabled={isUpdating === user.id || user.dbot_access_status === "rejected"}
                            className={`inline-flex items-center p-2 rounded-lg transition-all ${
                              user.dbot_access_status === "rejected" 
                                ? "bg-white text-rose-500 shadow-sm cursor-default" 
                                : "text-slate-400 hover:bg-white hover:text-rose-600 hover:shadow-sm"
                            }`}
                            title="Reject Access"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white/50 backdrop-blur-md z-10">
              <h3 className="text-xl font-bold text-slate-900">Payment Receipt</h3>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-auto flex-1 flex justify-center bg-slate-50/50">
              {/* Using a regular img tag because receipt URLs might be from anywhere and next/image needs remotePatterns */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedReceipt} 
                alt="Payment Receipt" 
                className="max-w-full max-h-[60vh] object-contain rounded-2xl border border-gray-200/60 shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f8fafc/94a3b8?text=Image+Not+Found';
                }}
              />
            </div>
            <div className="p-6 border-t border-gray-100 bg-white flex justify-end">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold transition-colors shadow-md shadow-slate-900/10"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
