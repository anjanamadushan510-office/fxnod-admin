"use client";

import { create } from "zustand";
import { adminApi } from "@/services/adminApi";
import type { UserPublic } from "@/services/authApi";
import {
  registerAuthExpiredHandler,
  setAdminAccessToken,
} from "@/services/authToken";

interface AuthState {
  user: UserPublic | null;
  status: "idle" | "loading" | "authenticated" | "anonymous";
  login: (email: string, password: string, totpCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // When a refresh ultimately fails, the api layer calls this.
  registerAuthExpiredHandler(() => {
    set({ user: null, status: "anonymous" });
  });

  return {
    user: null,
    status: "idle",

    async login(email, password, totpCode) {
      // The form owns its pending state. Switching the session to loading here
      // unmounts it in AdminGuard, hiding errors and preventing a retry.
      // Authenticator apps show "123 456"; the API wants the digits alone.
      const totp_code = totpCode?.replace(/\s+/g, "") || undefined;
      try {
        const { access_token } = await adminApi.login({ email: email.trim(), password, totp_code });
        setAdminAccessToken(access_token);
        const user = await adminApi.me();
        set({ user, status: "authenticated" });
      } catch (error) {
        setAdminAccessToken(null);
        set({ user: null, status: "anonymous" });
        throw error;
      }
    },

    async logout() {
      try {
        await adminApi.logout();
      } catch (err) {
        console.error("Logout error", err);
      } finally {
        setAdminAccessToken(null);
        set({ user: null, status: "anonymous" });
      }
    },

    async bootstrap() {
      set({ status: "loading" });
      try {
        // No access token in memory after a reload → /auth/admin/me 401 → the
        // interceptor refreshes via cookie → retry succeeds if still valid.
        const user = await adminApi.me();
        set({ user, status: "authenticated" });
      } catch {
        setAdminAccessToken(null);
        set({ user: null, status: "anonymous" });
      }
    },
  };
});
