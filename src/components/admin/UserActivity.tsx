"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { userControls } from "@/services/userControls";

export function UserActivity({ userId }: { userId?: string }) {
  const [source, setSource] = useState("");
  const [outcome, setOutcome] = useState("all");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const [offset, setOffset] = useState(0);
  const datesValid = !since || !until || since <= until;
  const query = useQuery({
    queryKey: ["user-activity", userId, source, outcome, since, until, offset],
    queryFn: () =>
      userControls.activity({
        user_id: userId,
        source,
        outcome,
        offset,
        since: since ? new Date(since).toISOString() : undefined,
        until: until ? new Date(until).toISOString() : undefined,
      }),
    enabled: datesValid,
    refetchInterval: 10000,
  });
  const items = query.data?.items ?? [];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="p-5 space-y-3 border-b border-slate-100">
        <div className="flex justify-between gap-3">
          <h2 className="text-lg font-semibold">Activity timeline</h2>
          <button
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="text-sm text-slate-600 disabled:opacity-40"
          >
            {query.isFetching ? "Updating…" : "Refresh"}
          </button>
        </div>
        <p className="text-sm text-slate-500">
          Completed FXNOD API requests and sign-ins. Automatically refreshes
          every 10 seconds. Collection starts when this release is deployed;
          existing financial records are available in the account view.
        </p>
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <label>
            Service
            <select
              aria-label="Activity service"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setOffset(0);
              }}
              className="block border rounded-lg p-2 mt-1"
            >
              <option value="">All services</option>
              {["auth", "wallet", "trading", "referral", "admin"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Result
            <select
              aria-label="Activity result"
              value={outcome}
              onChange={(e) => {
                setOutcome(e.target.value);
                setOffset(0);
              }}
              className="block border rounded-lg p-2 mt-1"
            >
              <option value="all">All results</option>
              <option value="success">Successful</option>
              <option value="error">Errors</option>
            </select>
          </label>
          <label>
            From (local time)
            <input
              aria-label="Activity from"
              type="datetime-local"
              value={since}
              onChange={(e) => {
                setSince(e.target.value);
                setOffset(0);
              }}
              className="block border rounded-lg p-2 mt-1"
            />
          </label>
          <label>
            To (local time)
            <input
              aria-label="Activity until"
              type="datetime-local"
              value={until}
              onChange={(e) => {
                setUntil(e.target.value);
                setOffset(0);
              }}
              className="block border rounded-lg p-2 mt-1"
            />
          </label>
        </div>
      </div>
      {!datesValid && (
        <p role="alert" className="p-5 text-red-700">
          Start date must precede end date.
        </p>
      )}
      {query.isError && (
        <p role="alert" className="p-5 text-red-700">
          Activity could not be loaded. Refresh to retry.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {[
                "Time",
                ...(!userId ? ["User"] : []),
                "Service / action",
                "Result",
                "Duration",
              ].map((s) => (
                <th className="p-4 font-medium" key={s}>
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((a) => (
              <tr key={a.id}>
                <td className="p-4 whitespace-nowrap">
                  {new Date(a.created_at).toLocaleString()}
                </td>
                {!userId && (
                  <td className="p-4">
                    <Link
                      className="text-amber-700 hover:underline"
                      href={`/admin/users/${a.user_id}` as any}
                    >
                      {a.email || a.user_id}
                    </Link>
                  </td>
                )}
                <td className="p-4">
                  <span className="text-slate-500">
                    {a.source} · {a.method}
                  </span>
                  <div className="font-mono text-xs mt-1">{a.path}</div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${a.status_code < 400 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                  >
                    {a.status_code < 400 ? "Success" : "Error"} ·{" "}
                    {a.status_code}
                  </span>
                </td>
                <td className="p-4 whitespace-nowrap">{a.duration_ms} ms</td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td
                  colSpan={userId ? 4 : 5}
                  className="p-10 text-center text-slate-500"
                >
                  {query.isLoading
                    ? "Loading activity…"
                    : "No activity in this range."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 flex justify-between items-center border-t text-sm">
        <span>
          {query.data?.total ?? 0} records · Page {Math.floor(offset / 50) + 1}
        </span>
        <div className="flex gap-4">
          <button
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - 50))}
            className="disabled:opacity-30"
          >
            Previous
          </button>
          <button
            disabled={offset + 50 >= (query.data?.total ?? 0)}
            onClick={() => setOffset(offset + 50)}
            className="disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
