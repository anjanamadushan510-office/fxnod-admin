"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { userControls } from "@/services/userControls";
export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [state, setState] = useState("all");
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const overview = useQuery({
    queryKey: ["user-overview"],
    queryFn: userControls.overview,
    refetchInterval: 30000,
  });
  const query = useQuery({
    queryKey: ["user-directory", debounced, state, offset],
    queryFn: () => userControls.directory({ search: debounced, state, offset }),
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Users & account access</h1>
          <p className="text-slate-500 mt-2">
            Inspect activity, balances, trades and access restrictions.
          </p>
        </div>
        <Link
          href={"/admin/activity" as any}
          className="rounded-xl border px-4 py-3 bg-white text-sm h-fit"
        >
          View all activity →
        </Link>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ["Total users", overview.data?.users],
          ["Restricted users", overview.data?.restricted],
          ["Inactive accounts", overview.data?.inactive],
        ].map(([label, value]) => (
          <div className="p-5 rounded-2xl border bg-white" key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-3xl font-semibold mt-2">{value ?? "—"}</p>
          </div>
        ))}
      </div>
      <section className="rounded-2xl border bg-white overflow-hidden">
        <div className="p-5 flex flex-wrap gap-3 border-b">
          <input
            aria-label="Search users"
            placeholder="Search email or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-xl p-3 flex-1 min-w-48"
          />
          <select
            aria-label="Account status"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setOffset(0);
            }}
            className="border rounded-xl p-3"
          >
            <option value="all">All accounts</option>
            <option value="active">Unrestricted</option>
            <option value="restricted">Restricted</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="px-3 text-sm disabled:opacity-40"
          >
            Refresh
          </button>
        </div>
        {query.isError && (
          <p role="alert" className="p-5 text-red-700">
            Could not load users. Refresh to retry.
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {["User", "Verification", "Access", "Joined", ""].map(
                  (h, i) => (
                    <th key={i} className="p-5 font-medium">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {query.data?.items.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-5">
                    <div className="font-semibold">
                      {u.full_name || "Unnamed user"}{" "}
                      {u.role === "admin" && (
                        <span className="text-xs text-amber-700">Admin</span>
                      )}
                    </div>
                    <div className="text-slate-500">{u.email}</div>
                  </td>
                  <td className="p-5">
                    {u.kyc_status.replaceAll("_", " ")}
                    <div className="text-xs text-slate-500">
                      Email {u.is_email_verified ? "verified" : "unverified"}
                    </div>
                  </td>
                  <td className="p-5">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${!u.is_active || u.blocked_scopes.length ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
                    >
                      {!u.is_active
                        ? "Account inactive"
                        : u.blocked_scopes.length
                          ? u.blocked_scopes.join(", ")
                          : "Unrestricted"}
                    </span>
                  </td>
                  <td className="p-5 whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-5">
                    <Link
                      href={`/admin/users/${u.id}` as any}
                      className="font-semibold text-amber-700"
                    >
                      Inspect →
                    </Link>
                  </td>
                </tr>
              ))}
              {!query.data?.items.length && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    {query.isLoading
                      ? "Loading accounts…"
                      : "No matching accounts."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-5 border-t flex justify-between text-sm">
          <span>
            {query.data?.total ?? 0} accounts · Page{" "}
            {Math.floor(offset / 25) + 1}
          </span>
          <div className="flex gap-4">
            <button
              disabled={!offset}
              onClick={() => setOffset(offset - 25)}
              className="disabled:opacity-30"
            >
              Previous
            </button>
            <button
              disabled={offset + 25 >= (query.data?.total ?? 0)}
              onClick={() => setOffset(offset + 25)}
              className="disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
