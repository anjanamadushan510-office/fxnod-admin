"use client";
import { useState } from "react";
import { Check, Clock3, Loader2, X } from "lucide-react";
import type { AdminCatalog, Entity, Row } from "@/services/commerceApi";

export const defaults: Record<Entity, Row> = {
  tools: {
    id: "",
    name: "",
    subtitle: "",
    description: "",
    href: null,
    badges: [],
    status: "draft",
    sort_order: 0,
  },
  tiers: {
    id: "",
    tool_id: "",
    name: "",
    rank: 0,
    features: [],
    capabilities: [],
    is_free: false,
    is_active: true,
  },
  offers: {
    id: "",
    name: "",
    description: "",
    tier_ids: [],
    months: 1,
    days: null,
    price: "0",
    compare_at: null,
    is_active: false,
    featured: false,
    sort_order: 0,
  },
  coupons: {
    code: "",
    kind: "percent",
    value: "10",
    min_spend: "0",
    offer_ids: [],
    starts_at: null,
    ends_at: null,
    max_uses: null,
    per_user_limit: 1,
    is_active: false,
  },
};
const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-600 disabled:opacity-50";
const str = (v: unknown) => (v == null ? "" : String(v));
const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
const labels: Record<Entity, string> = {
  tools: "tool",
  tiers: "plan",
  offers: "offer",
  coupons: "coupon",
};

