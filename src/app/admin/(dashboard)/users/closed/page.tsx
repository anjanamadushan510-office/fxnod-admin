"use client";

import { useGetClosedAccounts } from "@/services/api/endpoints/admin/admin";

export default function ClosedAccountsPage() {
  const { data: closedAccounts, isLoading, error } = useGetClosedAccounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Closed Accounts</h1>
        <p className="text-zinc-400 mt-2">View users who have archived and closed their accounts.</p>
      </div>

      <div className="rounded-xl border border-line bg-panel overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-zinc-500">Loading closed accounts...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Failed to load closed accounts.</div>
        ) : !closedAccounts || closedAccounts.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No closed accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 uppercase bg-bg border-b border-line">
                <tr>
                  <th className="px-6 py-4 font-medium">Original User ID</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Closed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {closedAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-zinc-300">{account.original_user_id}</td>
                    <td className="px-6 py-4 text-zinc-300">{account.email}</td>
                    <td className="px-6 py-4 text-zinc-400 whitespace-nowrap">
                      {new Date(account.closed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
