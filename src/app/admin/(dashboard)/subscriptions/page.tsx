"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Cpu,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  subscriptionsApi,
  type AdminSubscriptionPurchase,
  type AdminSubscriptionRow,
  type AdminSubscriptionSummary,
  type SubscriptionFilterState,
} from "@/services/adminApi";

/**
 * dBot subscriptions — who has access, and what has actually been paid.
 *
 * Read-only by design. There is no grant or revoke button because the API has
 * no such route: whatever would authorise one becomes a way to mint free
 * access remotely, so granting stays a deliberate act on a host shell
 * (`python -m app.subscription_cli`). This screen shows what is true.
 *
 * Two things it is careful about, because an operator will make decisions from
 * them:
 *
 *   "Entitled" is the server's COMPUTED answer, from the same function the
 *   trading engine's check goes through — not the stored status, which can say
 *   active while the expiry has passed.
 *
 *   Granted subscriptions are counted separately and contribute nothing to
 *   revenue. Comped access and money taken are different facts, and this is the
 *   screen someone would read revenue off.
 */

const PAGE_SIZE = 25;

const FILTERS: { value: SubscriptionFilterState; label: string }[] = [
  { value: "all", label: "All" },
  { value: "entitled", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminSubscriptionsPage() {
  const [summary, setSummary] = useState<AdminSubscriptionSummary | null>(null);
  const [rows, setRows] = useState<AdminSubscriptionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<SubscriptionFilterState>("all");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryData, listData] = await Promise.all([
        subscriptionsApi.summary(),
        subscriptionsApi.list({ state, limit: PAGE_SIZE, offset }),
      ]);
      setSummary(summaryData);
      setRows(listData.items);
      setTotal(listData.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load subscriptions";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [state, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy shadow-lg">
            <Cpu className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h1 className="m-0 text-2xl font-bold tracking-tight text-navy">
              dBot subscriptions
            </h1>
            <p className="m-0 text-sm text-navy-3">
              Who can run bots, and what has been paid for it.
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Summary summary={summary} loading={loading && !summary} />

      <section className="rounded-2xl border border-gold/20 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-4">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setState(filter.value);
                setOffset(0);
              }}
              className={
                "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors " +
                (state === filter.value
                  ? "bg-navy text-gold"
                  : "text-navy-3 hover:bg-gray-100")
              }
            >
              {filter.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-navy-3">
            {loading ? "Loading…" : `${total} subscription${total === 1 ? "" : "s"}`}
          </span>
        </div>

        {loading && rows.length === 0 ? (
          <Centered>
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </Centered>
        ) : rows.length === 0 ? (
          <Centered>
            <p className="m-0 text-sm text-navy-3">
              {state === "all"
                ? "Nobody has a dBot subscription yet."
                : "No subscriptions match this filter."}
            </p>
          </Centered>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50 text-left">
                  <Th>User</Th>
                  <Th>Plan</Th>
                  <Th>Access</Th>
                  <Th>Expires</Th>
                  <Th align="right">Paid</Th>
                  <Th align="right">Payments</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.subscription_id}
                    onClick={() => setSelected(row.user_id)}
                    className="cursor-pointer border-b border-gray-50 last:border-b-0 hover:bg-slate-50"
                  >
                    <Td className="font-mono text-xs text-navy">{row.user_id}</Td>
                    <Td>{row.current_plan_id}</Td>
                    <Td>
                      <AccessPill row={row} />
                    </Td>
                    <Td className="whitespace-nowrap text-navy-3">
                      {row.is_lifetime ? "—" : formatWhen(row.expires_at)}
                    </Td>
                    <Td align="right" className="font-semibold tabular-nums">
                      {money(row.paid_total)}
                    </Td>
                    <Td align="right" className="tabular-nums text-navy-3">
                      {row.purchase_count}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(offset > 0 || offset + PAGE_SIZE < total) && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <Pager
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              ← Newer
            </Pager>
            <span className="text-xs text-navy-3">
              {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </span>
            <Pager
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              Older →
            </Pager>
          </div>
        )}
      </section>

      {selected && (
        <DetailDrawer userId={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ─── Summary ─────────────────────────────────────────────────────────────────

function Summary({
  summary,
  loading,
}: {
  summary: AdminSubscriptionSummary | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-gold/20 bg-white"
          />
        ))}
      </div>
    );
  }
  if (!summary) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="With access" value={String(summary.entitled_count)} />
        <Stat
          label="Revenue"
          value={money(summary.total_revenue)}
          hint="Purchases only"
        />
        <Stat
          label="Comped"
          value={String(summary.granted_count)}
          hint="Granted, never paid"
        />
        <Stat
          label="Expiring in 7 days"
          value={String(summary.expiring_within_7_days)}
        />
      </div>

      {summary.revenue_by_plan.length > 0 && (
        <section className="rounded-2xl border border-gold/20 bg-white p-5 shadow-sm">
          <h2 className="m-0 mb-3 text-sm font-bold uppercase tracking-wide text-navy-3">
            Revenue by plan
          </h2>
          <ul className="m-0 list-none space-y-2 p-0">
            {summary.revenue_by_plan.map((plan) => (
              <li
                key={plan.plan_id}
                className="flex items-baseline justify-between gap-4 text-sm"
              >
                <span className="font-medium text-navy">{plan.plan_id}</span>
                <span className="text-xs text-navy-3">
                  {plan.purchase_count} payment
                  {plan.purchase_count === 1 ? "" : "s"}
                </span>
                <span className="ml-auto font-bold tabular-nums text-navy">
                  {money(plan.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

// ─── Detail ──────────────────────────────────────────────────────────────────

function DetailDrawer({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [subscription, setSubscription] = useState<AdminSubscriptionRow | null>(
    null,
  );
  const [purchases, setPurchases] = useState<AdminSubscriptionPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await subscriptionsApi.detail(userId);
        if (cancelled) return;
        setSubscription(data.subscription);
        setPurchases(data.purchases);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-navy/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 p-6">
          <div className="min-w-0">
            <h2 className="m-0 text-lg font-bold text-navy">Subscription</h2>
            <p className="m-0 mt-1 break-all font-mono text-xs text-navy-3">
              {userId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-navy-3 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-6 p-6">
          {loading && (
            <Centered>
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
            </Centered>
          )}

          {failed && (
            <p className="m-0 text-sm text-red-700">
              Could not load this subscription.
            </p>
          )}

          {!loading && !failed && !subscription && (
            <p className="m-0 text-sm text-navy-3">
              This account has never had a dBot subscription.
            </p>
          )}

          {subscription && (
            <dl className="m-0 grid grid-cols-2 gap-4 text-sm">
              <Field label="Access">
                <AccessPill row={subscription} />
              </Field>
              <Field label="Plan">{subscription.current_plan_id}</Field>
              <Field label="Started">{formatWhen(subscription.started_at)}</Field>
              <Field label="Expires">
                {subscription.is_lifetime
                  ? "Never"
                  : formatWhen(subscription.expires_at)}
              </Field>
              <Field label="Total paid">{money(subscription.paid_total)}</Field>
              <Field label="Stored status">{subscription.status}</Field>
            </dl>
          )}

          <section>
            <h3 className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-navy-3">
              Payments
            </h3>
            {purchases.length === 0 ? (
              <p className="m-0 text-sm text-navy-3">
                {/* The distinction that matters on this screen. */}
                No payments. If this account has access, it was granted rather
                than bought.
              </p>
            ) : (
              <ul className="m-0 list-none space-y-2 p-0">
                {purchases.map((purchase) => (
                  <li
                    key={purchase.purchase_id}
                    className="rounded-xl border border-gray-100 bg-slate-50 p-3 text-sm"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-navy">
                        {purchase.plan_id}
                      </span>
                      <span className="font-bold tabular-nums text-navy">
                        {money(purchase.price_usd)}
                      </span>
                    </div>
                    <p className="m-0 mt-1 text-xs text-navy-3">
                      {formatWhen(purchase.created_at)}
                      {purchase.granted_days === null
                        ? " · lifetime"
                        : ` · ${purchase.granted_days} days`}
                    </p>
                    <p className="m-0 mt-1 break-all font-mono text-[10px] text-navy-3/70">
                      ledger {purchase.wallet_transaction_id}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function AccessPill({ row }: { row: AdminSubscriptionRow }) {
  // `entitled` is the server's computed answer, and it is the only one shown
  // as the headline — the stored status appears in the drawer, labelled, so a
  // discrepancy is visible rather than hidden.
  if (row.entitled) {
    return (
      <Pill tone="ok">{row.is_lifetime ? "Lifetime" : "Active"}</Pill>
    );
  }
  return <Pill tone="bad">{humanReason(row.reason)}</Pill>;
}

function Pill({
  tone,
  children,
}: {
  tone: "ok" | "bad";
  children: React.ReactNode;
}) {
  return (
    <span
      className={
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-bold " +
        (tone === "ok"
          ? "bg-green-50 text-green-700"
          : "bg-amber-50 text-amber-800")
      }
    >
      {children}
    </span>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-gold/20 bg-white p-5 shadow-sm">
      <p className="m-0 text-xs font-bold uppercase tracking-wide text-navy-3">
        {label}
      </p>
      <p className="m-0 mt-1 text-2xl font-extrabold tabular-nums text-navy">
        {value}
      </p>
      {hint && <p className="m-0 mt-0.5 text-xs text-navy-3">{hint}</p>}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="m-0 text-xs font-bold uppercase tracking-wide text-navy-3">
        {label}
      </dt>
      <dd className="m-0 mt-1 text-navy">{children}</dd>
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={
        "px-5 py-3 text-xs font-bold uppercase tracking-wide text-navy-3 " +
        (align === "right" ? "text-right" : "")
      }
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={`px-5 py-3 ${align === "right" ? "text-right" : ""} ${className}`}
    >
      {children}
    </td>
  );
}

function Pager({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg px-3 py-1.5 text-sm font-semibold text-navy-3 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-center px-5 py-12">{children}</div>;
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/** Decimal strings on the wire; parsed only to render, never to compute. */
function money(value: string): string {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "—";
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** The server's codes are its vocabulary, not an operator's. */
function humanReason(reason: string): string {
  switch (reason) {
    case "subscription_expired":
      return "Expired";
    case "subscription_cancelled":
      return "Cancelled";
    case "no_subscription":
      return "None";
    case "subscription_invalid":
      return "Invalid — check this row";
    default:
      return reason;
  }
}
