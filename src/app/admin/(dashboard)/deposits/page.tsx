"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/services/adminApi";
import { Check, X, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Custom Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "approve" | "reject";
    depositId: string;
    claimedAmount?: string;
    txHash?: string;
    currency?: string;
  } | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  // The amount the reviewer confirmed on chain. Pre-filled with the user's
  // claim so the common case is one click, but editable because the claim is
  // the one number in this flow nobody has verified.
  const [verifiedAmount, setVerifiedAmount] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [depositsData, usersData] = await Promise.all([
        adminApi.getManualDeposits(),
        adminApi.getUsers().catch(() => []) // fallback if users fail
      ]);
      setDeposits(depositsData);
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || "Failed to load deposits");
      toast.error("Failed to load deposits data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const executeAction = async () => {
    if (!confirmModal) return;
    const { type, depositId } = confirmModal;
    
    try {
      setProcessingId(depositId);
      setConfirmModal(null); // Close modal immediately
      
      if (type === "approve") {
        await adminApi.approveManualDeposit(depositId, { verifiedAmount });
        toast.success("Deposit approved successfully! User wallet credited.");
      } else {
        await adminApi.rejectManualDeposit(depositId, rejectNote);
        toast.success("Deposit rejected successfully.");
      }

      fetchData();
    } catch (err: any) {
      toast.error("Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setProcessingId(null);
      setRejectNote(""); // reset note
      setVerifiedAmount("");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-navy flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 bg-white rounded-xl shadow-sm">{error}</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 relative">
      
      {/* --- Custom Confirm Modal --- */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${confirmModal.type === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {confirmModal.type === 'approve' ? <Check className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <h2 className="text-xl font-bold text-navy">
                {confirmModal.type === "approve" ? "Approve Deposit" : "Reject Deposit"}
              </h2>
            </div>
            
            <p className="text-slate-600 mb-4">
              {confirmModal.type === "approve"
                ? "Check the transaction on chain before approving. The wallet is credited instantly and the ledger is append-only, so a wrong amount has to be corrected with a compensating entry."
                : "Are you sure you want to reject this deposit request?"}
            </p>

            {confirmModal.type === "approve" && (
              <div className="mb-6 space-y-4">
                {/* Everything needed to look the transaction up, so the
                    reviewer is not switching tabs to find the hash. */}
                <div className="rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">User claims</span>
                    <span className="font-semibold text-navy">
                      {confirmModal.claimedAmount} {confirmModal.currency}
                    </span>
                  </div>
                  <div className="text-slate-500 mb-1">Transaction</div>
                  <a
                    href={`https://tronscan.org/#/transaction/${confirmModal.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs break-all text-gold hover:underline"
                  >
                    {confirmModal.txHash}
                  </a>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Amount confirmed on chain
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={verifiedAmount}
                    onChange={(e) => setVerifiedAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-gold outline-none transition-all"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    This is what gets credited. It is pre-filled with the
                    user&apos;s figure — change it if the chain says otherwise.
                  </p>
                </div>
              </div>
            )}

            {confirmModal.type === "reject" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason for rejection (Optional)</label>
                <input
                  type="text"
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="e.g. Invalid TxHash"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-gold outline-none transition-all"
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setConfirmModal(null); setRejectNote(""); }}
                className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeAction}
                className={`px-5 py-2.5 rounded-xl font-semibold text-white transition-all shadow-sm ${
                  confirmModal.type === "approve" 
                    ? "bg-green-600 hover:bg-green-700 hover:shadow-md" 
                    : "bg-red-600 hover:bg-red-700 hover:shadow-md"
                }`}
              >
                {confirmModal.type === "approve" ? "Yes, Approve" : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-2">
        <Link href="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-navy-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-navy">Wallet Management</h1>
          <p className="text-navy-3 mt-1">Review and manage manual TRC-20 deposit requests.</p>
        </div>
        <button 
          onClick={fetchData} 
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
                <th className="p-5">User</th>
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
                deposits.map((dep) => {
                  const user = users.find(u => u.id === dep.user_id);
                  return (
                  <tr key={dep.id} className="border-b border-gray-50 last:border-none hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 text-navy-2 whitespace-nowrap">
                      {new Date(dep.created_at).toLocaleString()}
                    </td>
                    <td className="p-5">
                      {user ? (
                        <div>
                          <div className="font-bold text-navy whitespace-nowrap">{user.full_name || 'N/A'}</div>
                          <div className="text-xs text-navy-3">{user.email}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5" title="User ID">{dep.user_id.substring(0, 8)}...</div>
                        </div>
                      ) : (
                        <div className="font-mono text-xs font-semibold text-navy">
                          {dep.user_id}
                        </div>
                      )}
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
                      <div className="flex flex-col items-start gap-1">
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
                        {dep.admin_note && (
                          <div className="text-[11px] text-slate-500 max-w-[150px] leading-tight mt-1">
                            <span className="font-semibold text-slate-700">Note:</span> {dep.admin_note}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-5 flex justify-end gap-2">
                      {dep.status.toUpperCase() === "PENDING" && (
                        <>
                          <button
                            onClick={() => {
                              setVerifiedAmount(String(dep.amount));
                              setConfirmModal({
                                isOpen: true,
                                type: "approve",
                                depositId: dep.id,
                                claimedAmount: String(dep.amount),
                                txHash: dep.tx_hash,
                                currency: dep.currency,
                              });
                            }}
                            disabled={processingId === dep.id}
                            className="flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white px-4 py-2 rounded-xl transition-all disabled:opacity-50 font-semibold shadow-sm"
                          >
                            {processingId === dep.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Approve
                          </button>
                          <button
                            onClick={() => setConfirmModal({ isOpen: true, type: "reject", depositId: dep.id })}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
