"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/services/adminApi";
import { Check, X, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getManualDeposits();
      setDeposits(data);
    } catch (err: any) {
      setError(err.message || "Failed to load deposits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleApprove = async (id: string) => {
    if (!window.confirm("Are you sure you want to approve this deposit and credit the user's wallet?")) return;
    
    try {
      setProcessingId(id);
      await adminApi.approveManualDeposit(id);
      alert("Deposit approved successfully!");
      fetchDeposits();
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const note = window.prompt("Reason for rejection (optional):");
    if (note === null) return; // User cancelled
    
    try {
      setProcessingId(id);
      await adminApi.rejectManualDeposit(id, note);
      alert("Deposit rejected.");
      fetchDeposits();
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-navy flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 bg-white rounded-xl shadow-sm">{error}</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      <div className="flex items-center gap-4 mb-2">
        <Link href="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-navy-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-navy">Wallet Management</h1>
          <p className="text-navy-3 mt-1">Review and manage manual TRC-20 deposit requests.</p>
        </div>
        <button 
          onClick={fetchDeposits} 
          className="ml-auto text-sm bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all text-navy font-medium"
        >
          Refresh Data
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gold/5 border border-gold/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-5">Date</th>
                <th className="p-5">User ID</th>
                <th className="p-5">Amount</th>
                <th className="p-5">TxHash</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-medium text-lg">
                    No manual deposits pending.
                  </td>
                </tr>
              ) : (
                deposits.map((dep) => (
                  <tr key={dep.id} className="border-b border-gray-50 last:border-none hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 text-navy-2">
                      {new Date(dep.created_at).toLocaleString()}
                    </td>
                    <td className="p-5 text-navy font-mono text-xs font-semibold">
                      {dep.user_id}
                    </td>
                    <td className="p-5 font-extrabold text-green-600 text-base">
                      ${Number(dep.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 8 })} {dep.currency}
                    </td>
                    <td className="p-5">
                      <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-mono break-all max-w-[200px] text-slate-600 border border-slate-200">
                        {dep.tx_hash}
                      </div>
                    </td>
                    <td className="p-5">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide ${
                          dep.status.toUpperCase() === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : dep.status.toUpperCase() === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {dep.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-5 flex justify-end gap-2">
                      {dep.status.toUpperCase() === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApprove(dep.id)}
                            disabled={processingId === dep.id}
                            className="flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white px-4 py-2 rounded-xl transition-all disabled:opacity-50 font-semibold shadow-sm"
                          >
                            {processingId === dep.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(dep.id)}
                            disabled={processingId === dep.id}
                            className="flex items-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl transition-all disabled:opacity-50 font-semibold shadow-sm"
                          >
                            {processingId === dep.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            Reject
                          </button>
                        </>
                      )}
                      {dep.status.toUpperCase() !== "PENDING" && (
                        <span className="text-xs text-slate-400 font-medium px-4 py-2">No actions available</span>
                      )}
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
