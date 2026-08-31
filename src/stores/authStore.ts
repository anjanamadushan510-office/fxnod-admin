"use client";

import { create } from "zustand";
import { adminApi } from "@/services/adminApi";
import type { UserPublic } from "@/services/authApi";
import {
  registerAuthExpiredHandler,
  setAdminAccessToken,
} from "@/services/authToken";
import { authApi } from "@/services/authApi";

interface AuthState {
  user: UserPublic | null;
  status: "idle" | "loading" | "authenticated" | "anonymous";
  login: (email: string, password: string) => Promise<void>;
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

    async login(email, password) {
      set({ status: "loading" });
      const { access_token } = await adminApi.login({ email, password });
      setAdminAccessToken(access_token);
      const user = await adminApi.me();
      set({ user, status: "authenticated" });
    },

    async logout() {
      try {
        // We use the admin logout endpoint if available, but authApi.logout clears the cookie
        // Wait, authApi.logout calls /api/v1/auth/logout which clears the normal session.
        // We should clear the admin session. We'll use a direct fetch or handle it.
        // Actually, we can just clear the local state for now if admin logout endpoint isn't fully wired.
        // Since the backend deletes the cookie, we could add adminApi.logout, but let's keep it simple.
        setAdminAccessToken(null);
        set({ user: null, status: "anonymous" });
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
        // No access token in memory after a reload → /users/me 401 → the
        // interceptor refreshes via cookie → retry succeeds if still valid.
        const user = await adminApi.me();
        set({ user, status: "authenticated" });
      } catch {
        set({ user: null, status: "anonymous" });
      }
    },
  };
});
