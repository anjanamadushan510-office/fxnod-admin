"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, Lock, Unlock, X } from "lucide-react";
import { UserActivity } from "@/components/admin/UserActivity";
import {
  userControls,
  type Scope,
  type RecordRow,
} from "@/services/userControls";

const scopes: { id: Scope; name: string; description: string }[] = [
  {
    id: "account",
    name: "Entire account",
    description:
      "Blocks sign-in and authenticated access. Revokes existing login sessions and prevents new bot orders.",
  },
  {
    id: "wallet",
    name: "Wallet",
    description:
      "Blocks new wallet operations, withdrawals and package checkout. Existing balances and incoming credits remain recorded.",
  },
  {
    id: "tools",
    name: "All tools",
    description:
      "Blocks new trades and bot orders across all tools. Existing trades can be viewed and closed.",
  },
  {
    id: "dtrader",
    name: "Trade Pilot",
    description: "Blocks new manual trades in Trade Pilot.",
  },
  {
    id: "dbot",
    name: "Bot Forge",
    description:
      "Blocks new Bot Forge orders and starts. Existing runs pause before their next order.",
  },
  {
    id: "autohub",
    name: "Auto Hub",
    description:
      "Blocks new Auto Hub orders and starts. Existing runs pause before their next order.",
  },
];
const pretty = (v: RecordRow[string]) =>
  v === null || v === undefined
    ? "—"
    : typeof v === "boolean"
      ? v
        ? "Yes"
        : "No"
      : String(v);
