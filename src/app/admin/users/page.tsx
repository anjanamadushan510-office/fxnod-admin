"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, CheckCircle, XCircle, Eye, X } from "lucide-react";
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <Link 
        href={"/admin/dashboard" as any} 
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-navy transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Link>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy mb-1">User Management</h1>
          <p className="text-gray-500 text-sm">Manage dBot access and review uploaded payment receipts.</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            placeholder="Search users by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">USER</th>
                <th className="px-6 py-4">dBOT STATUS</th>
                <th className="px-6 py-4">JOINED</th>
                <th className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p>Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No users found {searchQuery ? `matching "${searchQuery}"` : ""}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 flex items-center justify-center font-bold mr-3 border border-indigo-100">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{user.full_name || "Unknown"}</div>
                          <div className="text-gray-500 text-xs">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        user.dbot_access_status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' : 
                        user.dbot_access_status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
                        user.dbot_access_status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {user.dbot_access_status ? user.dbot_access_status.replace('_', ' ') : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.dbot_receipt_url ? (
                          <button
                            onClick={() => setSelectedReceipt(user.dbot_receipt_url)}
                            className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                            title="View Receipt"
                          >
                            <Eye className="w-4 h-4 mr-1.5" />
                            Receipt
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic mr-2">No Receipt</span>
                        )}
                        
                        <button
                          onClick={() => handleUpdateAccess(user.id, "active")}
                          disabled={isUpdating === user.id || user.dbot_access_status === "active"}
                          className={`inline-flex items-center p-1.5 rounded-md transition-colors ${
                            user.dbot_access_status === "active" 
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                              : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                          }`}
                          title="Approve Access"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => handleUpdateAccess(user.id, "rejected")}
                          disabled={isUpdating === user.id || user.dbot_access_status === "rejected"}
                          className={`inline-flex items-center p-1.5 rounded-md transition-colors ${
                            user.dbot_access_status === "rejected" 
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                              : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          }`}
                          title="Reject Access"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-navy">Payment Receipt</h3>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex justify-center bg-gray-50">
              {/* Using a regular img tag because receipt URLs might be from anywhere and next/image needs remotePatterns */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedReceipt} 
                alt="Payment Receipt" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg border border-gray-200 shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Image+Not+Found';
                }}
              />
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