export function CommerceEditor({
  kind,
  initial,
  existing,
  catalog,
  busy,
  error,
  onSave,
  onClose,
}: {
  kind: Entity;
  initial: Row;
  existing: boolean;
  catalog: AdminCatalog;
  busy: boolean;
  error: string;
  onSave: (row: Row) => void;
  onClose: () => void;
}) {
  const [row, setRow] = useState<Row>(initial);
  const set = (key: string, value: unknown) =>
    setRow((r) => ({ ...r, [key]: value }));
  const field = (
    key: string,
    label: string,
    type = "text",
    required = false,
    help?: string,
  ) => (
    <label className="block text-xs text-slate-600" key={key}>
      {label}
      <input
        className={inputClass}
        type={type}
        value={str(row[key])}
        required={required}
        disabled={
          busy ||
          (existing &&
            (key === "id" ||
              key === "code" ||
              (kind === "tiers" && key === "rank")))
        }
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "any" : undefined}
        onChange={(e) =>
          set(
            key,
            [
              "rank",
              "sort_order",
              "max_uses",
              "per_user_limit",
              "months",
              "days",
            ].includes(key)
              ? e.target.value === ""
                ? null
                : Number(e.target.value)
              : e.target.value ||
                  (["href", "compare_at"].includes(key) ? null : ""),
          )
        }
      />
      {help && (
        <span className="mt-1 block text-[11px] text-slate-500">{help}</span>
      )}
    </label>
  );
  const textArea = (key: string, label: string, lines = false) => (
    <label className="block text-xs text-slate-600">
      {label}
      <textarea
        rows={3}
        className={inputClass}
        value={lines ? list(row[key]).join("\n") : str(row[key])}
        onChange={(e) =>
          set(key, lines ? e.target.value.split("\n") : e.target.value)
        }
      />
    </label>
  );
  const check = (key: string, label: string) => (
    <label className="flex items-center gap-3 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={!!row[key]}
        onChange={(e) => set(key, e.target.checked)}
        className="h-4 w-4 accent-amber-400"
      />
      {label}
    </label>
  );
  const select = (
    key: string,
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <label className="block text-xs text-slate-600">
      {label}
      <select
        className={inputClass}
        required
        disabled={existing && kind === "tiers" && key === "tool_id"}
        value={str(row[key])}
        onChange={(e) => set(key, e.target.value)}
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
  const choices = (key: string, options: { id: string; name: string }[]) => (
    <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
      {options.map((o) => (
        <label key={o.id} className="flex gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={list(row[key]).includes(o.id)}
            onChange={(e) =>
              set(
                key,
                e.target.checked
                  ? [...list(row[key]), o.id]
                  : list(row[key]).filter((id) => id !== o.id),
              )
            }
            className="accent-amber-400"
          />
          {o.name}
        </label>
      ))}
      {!options.length && (
        <p className="text-xs text-slate-500">Create plans first.</p>
      )}
    </div>
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const clean = { ...row };
        for (const key of ["badges", "features", "capabilities"])
          if (Array.isArray(clean[key]))
            clean[key] = list(clean[key])
              .map((s) => s.trim())
              .filter(Boolean);
        onSave(clean);
      }}
      className="rounded-2xl border border-slate-300 bg-white p-5 xl:sticky xl:top-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">
          {existing ? "Edit" : "New"} {labels[kind]}
        </h2>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label="Close editor"
          className="p-1 text-amber-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <fieldset disabled={busy} className="space-y-4">
        {field(
          kind === "coupons" ? "code" : "id",
          kind === "coupons" ? "Coupon code" : "Permanent ID",
          "text",
          true,
          "Use a unique code. IDs cannot be changed after saving.",
        )}
        {kind !== "coupons" && field("name", "Display name", "text", true)}
        {kind === "tools" && (
          <>
            {field("subtitle", "Platform / category")}
            {textArea("description", "Description")}
            {field(
              "href",
              "Tool path",
              "text",
              false,
              "Example: /dbot. Use a local application path.",
            )}
            {textArea("badges", "Compatibility labels · one per line", true)}
            {select(
              "status",
              "Visibility",
              ["draft", "published", "coming_soon", "archived"].map((v) => ({
                value: v,
                label: v.replace("_", " "),
              })),
            )}
            {field("sort_order", "Display order", "number")}
          </>
        )}
        {kind === "tiers" && (
          <>
            {select(
              "tool_id",
              "Tool",
              catalog.tools.map((t) => ({
                value: str(t.id),
                label: str(t.name),
              })),
            )}
            {field(
              "rank",
              "Plan level",
              "number",
              true,
              "Higher levels are upgrades; for example, 0 for Basic and 10 for Pro.",
            )}
            {textArea(
              "features",
              "Customer-facing features · one per line",
              true,
            )}
            {textArea(
              "capabilities",
              "Access capabilities · one per line",
              true,
            )}
            <p className="text-[11px] leading-5 text-slate-500">
              Built-in capabilities: bot_demo, bot_real, manual_trade. A new
              capability must also be enforced by its tool service.
            </p>
            <p className="text-xs text-slate-600">
              Every plan needs a pricing offer. Temporary access is a $0 offer
              with an expiry.
            </p>
            {check("is_active", "Plan is available")}
          </>
        )}
        {kind === "offers" && (
          <>
            {textArea("description", "Offer description")}
            <p className="text-xs text-slate-600">
              Included plans · one per tool. Multiple tools create a bundle.
            </p>
            {choices(
              "tier_ids",
              catalog.tiers.map((t) => ({
                id: str(t.id),
                name: `${catalog.tools.find((tool) => tool.id === t.tool_id)?.name ?? t.tool_id} · ${t.name}`,
              })),
            )}
            <label className="block text-xs text-slate-600">
              Access period
              <select
                className={inputClass}
                value={
                  row.days ? "days" : row.months ? str(row.months) : "lifetime"
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setRow((r) => ({
                    ...r,
                    months: v === "lifetime" || v === "days" ? null : Number(v),
                    days: v === "days" ? 30 : null,
                  }));
                }}
              >
                {[1, 6, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} month{n > 1 ? "s" : ""}
                  </option>
                ))}
                {row.months && ![1, 6, 12].includes(Number(row.months)) ? (
                  <option value={str(row.months)}>
                    {str(row.months)} months
                  </option>
                ) : null}
                <option value="lifetime">Lifetime</option>
                <option value="days">Custom days / temporary access</option>
              </select>
            </label>
            {!!row.days && field("days", "Number of days", "number", true)}
            {field(
              "price",
              "Sale price · USDT",
              "number",
              true,
              "Amount charged before coupons. $0 requires a limited period and can be activated once per customer.",
            )}
            {field(
              "compare_at",
              "Regular price · USDT (optional)",
              "number",
              false,
              "Must be at least the sale price. A higher price appears crossed out.",
            )}
            {field("sort_order", "Display order", "number")}
            {check("featured", "Recommended offer")}
            {check("is_active", "Publish offer")}
            <p className="text-[11px] leading-5 text-slate-500">
              Single payment. No automatic renewal. Purchased access survives
              later catalog edits. New benefits apply to future purchases.
            </p>
          </>
        )}
        {kind === "coupons" && (
          <>
            {select("kind", "Discount type", [
              { value: "percent", label: "Percentage" },
              { value: "fixed", label: "Fixed USDT amount" },
            ])}
            {field(
              "value",
              row.kind === "percent"
                ? "Discount percent"
                : "Discount amount · USDT",
              "number",
              true,
            )}
            {field("min_spend", "Minimum spend · USDT", "number")}
            {field(
              "max_uses",
              "Total redemption limit",
              "number",
              false,
              "Leave empty for unlimited redemptions.",
            )}
            {field(
              "per_user_limit",
              "Redemptions per customer",
              "number",
              true,
            )}
            {["starts_at", "ends_at"].map((key) => (
              <label key={key} className="block text-xs text-slate-600">
                {key === "starts_at" ? "Starts at (UTC)" : "Ends at (UTC)"}
                <input
                  className={inputClass}
                  type="datetime-local"
                  value={
                    row[key]
                      ? new Date(str(row[key])).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    set(
                      key,
                      e.target.value
                        ? new Date(`${e.target.value}Z`).toISOString()
                        : null,
                    )
                  }
                />
              </label>
            ))}
            <p className="text-xs text-slate-600">
              Eligible offers · leave empty for all offers
            </p>
            {choices(
              "offer_ids",
              catalog.offers.map((o) => ({ id: str(o.id), name: str(o.name) })),
            )}
            {check("is_active", "Enable coupon")}
          </>
        )}
      </fieldset>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-500/10 p-3 text-xs text-red-700"
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {busy ? "Saving…" : "Save changes"}
      </button>
      <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-500">
        <Clock3 className="h-3 w-3" />
        Changes are recorded in Activity
      </p>
    </form>
  );
}