function Records({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: RecordRow[];
  columns: string[];
}) {
  return (
    <section className="rounded-2xl border bg-white overflow-hidden">
      <h2 className="p-5 font-semibold border-b">
        {title}{" "}
        <span className="font-normal text-xs text-slate-500">
          · latest {rows.length} records
        </span>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c} className="p-4 font-medium whitespace-nowrap">
                  {c.replaceAll("_", " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => (
              <tr key={String(r.id || i)}>
                {columns.map((c) => (
                  <td className="p-4 max-w-sm break-words" key={c}>
                    {c.endsWith("_at") && r[c]
                      ? new Date(String(r[c])).toLocaleString()
                      : pretty(r[c])}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-8 text-center text-slate-500"
                >
                  No records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
export default function UserInspectionPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  const cache = useQueryClient();
  const [tab, setTab] = useState("activity");
  const [action, setAction] = useState<{
    scope: Scope;
    blocked: boolean;
    before: boolean;
  } | null>(null);
  const [walletOffset, setWalletOffset] = useState(0);
  const [tradingOffset, setTradingOffset] = useState(0);
  const [reason, setReason] = useState("");
  const [auditOffset, setAuditOffset] = useState(0);
  const query = useQuery({
    queryKey: ["user-inspection", id, walletOffset, tradingOffset],
    queryFn: () => userControls.inspect(id, walletOffset, tradingOffset),
    refetchInterval: 30000,
  });
  const audit = useQuery({
    queryKey: ["user-audit", id, auditOffset],
    queryFn: () => userControls.audit(id, auditOffset),
    enabled: tab === "audit",
  });
  const change = useMutation({
    mutationFn: async () => {
      if (!action) throw new Error("No action selected");
      return userControls.restrict(
        id,
        action.scope,
        action.blocked,
        action.before,
        reason.trim(),
      );
    },
    retry: false,
    onSuccess: async () => {
      setAction(null);
      setReason("");
      toast.success("Account access updated");
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["user-inspection", id] }),
        cache.invalidateQueries({ queryKey: ["user-audit", id] }),
        cache.invalidateQueries({ queryKey: ["user-directory"] }),
        cache.invalidateQueries({ queryKey: ["user-overview"] }),
      ]);
    },
    onError: (err: any) => {
      toast.error(
        typeof err?.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Access could not be changed. Refresh the account and retry.",
      );
      cache.invalidateQueries({ queryKey: ["user-inspection", id] });
    },
  });
  const detail = query.data;
  const user = detail?.user;
  const protectedAccount = user?.role === "admin";
  const ownBlocked = (scope: Scope) =>
    scope === "account"
      ? !user?.is_active ||
        !!detail?.controls.find((c) => c.scope === scope)?.blocked
      : !!detail?.controls.find((c) => c.scope === scope)?.blocked;
  const accountBlocked = ownBlocked("account");
  const wallet = detail?.wallet.data;
  const trading = detail?.trading.data;
  return (
    <div className="space-y-6">
      <Link href={"/admin/users" as any} className="text-sm text-slate-500">
        ← Back to users
      </Link>
      {query.isLoading && (
        <p className="p-8 text-slate-500">Loading account inspection…</p>
      )}
      {query.isError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"
        >
          Account could not be loaded.{" "}
          <button onClick={() => query.refetch()} className="underline">
            Retry
          </button>
        </div>
      )}
      {user && (
        <>
          <section className="bg-white rounded-2xl border p-6">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {user.full_name || "Unnamed user"}
                </h1>
                <p className="text-slate-500 mt-1">{user.email}</p>
                <p className="text-xs text-slate-400 font-mono mt-2">
                  {user.id}
                </p>
              </div>
              <button
                onClick={() => query.refetch()}
                disabled={query.isFetching}
                className="border rounded-xl px-4 py-2 h-fit text-sm disabled:opacity-40"
              >
                {query.isFetching ? "Updating…" : "Refresh account"}
              </button>
            </div>
            <div className="flex flex-wrap gap-6 mt-5 text-sm">
              <span>
                Account:{" "}
                <strong
                  className={
                    accountBlocked ? "text-red-700" : "text-emerald-700"
                  }
                >
                  {accountBlocked ? "Blocked" : "Active"}
                </strong>
              </span>
              <span>
                KYC: <strong>{user.kyc_status.replaceAll("_", " ")}</strong>
              </span>
              <span>
                Email: {user.is_email_verified ? "Verified" : "Unverified"}
              </span>
              <span>
                Joined: {new Date(user.created_at).toLocaleDateString()}
              </span>
              <span>Phone: {user.phone || "—"}</span>
            </div>
          </section>
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} />
              <h2 className="font-semibold">Account access controls</h2>
            </div>
            {protectedAccount && (
              <p className="text-sm text-amber-700 mb-3">
                Administrator accounts are protected from restrictions in this
                console.
              </p>
            )}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {scopes.map((s) => {
                const own = ownBlocked(s.id);
                const inherited =
                  s.id !== "account" &&
                  (accountBlocked ||
                    (s.id !== "wallet" &&
                      s.id !== "tools" &&
                      ownBlocked("tools")));
                const restriction = detail?.controls.find(
                  (c) => c.scope === s.id,
                );
                return (
                  <div
                    key={s.id}
                    className={`rounded-2xl border p-5 bg-white ${own || inherited ? "border-red-200" : "border-slate-200"}`}
                  >
                    <div className="flex justify-between gap-2">
                      <h3 className="font-semibold">{s.name}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${own || inherited ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
                      >
                        {own
                          ? "Blocked"
                          : inherited
                            ? "Blocked by parent"
                            : "Allowed"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-3 min-h-16">
                      {s.description}
                    </p>
                    {restriction?.reason && (
                      <p className="text-xs mt-3 text-slate-500 break-words">
                        Last reason: {restriction.reason}
                        <br />
                        {new Date(restriction.updated_at).toLocaleString()}
                      </p>
                    )}
                    <button
                      disabled={
                        protectedAccount || change.isPending || inherited
                      }
                      onClick={() => {
                        setReason("");
                        setAction({
                          scope: s.id,
                          blocked: !own,
                          before: !!own,
                        });
                      }}
                      className={`mt-4 rounded-xl px-3 py-2 text-sm flex items-center gap-2 disabled:opacity-40 ${own ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                    >
                      {own ? <Unlock size={14} /> : <Lock size={14} />}{" "}
                      {own ? "Unblock" : "Block"} {s.name}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
          <div className="flex gap-2 flex-wrap border-b pb-3">
            {["activity", "wallet", "trading", "sessions", "audit"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm capitalize ${tab === t ? "bg-slate-900 text-white" : "bg-white border text-slate-600"}`}
              >
                {t === "audit" ? "Admin audit" : t}
              </button>
            ))}
          </div>
          {tab === "activity" && <UserActivity key={id} userId={id} />}
          {tab === "wallet" &&
            (detail?.wallet.available ? (
              <div className="space-y-5">
                <Records
                  title="Wallet balance"
                  rows={wallet?.wallet ?? []}
                  columns={[
                    "currency",
                    "balance",
                    "total_deposited",
                    "total_withdrawn",
                  ]}
                />
                <Records
                  title="Wallet ledger"
                  rows={wallet?.transactions ?? []}
                  columns={[
                    "created_at",
                    "transaction_type",
                    "direction",
                    "amount",
                    "currency",
                    "balance_after",
                  ]}
                />
                <Records
                  title="Withdrawals"
                  rows={wallet?.withdrawals ?? []}
                  columns={["created_at", "amount", "currency", "status", "id"]}
                />
                <Records
                  title="Package purchases"
                  rows={wallet?.orders ?? []}
                  columns={[
                    "created_at",
                    "offer_id",
                    "total",
                    "currency",
                    "coupon_code",
                  ]}
                />
                <Records
                  title="Tool memberships"
                  rows={wallet?.grants ?? []}
                  columns={["tool_id", "tier_name", "expires_at"]}
                />
              </div>
            ) : (
              <p role="alert" className="p-5 border rounded-xl text-amber-700">
                {detail?.wallet.error}
              </p>
            ))}
          {tab === "trading" &&
            (detail?.trading.available ? (
              <div className="space-y-5">
                <Records
                  title="Connected Deriv accounts"
                  rows={trading?.accounts ?? []}
                  columns={[
                    "deriv_account_id",
                    "currency",
                    "is_virtual",
                    "is_active",
                    "expires_at",
                    "revoked_at",
                  ]}
                />
                <Records
                  title="Trade history"
                  rows={trading?.trades ?? []}
                  columns={[
                    "created_at",
                    "symbol",
                    "contract_type",
                    "stake_amount",
                    "final_payout_amount",
                    "currency",
                    "outcome",
                    "deriv_contract_id",
                  ]}
                />
                <Records
                  title="Bot runs"
                  rows={trading?.runs ?? []}
                  columns={[
                    "created_at",
                    "product",
                    "strategy_id",
                    "is_virtual",
                    "status",
                    "realized_pnl",
                    "currency",
                    "trades_total",
                    "trades_open",
                  ]}
                />
              </div>
            ) : (
              <p role="alert" className="p-5 border rounded-xl text-amber-700">
                {detail?.trading.error}
              </p>
            ))}
          {(tab === "wallet" || tab === "trading") && (
            <div className="flex justify-between text-sm">
              <span>
                Records page{" "}
                {Math.floor(
                  (tab === "wallet" ? walletOffset : tradingOffset) / 100,
                ) + 1}{" "}
                · up to 100 per section
              </span>
              <div className="flex gap-4">
                <button
                  disabled={
                    query.isFetching ||
                    (tab === "wallet" ? walletOffset : tradingOffset) === 0
                  }
                  onClick={() =>
                    tab === "wallet"
                      ? setWalletOffset(walletOffset - 100)
                      : setTradingOffset(tradingOffset - 100)
                  }
                  className="disabled:opacity-30"
                >
                  Previous records
                </button>
                <button
                  disabled={
                    query.isFetching ||
                    !Object.values(
                      (tab === "wallet" ? wallet : trading) || {},
                    ).some((rows) => rows.length === 100)
                  }
                  onClick={() =>
                    tab === "wallet"
                      ? setWalletOffset(walletOffset + 100)
                      : setTradingOffset(tradingOffset + 100)
                  }
                  className="disabled:opacity-30"
                >
                  Next records
                </button>
              </div>
            </div>
          )}
          {tab === "sessions" && (
            <Records
              title="Recent login sessions"
              rows={detail?.sessions ?? []}
              columns={[
                "created_at",
                "audience",
                "ip_address",
                "user_agent",
                "is_revoked",
                "expires_at",
              ]}
            />
          )}
          {tab === "audit" && (
            <section className="rounded-2xl border bg-white p-5 space-y-4">
              <h2 className="font-semibold">
                Restriction audit · {audit.data?.total ?? 0} changes
              </h2>
              {audit.isError && (
                <p role="alert" className="text-red-700">
                  Could not load audit.{" "}
                  <button onClick={() => audit.refetch()}>Retry</button>
                </p>
              )}
              {audit.data?.items.map((a) => (
                <div key={a.id} className="border-t pt-4">
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <strong>
                      {a.after_state.scope} ·{" "}
                      {a.after_state.blocked ? "Blocked" : "Unblocked"}
                    </strong>
                    <span className="text-slate-500">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm mt-2 break-words">{a.reason}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    By {a.actor_email}
                  </p>
                </div>
              ))}
              {!audit.data?.items.length && !audit.isLoading && (
                <p className="text-slate-500">
                  No restriction changes recorded.
                </p>
              )}
              <div className="flex justify-end gap-4 text-sm">
                <button
                  disabled={!auditOffset}
                  onClick={() => setAuditOffset(auditOffset - 50)}
                  className="disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  disabled={auditOffset + 50 >= (audit.data?.total ?? 0)}
                  onClick={() => setAuditOffset(auditOffset + 50)}
                  className="disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </section>
          )}
        </>
      )}
      {action && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="restriction-title"
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl"
          >
            <div className="flex justify-between">
              <h2 id="restriction-title" className="text-xl font-bold">
                {action.blocked ? "Block" : "Unblock"}{" "}
                {scopes.find((s) => s.id === action.scope)?.name}
              </h2>
              <button
                aria-label="Cancel restriction"
                disabled={change.isPending}
                onClick={() => setAction(null)}
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Account: {user?.email}
            </p>
            <p className="mt-3 text-sm">
              {action.blocked
                ? scopes.find((s) => s.id === action.scope)?.description
                : "Restores this access only. Other restrictions and plan requirements remain in effect."}
            </p>
            <label className="block mt-5 text-sm font-medium">
              Reason (required)
              <textarea
                aria-label="Restriction reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={change.isPending}
                maxLength={2000}
                rows={3}
                placeholder="Explain the evidence and reason for this decision"
                className="border rounded-xl p-3 block w-full mt-2"
              />
            </label>
            <p className="text-xs text-slate-500 mt-2">
              Your identity, reason and before/after state will be recorded in
              the audit trail.
            </p>
            <div className="flex justify-end gap-3 mt-5">
              <button
                disabled={change.isPending}
                onClick={() => setAction(null)}
                className="px-4 py-2 border rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={reason.trim().length < 5 || change.isPending}
                onClick={() => change.mutate()}
                className={`px-4 py-2 rounded-xl text-white disabled:opacity-40 ${action.blocked ? "bg-red-700" : "bg-emerald-700"}`}
              >
                {change.isPending
                  ? "Saving…"
                  : `Confirm ${action.blocked ? "block" : "unblock"}`}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
