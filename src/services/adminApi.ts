import { api } from "./api";
import type { UserPublic } from "./authApi";

export const adminApi = {
  login: async (credentials: { email: string; password: string }) => {
    // We explicitly call the admin login endpoint
    // It will set the fxnod_admin_refresh httpOnly cookie
    const res = await api.post("/api/v1/auth/admin/login", credentials);
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
};
