"use client";
import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  CircleDollarSign,
  Layers3,
  Plus,
  Search,
  TicketPercent,
} from "lucide-react";
import { toast } from "sonner";
import {
  commerceApi,
  errorMessage,
  type Entity,
  type Row,
} from "@/services/commerceApi";
import { CommerceEditor, defaults } from "@/components/admin/CommerceEditor";

type Tab = Entity | "orders" | "audit";
const tabs: { id: Tab; label: string }[] = [
  { id: "tools", label: "Tools" },
  { id: "tiers", label: "Plans" },
  { id: "offers", label: "Offers & bundles" },
  { id: "coupons", label: "Coupons" },
  { id: "orders", label: "Orders" },
  { id: "audit", label: "Activity" },
];
const labels: Record<Entity, string> = {
  tools: "tool",
  tiers: "plan",
  offers: "offer",
  coupons: "coupon",
};
const str = (value: unknown) => (value == null ? "" : String(value));
const list = (value: unknown) =>
  Array.isArray(value) ? value.map(String) : [];
const amount = (value: unknown) =>
  `${Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} USDT`;
const duration = (row: Row) =>
  row.months
    ? `${row.months} months`
    : row.days
      ? `${row.days} days`
      : "Lifetime";

export default function CommercePage() {
  const client = useQueryClient();
  const catalog = useQuery({
    queryKey: ["admin-commerce"],
    queryFn: commerceApi.catalog,
  });
  const [tab, setTab] = useState<Tab>("tools");
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const orders = useQuery({
    queryKey: ["admin-commerce-orders", offset],
    queryFn: () => commerceApi.orders(offset),
  });
  const audit = useQuery({
    queryKey: ["admin-commerce-audit", offset],
    queryFn: () => commerceApi.audit(offset),
    enabled: tab === "audit",
  });
  const [editor, setEditor] = useState<{
    kind: Entity;
    row: Row;
    existing: boolean;
  } | null>(null);
  const save = useMutation({
    mutationFn: ({ kind, row }: { kind: Entity; row: Row }) =>
      commerceApi.save(kind, row),
    onSuccess: () => {
      toast.success("Changes saved");
      setEditor(null);
      void client.invalidateQueries({ queryKey: ["admin-commerce"] });
      void client.invalidateQueries({ queryKey: ["admin-commerce-audit"] });
    },
  });
  const editing = tab !== "orders" && tab !== "audit";
  const records = editing
    ? (catalog.data?.[tab as Entity] ?? [])
    : tab === "orders"
      ? (orders.data?.items ?? [])
      : (audit.data?.items ?? []);
  const visible = records.filter((row) =>
    [row.name, row.id, row.code, row.user_id, row.entity, row.entity_id]
      .map(str)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const open = (kind: Entity, row?: Row) => {
    save.reset();
    setEditor({
      kind,
      row: row
        ? Object.fromEntries(
            Object.keys(defaults[kind]).map((k) => [
              k,
              k in row ? row[k] : defaults[kind][k],
            ]),
          )
        : { ...defaults[kind] },
      existing: !!row,
    });
  };
  return (
    <div className="mx-auto max-w-[1440px] space-y-7 p-5 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-700">
            COMMERCE CONTROL
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Tools & memberships
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Build plans, set prices and publish offers from one catalog.
          </p>
        </div>
        {editing && (
          <button
            onClick={() => open(tab as Entity)}
            className="flex items-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-semibold text-slate-900"
          >
            <Plus className="h-4 w-4" />
            New {labels[tab as Entity]}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "Published tools",
            value:
              catalog.data?.tools.filter((t) => t.status === "published")
                .length ?? 0,
            icon: Boxes,
          },
          {
            label: "Live offers",
            value: catalog.data?.offers.filter((o) => o.is_active).length ?? 0,
            icon: Layers3,
          },
          {
            label: "Enabled coupons",
            value: catalog.data?.coupons.filter((c) => c.is_active).length ?? 0,
            icon: TicketPercent,
          },
          {
            label: "Marketplace revenue",
            value: orders.isError
              ? "Unavailable"
              : amount(orders.data?.revenue),
            icon: CircleDollarSign,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <Icon className="h-4 w-4 text-amber-700" />
            <p className="mt-3 text-xs text-slate-600">{label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setQuery("");
              setOffset(0);
              setEditor(null);
            }}
            className={`border-b-2 px-4 py-3 text-sm font-medium ${tab === t.id ? "border-gold text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {(catalog.isError ||
        (tab === "orders" && orders.isError) ||
        (tab === "audit" && audit.isError)) && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700"
        >
          Could not load commerce data.{" "}
          <button
            onClick={() => {
              void catalog.refetch();
              void orders.refetch();
              if (tab === "audit") void audit.refetch();
            }}
            className="underline"
          >
            Retry
          </button>
        </div>
      )}
      <div
        className={
          editor ? "grid items-start gap-6 xl:grid-cols-[1fr_440px]" : ""
        }
      >
        <div className="min-w-0">
          <label className="relative mb-4 block">
            <span className="sr-only">Search {tab}</span>
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-amber-600"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={editing ? `Search ${tab}…` : "Search this page…"}
            />
          </label>
          {catalog.isLoading ||
          (tab === "audit" && audit.isLoading) ||
          (tab === "orders" && orders.isLoading) ? (
            <p className="p-6 text-sm text-slate-600">Loading…</p>
          ) : (
            <div className="space-y-3">
              {visible.map((row, index) => (
                <article
                  key={str(row.id ?? row.code ?? index)}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="break-words font-semibold text-slate-900">
                        {str(
                          row.name ??
                            row.code ??
                            (tab === "orders"
                              ? (row.snapshot as { offer?: Row })?.offer?.name
                              : null) ??
                            row.entity_id,
                        )}
                      </h2>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {str(row.id ?? row.entity)}
                        {tab === "tiers" &&
                          ` · ${catalog.data?.tools.find((t) => t.id === row.tool_id)?.name ?? row.tool_id}`}
                      </p>
                    </div>
                    {editing && (
                      <button
                        onClick={() => open(tab as Entity, row)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 hover:bg-amber-50"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {tab === "tools" && (
                    <>
                      <p className="mt-3 text-sm text-slate-600">
                        {str(row.description)}
                      </p>
                      <Badge>{str(row.status).replace("_", " ")}</Badge>
                      <span className="ml-3 text-xs text-slate-500">
                        {
                          catalog.data?.tiers.filter(
                            (t) => t.tool_id === row.id,
                          ).length
                        }{" "}
                        plans
                      </span>
                    </>
                  )}
                  {tab === "tiers" && (
                    <>
                      <Badge>
                        Plan checkout required ·{" "}
                        {row.is_active ? "Active" : "Retired"}
                      </Badge>
                      <p className="mt-3 text-xs text-slate-600">
                        {Number(row.team_seats) > 0 && (
                          <strong>
                            Team · {Number(row.team_seats)} additional members ·{" "}
                          </strong>
                        )}
                        {list(row.features).join(" · ")}
                      </p>
                    </>
                  )}
                  {tab === "offers" && (
                    <>
                      <div className="mt-3 flex flex-wrap items-baseline gap-3">
                        <strong className="text-lg text-slate-900">
                          {amount(row.price)}
                        </strong>
                        {Number(row.compare_at) > Number(row.price) && (
                          <span className="text-xs text-slate-500 line-through">
                            {amount(row.compare_at)}
                          </span>
                        )}
                        <span className="text-xs text-slate-600">
                          {duration(row)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">
                        {list(row.tier_ids)
                          .map((id) => {
                            const t = catalog.data?.tiers.find(
                              (t) => t.id === id,
                            );
                            return `${catalog.data?.tools.find((tool) => tool.id === t?.tool_id)?.name ?? id} / ${t?.name ?? ""}`;
                          })
                          .join(" + ")}
                      </p>
                      <Badge>
                        {row.is_active ? "Published" : "Draft / retired"}
                        {list(row.tier_ids).length > 1 ? " · Bundle" : ""}
                      </Badge>
                    </>
                  )}
                  {tab === "coupons" && (
                    <>
                      <p className="mt-3 text-lg font-semibold text-slate-900">
                        {row.kind === "percent"
                          ? `${row.value}% off`
                          : `${amount(row.value)} off`}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {str(row.used)} /{" "}
                        {row.max_uses ? str(row.max_uses) : "unlimited"}{" "}
                        redemptions · {str(row.per_user_limit)} per customer
                      </p>
                      <Badge>{row.is_active ? "Enabled" : "Disabled"}</Badge>
                      <span className="ml-3 text-xs text-slate-500">
                        {list(row.offer_ids).length
                          ? `${list(row.offer_ids).length} selected offers`
                          : "All offers"}
                      </span>
                      {!!row.ends_at && (
                        <p className="mt-2 text-xs text-slate-500">
                          Ends {new Date(str(row.ends_at)).toLocaleString()}
                        </p>
                      )}
                    </>
                  )}
                  {tab === "orders" && (
                    <>
                      <p className="mt-3 font-semibold text-slate-900">
                        {amount(row.total)}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-600">
                        Customer {str(row.user_id)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(str(row.created_at)).toLocaleString()}
                        {row.coupon_code
                          ? ` · ${row.coupon_code} · saved ${amount(row.discount)}`
                          : ""}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        Wallet transaction:{" "}
                        {str(row.wallet_transaction_id) || "No charge"}
                      </p>
                    </>
                  )}
                  {tab === "audit" && (
                    <>
                      <p className="mt-3 text-xs text-slate-600">
                        {row.before ? "Updated" : "Created"} {str(row.entity)} ·{" "}
                        {new Date(str(row.created_at)).toLocaleString()}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        By {str(row.actor_id)}
                      </p>
                      <details className="mt-3 text-xs text-slate-600">
                        <summary className="cursor-pointer">
                          View change
                        </summary>
                        <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-3">
                          {JSON.stringify(
                            { before: row.before, after: row.after },
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    </>
                  )}
                </article>
              ))}
              {!visible.length && (
                <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                  No {tab} to show.
                </div>
              )}
            </div>
          )}
          {!editing && (
            <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
              <span>
                {tab === "orders"
                  ? (orders.data?.total ?? 0)
                  : (audit.data?.total ?? 0)}{" "}
                records
              </span>
              <div className="flex gap-4">
                <button
                  disabled={!offset}
                  onClick={() => setOffset(Math.max(0, offset - 25))}
                  className="disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  disabled={
                    offset + 25 >=
                    (tab === "orders"
                      ? (orders.data?.total ?? 0)
                      : (audit.data?.total ?? 0))
                  }
                  onClick={() => setOffset(offset + 25)}
                  className="disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        {editor && catalog.data && (
          <CommerceEditor
            key={`${editor.kind}-${str(editor.row.id ?? editor.row.code)}`}
            kind={editor.kind}
            initial={editor.row}
            existing={editor.existing}
            catalog={catalog.data}
            busy={save.isPending}
            error={save.isError ? errorMessage(save.error) : ""}
            onClose={() => setEditor(null)}
            onSave={(row) => save.mutate({ kind: editor.kind, row })}
          />
        )}
      </div>
    </div>
  );
}
function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="mt-3 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-slate-900">
      {children}
    </span>
  );
}
