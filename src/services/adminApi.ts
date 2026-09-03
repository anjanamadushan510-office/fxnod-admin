import { api } from "./api";
import type { UserPublic } from "./authApi";

export const adminApi = {
  login: async (credentials: { email: string; password: string }) => {
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
  updateUserAccess: async (userId: string, payload: { dbot_access_status: string }) => {
    const res = await api.patch<UserPublic>(`/api/v1/admin/users/${userId}/access`, payload);
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
};
