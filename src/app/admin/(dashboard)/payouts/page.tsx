"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Banknote, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  payoutsApi,
  type PayoutBatch,
  type PayoutPreview,
} from "@/services/adminApi";
import { parseApiError } from "@/lib/apiError";
import {
  applyShare,
  formatAmount,
  formatShare,
  fromUnits,
  shareOf,
  toUnits,
} from "@/lib/decimal";

/**
 * Deriv payouts — where partner commission becomes money.
 *
 * Commission on trade markup is accrued trade by trade and sits unpaid until
 * Deriv's monthly markup payout is recorded here. Recording one settles that
 * month for good: it cannot be edited, undone or repeated.
 *
 * The operator states one thing, what Deriv paid. The server measures it
 * against the markup recorded on the month's trades and pays every commission
 * the same share of itself; there is no field for that share, here or in the
 * API. What this screen adds is the chance to see both figures, and what the
 * payout will do, before committing to it.
 *
 * Every number shown is read from the server when the month is chosen. The
 * "partners will be paid" line is worked out here from those numbers with
 * exact decimals, to mirror what the server will do; it is labelled as an
 * estimate because the server rounds each commission down separately.
 */

/** The month before this one, in UTC, as trades are stamped: the newest month
 *  a payout can be recorded for. */
function lastEndedMonth(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthName(period: string): string {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;

export default function AdminPayoutsPage() {
  const [period, setPeriod] = useState(lastEndedMonth);
  const [preview, setPreview] = useState<PayoutPreview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const [batches, setBatches] = useState<PayoutBatch[] | null>(null);
  const [batchesError, setBatchesError] = useState("");

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [recording, setRecording] = useState(false);

  const loadBatches = useCallback(async () => {
    try {
      setBatches(await payoutsApi.list());
      setBatchesError("");
    } catch (error) {
      setBatchesError(parseApiError(error, "Could not load recorded payouts.").message);
    }
  }, []);

  const loadPreview = useCallback(async (month: string) => {
    if (!PERIOD.test(month)) {
      setPreview(null);
      setPreviewError("");
      return;
    }
    setPreviewLoading(true);
    setPreviewError("");
    try {
      setPreview(await payoutsApi.preview(month));
    } catch (error) {
      setPreview(null);
      setPreviewError(
        parseApiError(error, "Could not read this month’s totals.").message,
      );
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    setAmount("");
    setNote("");
    loadPreview(period);
  }, [period, loadPreview]);

  // A batch still "settling" is being paid out right now; look again shortly
  // so the screen does not go on saying so after it has finished.
  const settling = batches?.some((batch) => batch.status !== "settled") ?? false;
  useEffect(() => {
    if (!settling) return;
    const timer = setInterval(loadBatches, 5000);
    return () => clearInterval(timer);
  }, [settling, loadBatches]);

  const paid = toUnits(amount);
  const expected = toUnits(preview?.expected_markup);
  const waiting = toUnits(preview?.commission_waiting);
  const share = paid !== null && expected !== null ? shareOf(paid, expected) : null;
  const toPartners =
    share !== null && waiting !== null ? applyShare(waiting, share) : null;
  const short = paid !== null && expected !== null && paid < expected;
  // Commission waiting on a month with no recorded markup: the server refuses
  // this, because "no markup" would read as "paid in full".
  const inconsistent =
    expected !== null && waiting !== null && expected === BigInt(0) && waiting > BigInt(0);

  const canRecord =
    preview !== null &&
    preview.period_ended &&
    preview.recorded === null &&
    paid !== null &&
    !inconsistent &&
    !recording;

  const record = async () => {
    if (!preview || paid === null) return;
    setRecording(true);
    try {
      await payoutsApi.record({
        period: preview.period,
        amount: fromUnits(paid),
        admin_note: note.trim() || undefined,
      });
      toast.success(`Payout for ${monthName(preview.period)} recorded.`);
      setConfirming(false);
      setAmount("");
      setNote("");
      await Promise.all([loadPreview(preview.period), loadBatches()]);
    } catch (error) {
      // Nothing was recorded: the server writes the batch and its event in
      // one transaction or not at all.
      toast.error(parseApiError(error, "The payout was not recorded.").message);
      setConfirming(false);
      await loadPreview(preview.period);
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy shadow-lg">
          <Banknote className="h-5 w-5 text-gold" />
        </div>
        <div>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-navy">
            Deriv payouts
          </h1>
          <p className="m-0 text-sm text-navy-3">
            Record what Deriv paid for a month. That pays partners their
            commission on that month’s trades.
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-gold/20 bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-4 border-b border-gray-100 px-5 py-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-3">
              Month
            </span>
            <input
              type="month"
              value={period}
              max={lastEndedMonth()}
              onChange={(event) => setPeriod(event.target.value)}
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-navy outline-none focus:border-gold"
            />
          </label>
          <p className="m-0 pb-2 text-xs text-navy-3">
            Months are UTC, as trades are stamped. A month can be recorded
            once it has ended.
          </p>
        </div>

        <div className="p-5">
          {previewLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
            </div>
          ) : previewError ? (
            <Notice tone="error">{previewError}</Notice>
          ) : preview === null ? (
            <p className="m-0 text-sm text-navy-3">Choose a month.</p>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Figure
                  label="Markup recorded"
                  value={`${formatAmount(preview.expected_markup)} ${preview.currency}`}
                  hint={`on ${preview.trades.toLocaleString("en-US")} trade${preview.trades === 1 ? "" : "s"}`}
                />
                <Figure
                  label="Commission waiting"
                  value={`${formatAmount(preview.commission_waiting)} ${preview.currency}`}
                  hint={`${preview.commission_waiting_recipients.toLocaleString("en-US")} partner${preview.commission_waiting_recipients === 1 ? "" : "s"}`}
                />
                <Figure
                  label="Commission already paid"
                  value={`${formatAmount(preview.commission_already_paid)} ${preview.currency}`}
                  hint="for this month"
                />
                <Figure
                  label="Month"
                  value={monthName(preview.period)}
                  hint={preview.period_ended ? "ended" : "still running"}
                />
              </div>

              {preview.recorded ? (
                <RecordedBatch batch={preview.recorded} />
              ) : !preview.period_ended ? (
                <Notice tone="info">
                  {monthName(preview.period)} has not ended. Its trades are
                  still adding to the markup above, so its payout cannot be
                  recorded yet.
                </Notice>
              ) : inconsistent ? (
                <Notice tone="error">
                  Commission is waiting on this month, but no markup is
                  recorded for it in {preview.currency}. The two should agree.
                  Nothing can be recorded until that is looked into.
                </Notice>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-3">
                        Deriv paid ({preview.currency})
                      </span>
                      <input
                        inputMode="decimal"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        placeholder="0.00"
                        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm tabular-nums text-navy outline-none focus:border-gold"
                      />
                      <span className="mt-1 block text-xs text-navy-3">
                        The markup payment Deriv made to FXNOD for this month,
                        from Deriv’s own statement.
                      </span>
                      {amount.trim() !== "" && paid === null && (
                        <span className="mt-1 block text-xs text-red-700">
                          Enter an amount, with at most eight decimal places.
                        </span>
                      )}
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-3">
                        Note (optional)
                      </span>
                      <input
                        value={note}
                        maxLength={500}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Deriv statement reference"
                        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-navy outline-none focus:border-gold"
                      />
                    </label>
                  </div>

                  {share !== null && toPartners !== null && (
                    <div
                      className={`rounded-xl border px-4 py-3 text-sm ${
                        short
                          ? "border-amber-200 bg-amber-50 text-amber-900"
                          : "border-green-200 bg-green-50 text-green-900"
                      }`}
                    >
                      <p className="m-0 font-semibold">
                        {short
                          ? `This covers ${formatShare(share)} of the markup recorded.`
                          : "This covers all of the markup recorded."}
                      </p>
                      <p className="m-0 mt-1">
                        Partners will be paid about{" "}
                        <strong className="tabular-nums">
                          {formatAmount(fromUnits(toPartners))} {preview.currency}
                        </strong>{" "}
                        of the {formatAmount(preview.commission_waiting)}{" "}
                        {preview.currency} waiting
                        {short
                          ? `: each commission ${formatShare(share)} of what it accrued. The rest is not paid later.`
                          : ", in full."}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={!canRecord}
                    onClick={() => setConfirming(true)}
                    className="h-10 rounded-lg bg-navy px-5 text-sm font-semibold text-white transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Record payout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gold/20 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="m-0 text-sm font-bold uppercase tracking-wide text-navy-3">
            Recorded payouts
          </h2>
        </div>
        {batchesError ? (
          <div className="p-5">
            <Notice tone="error">{batchesError}</Notice>
          </div>
        ) : batches === null ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </div>
        ) : batches.length === 0 ? (
          <p className="m-0 px-5 py-8 text-center text-sm text-navy-3">
            No payout has been recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50 text-left">
                  <Th>Month</Th>
                  <Th align="right">Deriv paid</Th>
                  <Th align="right">Markup recorded</Th>
                  <Th align="right">Share paid</Th>
                  <Th align="right">Commission paid</Th>
                  <Th>Status</Th>
                  <Th>Recorded</Th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr
                    key={batch.id}
                    className="border-b border-gray-50 last:border-b-0"
                  >
                    <Td className="whitespace-nowrap font-medium text-navy">
                      {monthName(batch.period)}
                    </Td>
                    <Td align="right" className="tabular-nums">
                      {formatAmount(batch.amount)} {batch.currency}
                    </Td>
                    <Td align="right" className="tabular-nums text-navy-3">
                      {batch.expected_markup === null
                        ? "not measured"
                        : formatAmount(batch.expected_markup)}
                    </Td>
                    <Td align="right" className="tabular-nums">
                      {batchShare(batch)}
                    </Td>
                    <Td align="right" className="tabular-nums">
                      {batch.commission_paid === null ? (
                        <span className="text-navy-3">—</span>
                      ) : (
                        <>
                          {formatAmount(batch.commission_paid)}
                          <span className="block text-xs text-navy-3">
                            of {formatAmount(batch.commission_accrued)} accrued,{" "}
                            {batch.commissions_settled ?? 0} commission
                            {batch.commissions_settled === 1 ? "" : "s"}
                          </span>
                        </>
                      )}
                    </Td>
                    <Td>
                      <StatusPill status={batch.status} />
                    </Td>
                    <Td className="whitespace-nowrap text-navy-3">
                      {new Date(batch.created_at).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {batch.admin_note && (
                        <span className="block max-w-[16rem] truncate text-xs" title={batch.admin_note}>
                          {batch.admin_note}
                        </span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {confirming && preview && paid !== null && share !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-payout-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="confirm-payout-title" className="m-0 text-xl font-bold text-navy">
              Record this payout?
            </h2>
            <dl className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
              <Row label="Month" value={monthName(preview.period)} />
              <Row
                label="Deriv paid"
                value={`${formatAmount(fromUnits(paid))} ${preview.currency}`}
              />
              <Row
                label="Markup recorded"
                value={`${formatAmount(preview.expected_markup)} ${preview.currency}`}
              />
              <Row label="Commission is paid at" value={formatShare(share)} />
              <Row
                label="To partners, about"
                value={`${formatAmount(fromUnits(toPartners ?? BigInt(0)))} ${preview.currency}`}
              />
            </dl>
            <p className="mt-4 text-sm text-slate-600">
              {preview.commission_waiting_recipients.toLocaleString("en-US")}{" "}
              partner wallet
              {preview.commission_waiting_recipients === 1 ? " is" : "s are"}{" "}
              credited straight away. This settles {monthName(preview.period)}{" "}
              for good: it cannot be changed, undone or recorded again.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={recording}
                onClick={() => setConfirming(false)}
                className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-medium text-navy hover:bg-gray-50 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={recording}
                onClick={record}
                className="flex h-10 items-center gap-2 rounded-lg bg-navy px-5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60"
              >
                {recording && <Loader2 className="h-4 w-4 animate-spin" />}
                Record payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** The share a recorded batch paid. A batch from before payouts were measured
 *  has none, and paid in full. */
function batchShare(batch: PayoutBatch): string {
  if (batch.settlement_ratio === null) return "in full";
  const share = toUnits(batch.settlement_ratio);
  return share === null ? "—" : formatShare(share);
}

function RecordedBatch({ batch }: { batch: PayoutBatch }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="m-0 font-semibold">
          The payout for {monthName(batch.period)} is recorded:{" "}
          <span className="tabular-nums">
            {formatAmount(batch.amount)} {batch.currency}
          </span>
          .
        </p>
        <p className="m-0 mt-1">
          Commission was paid at {batchShare(batch)}
          {batch.status === "settled"
            ? batch.commission_paid !== null
              ? `: ${formatAmount(batch.commission_paid)} ${batch.currency} to partners.`
              : "."
            : ". Partner wallets are being credited now."}{" "}
          A month is settled once and cannot be recorded again.
        </p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: PayoutBatch["status"] }) {
  const settled = status === "settled";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        settled ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
      }`}
    >
      {!settled && <Loader2 className="h-3 w-3 animate-spin" />}
      {settled ? "Settled" : "Paying partners"}
    </span>
  );
}

function Figure({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-gold/20 bg-white p-4">
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-navy-3">
        {label}
      </p>
      <p className="m-0 mt-2 break-words text-lg font-bold tabular-nums text-navy">
        {value}
      </p>
      <p className="m-0 mt-1 text-xs text-navy-3">{hint}</p>
    </div>
  );
}

function Notice({ tone, children }: { tone: "error" | "info"; children: React.ReactNode }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="m-0">{children}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="m-0 text-right font-semibold tabular-nums text-navy">{value}</dd>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-navy-3 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
  className = "",
}: {
  children: React.ReactNode;
  align?: "right";
  className?: string;
}) {
  return (
    <td className={`px-5 py-3 align-top ${align === "right" ? "text-right" : ""} ${className}`}>
      {children}
    </td>
  );
}
