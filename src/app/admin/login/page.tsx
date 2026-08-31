"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuthStore } from "@/stores/authStore";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, SubmitButton } from "@/components/auth/fields";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      toast.success("Admin login successful");
      router.push("/admin/dashboard" as Route);
    } catch (err: any) {
      console.error("Admin login error", err);
      setError(err?.response?.data?.detail || "Failed to log in");
      toast.error("Admin login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#f8f6f0]">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-navy mb-2">Admin Portal</h1>
          <p className="text-gray-500 text-sm">Sign in to the FXNOD Admin Console</p>
        </div>
        
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            required
            placeholder="admin@fxnod.com"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            required
            placeholder="••••••••"
          />
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <SubmitButton pending={isLoading}>Sign In as Admin</SubmitButton>
        </form>
      </div>
    </div>
  );
}
