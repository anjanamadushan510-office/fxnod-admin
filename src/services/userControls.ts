import { api } from "./api";
import type { UserPublic } from "./authApi";
export type Scope =
  | "account"
  | "wallet"
  | "tools"
  | "dtrader"
  | "dbot"
  | "autohub";
export type Restriction = {
  scope: Scope;
  blocked: boolean;
  reason: string;
  updated_at: string;
  updated_by: string;
};
export type Activity = {
  id: string;
  user_id: string;
  email: string | null;
  source: string;
  method: string;
  path: string;
  status_code: number;
  duration_ms: number;
  created_at: string;
};
export type RecordRow = Record<string, string | number | boolean | null>;
export type Inspection = {
  user: UserPublic;
  controls: Restriction[];
  sessions: RecordRow[];
  wallet: {
    available: boolean;
    data?: Record<string, RecordRow[]>;
    error?: string;
  };
  trading: {
    available: boolean;
    data?: Record<string, RecordRow[]>;
    error?: string;
  };
};
export type Audit = {
  id: string;
  actor_email: string;
  action: string;
  reason: string;
  created_at: string;
  after_state: { scope: string; blocked: boolean };
};
export const userControls = {
  directory: async (params: {
    search: string;
    state: string;
    offset: number;
  }) =>
    (
      await api.get<{
        items: (UserPublic & { blocked_scopes: Scope[] })[];
        total: number;
      }>("/api/v1/admin/users/directory", { params: { ...params, limit: 25 } })
    ).data,
  overview: async () =>
    (
      await api.get<{
        users: number;
        inactive: number;
        restricted: number;
        activity: number;
      }>("/api/v1/admin/users/overview")
    ).data,
  inspect: async (id: string, wallet_offset = 0, trading_offset = 0) =>
    (
      await api.get<Inspection>(`/api/v1/admin/users/${id}`, {
        params: { wallet_offset, trading_offset },
      })
    ).data,
  activity: async (params: {
    user_id?: string;
    source: string;
    outcome: string;
    since?: string;
    until?: string;
    offset: number;
  }) =>
    (
      await api.get<{ items: Activity[]; total: number }>(
        "/api/v1/admin/users/activity",
        {
          params: { ...params, source: params.source || undefined, limit: 50 },
        },
      )
    ).data,
  audit: async (id: string, offset = 0) =>
    (
      await api.get<{ items: Audit[]; total: number }>(
        `/api/v1/admin/users/${id}/audit`,
        { params: { offset, limit: 50 } },
      )
    ).data,
  restrict: async (
    id: string,
    scope: Scope,
    blocked: boolean,
    expected_blocked: boolean,
    reason: string,
  ) =>
    (
      await api.put(`/api/v1/admin/users/${id}/controls/${scope}`, {
        blocked,
        expected_blocked,
        reason,
      })
    ).data,
};
