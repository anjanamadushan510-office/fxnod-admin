"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/services/adminApi";
import { Loader2, AlertCircle, Check, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    ticketId: string;
    currentStatus: string;
    subject: string;
  } | null>(null);
  
  const [newStatus, setNewStatus] = useState("OPEN");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketsData, usersData] = await Promise.all([
        adminApi.getTickets(),
        adminApi.getUsers().catch(() => []) // fallback
      ]);
      setTickets(ticketsData);
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || "Failed to load tickets");
      toast.error("Failed to load tickets data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async () => {
    if (!statusModal) return;
    
    try {
      setProcessingId(statusModal.ticketId);
      
      await adminApi.updateTicketStatus(statusModal.ticketId, newStatus);
      toast.success("Ticket status updated successfully.");
      
      setStatusModal(null);
      fetchData();
    } catch (err: any) {
      const errDetail = err.response?.data?.detail;
      const errMsg = Array.isArray(errDetail) 
        ? errDetail.map((e: any) => `${e.loc?.join('.')} ${e.msg}`).join(', ') 
        : errDetail || err.message;
      toast.error("Error: " + errMsg);
    } finally {
      setProcessingId(null);
    }
  };

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.email : userId.slice(0, 8) + "...";
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "OPEN":
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase">Open</span>;
      case "IN_PROGRESS":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold uppercase">In Progress</span>;
      case "RESOLVED":
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase">Resolved</span>;
      case "CLOSED":
        return <span className="px-2 py-1 bg-zinc-100 text-zinc-700 rounded-full text-xs font-semibold uppercase">Closed</span>;
      default:
        return <span className="px-2 py-1 bg-zinc-100 text-zinc-700 rounded-full text-xs font-semibold uppercase">{status}</span>;
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
      
      {/* Status Update Modal */}
      {statusModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-gold/10 text-gold-3">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-navy">Update Ticket</h2>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-medium text-navy-3">Subject</p>
                <p className="text-navy truncate font-semibold">{statusModal.subject}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-3 mb-2">New Status</label>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-xl border border-gold/20 px-4 py-3 text-navy bg-slate-50 focus:border-gold outline-none"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setStatusModal(null)} 
                className="px-5 py-2.5 rounded-xl font-semibold text-navy-3 hover:bg-slate-100 transition-colors"
                disabled={processingId !== null}
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateStatus} 
                className="px-5 py-2.5 rounded-xl font-semibold bg-gold text-navy hover:bg-gold-2 transition-colors flex items-center gap-2"
                disabled={processingId !== null}
              >
                {processingId !== null && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">Ticket Management</h1>
          <p className="text-navy-3 mt-1">Review and manage user support requests.</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gold/20 rounded-3xl overflow-hidden shadow-lg shadow-gold/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gold/10">
                <th className="py-4 px-6 font-semibold text-sm text-navy">Date</th>
                <th className="py-4 px-6 font-semibold text-sm text-navy">Topic</th>
                <th className="py-4 px-6 font-semibold text-sm text-navy">Subject</th>
                <th className="py-4 px-6 font-semibold text-sm text-navy">User</th>
                <th className="py-4 px-6 font-semibold text-sm text-navy">Status</th>
                <th className="py-4 px-6 font-semibold text-sm text-navy text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10 text-sm">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-navy-3">No tickets found.</td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-navy whitespace-nowrap">
                      {format(new Date(ticket.created_at), "MMM d, yyyy HH:mm")}
                    </td>
                    <td className="py-4 px-6 text-navy whitespace-nowrap font-medium uppercase text-xs">
                      {ticket.topic}
                    </td>
                    <td className="py-4 px-6 text-navy max-w-xs truncate" title={ticket.subject}>
                      {ticket.subject}
                    </td>
                    <td className="py-4 px-6 text-navy whitespace-nowrap">
                      {getUserEmail(ticket.user_id)}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setNewStatus(ticket.status);
                          setStatusModal({
                            isOpen: true,
                            ticketId: ticket.id,
                            currentStatus: ticket.status,
                            subject: ticket.subject,
                          });
                        }}
                        className="px-3 py-1.5 rounded-lg border border-gold/20 text-gold-3 hover:bg-gold/10 hover:text-gold transition-colors font-semibold text-xs"
                      >
                        Update
                      </button>
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
