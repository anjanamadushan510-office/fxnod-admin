import { api } from "./api";
import type { UserPublic } from "./authApi";

export const adminApi = {
  login: async (credentials: { email: string; password: string; totp_code?: string }) => {
    // We explicitly call the admin login endpoint
    // It will set the fxnod_admin_refresh httpOnly cookie
    const res = await api.post("/api/v1/auth/admin/login", credentials);
    return res.data;
  },
  logout: async () => {
    const res = await api.post("/api/v1/auth/admin/logout");
    return res.data;
  },
  getUsers: async () => {
    const res = await api.get<UserPublic[]>("/api/v1/admin/users");
    return res.data;
  },
  me: async () => {
    const res = await api.get<UserPublic>("/api/v1/auth/admin/me");
    return res.data;
  },
  getManualDeposits: async () => {
    const res = await api.get("/api/v1/admin/deposits/manual");
    return res.data;
  },
  /**
   * Approve a manual deposit claim and credit the wallet.
   *
   * `verifiedAmount` is what the reviewer actually saw on chain. Omitting it
   * credits the amount the USER typed, which nobody has checked — so the
   * console always asks for it, and leaving it blank is a deliberate choice
   * recorded against the reviewer.
   */
  approveManualDeposit: async (
    id: string,
    payload?: { note?: string; verifiedAmount?: string },
  ) => {
    const res = await api.post(`/api/v1/admin/deposits/manual/${id}/approve`, {
      admin_note: payload?.note,
      verified_amount: payload?.verifiedAmount || undefined,
    });
    return res.data;
  },
  rejectManualDeposit: async (id: string, note?: string) => {
    const res = await api.post(`/api/v1/admin/deposits/manual/${id}/reject`, { admin_note: note });
    return res.data;
  },
  getBlogs: async () => {
    const res = await api.get("/api/v1/admin/blogs");
    return res.data;
  },
  getBlog: async (id: string) => {
    const res = await api.get(`/api/v1/admin/blogs/${id}`);
    return res.data;
  },
  createBlog: async (data: FormData) => {
    const res = await api.post("/api/v1/admin/blogs", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  updateBlog: async (id: string, data: FormData) => {
    const res = await api.put(`/api/v1/admin/blogs/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  deleteBlog: async (id: string) => {
    const res = await api.delete(`/api/v1/admin/blogs/${id}`);
    return res.data;
  },
  toggleBlogVisibility: async (id: string) => {
    const res = await api.patch(`/api/v1/admin/blogs/${id}/visibility`);
    return res.data;
  },
  getTickets: async () => {
    const res = await api.get("/api/v1/admin/tickets/");
    return res.data;
  },
  updateTicketStatus: async (id: string, status: string) => {
    const res = await api.patch(`/api/v1/admin/tickets/${id}`, { status });
    return res.data;
  },
};

/**
 * Subscriptions — read-only.
 *
 * There is no grant or revoke here because the API has no such route. Whatever
 * would authorise one becomes a way to mint free access remotely, so that stays
 * a deliberate act on a host shell (`python -m app.subscription_cli`). The
 * console shows what is true; it does not change it.
 */
export interface AdminSubscriptionRow {
  user_id: string;
  subscription_id: string;
  product: string;
  status: string;
  current_plan_id: string;
  /** The COMPUTED answer, from the same function the trading engine uses.
   *  Read this rather than `status`, which can say "active" past its expiry. */
  entitled: boolean;
  reason: string;
  started_at: string;
  expires_at: string | null;
  is_lifetime: boolean;
  /** Decimal string. "0" for a granted subscription — nobody paid for it. */
  paid_total: string;
  purchase_count: number;
  last_purchase_at: string | null;
}

export interface AdminSubscriptionPurchase {
  purchase_id: string;
  plan_id: string;
  price_usd: string;
  currency: string;
  granted_days: number | null;
  expires_at_after: string | null;
  wallet_transaction_id: string;
  created_at: string;
}

export interface AdminSubscriptionSummary {
  product: string;
  entitled_count: number;
  lifetime_count: number;
  expired_count: number;
  cancelled_count: number;
  /** Entitled with no purchase behind it — comped or seeded. */
  granted_count: number;
  total_revenue: string;
  revenue_by_plan: { plan_id: string; purchase_count: number; revenue: string }[];
  expiring_within_7_days: number;
}

export type SubscriptionFilterState = "all" | "entitled" | "expired" | "cancelled";

export const subscriptionsApi = {
  summary: async (product = "dbot") => {
    const res = await api.get<AdminSubscriptionSummary>(
      "/api/v1/admin/subscriptions/summary",
      { params: { product } },
    );
    return res.data;
  },
  list: async (params: {
    product?: string;
    state?: SubscriptionFilterState;
    user_id?: string;
    limit?: number;
    offset?: number;
  }) => {
    const res = await api.get<{ items: AdminSubscriptionRow[]; total: number }>(
      "/api/v1/admin/subscriptions",
      { params: { product: "dbot", ...params } },
    );
    return res.data;
  },
  detail: async (userId: string, product = "dbot") => {
    const res = await api.get<{
      user_id: string;
      subscription: AdminSubscriptionRow | null;
      purchases: AdminSubscriptionPurchase[];
    }>(`/api/v1/admin/subscriptions/${userId}`, { params: { product } });
    return res.data;
  },
};

/**
 * Deriv payouts — the one screen that pays partners.
 *
 * Trade-markup commission is accrued trade by trade and paid when Deriv's
 * monthly markup payout is recorded here. The operator states what Deriv paid
 * and nothing else: the server measures it against the markup the trading
 * engine recorded for the month and pays every commission the same share.
 * There is deliberately no field for that share.
 *
 * Amounts are decimal strings, as the API sends them. Do not parse them into
 * numbers to do arithmetic; see `lib/decimal.ts`.
 */
export type PayoutBatchStatus = "recorded" | "settling" | "settled";

export interface PayoutBatch {
  id: string;
  /** YYYY-MM. */
  period: string;
  source: string;
  amount: string;
  currency: string;
  status: PayoutBatchStatus;
  admin_note: string | null;
  /** What the amount was measured against. Null on a batch from before the
   *  measure existed, which paid in full. */
  expected_markup: string | null;
  /** 0 to 1. Null means paid in full. */
  settlement_ratio: string | null;
  recorded_by: string | null;
  /** Filled in once the month has been settled. */
  commissions_settled: number | null;
  commission_accrued: string | null;
  commission_paid: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutPreview {
  period: string;
  currency: string;
  /** False while the month is still running (UTC). */
  period_ended: boolean;
  expected_markup: string;
  trades: number;
  commission_waiting: string;
  commission_waiting_rows: number;
  commission_waiting_recipients: number;
  commission_already_paid: string;
  recorded: PayoutBatch | null;
}

export const payoutsApi = {
  list: async () => {
    const res = await api.get<PayoutBatch[]>("/api/v1/admin/payouts");
    return res.data;
  },
  preview: async (period: string) => {
    const res = await api.get<PayoutPreview>(
      "/api/v1/admin/payouts/deriv/preview",
      { params: { period } },
    );
    return res.data;
  },
  record: async (payload: { period: string; amount: string; admin_note?: string }) => {
    const res = await api.post<PayoutBatch>("/api/v1/admin/payouts/deriv", payload);
    return res.data;
  },
};
