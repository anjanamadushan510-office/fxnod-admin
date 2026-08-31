"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, bootstrap } = useAuthStore();

  useEffect(() => {
    if (status === "idle") {
      bootstrap();
    }
  }, [status, bootstrap]);

  useEffect(() => {
    if (status === "anonymous" && pathname !== "/admin/login") {
      router.replace("/admin/login");
    } else if (status === "authenticated" && (pathname === "/admin/login" || pathname === "/")) {
      router.replace("/admin/dashboard");
    } else if (pathname === "/") {
       // Just in case it's loading, if they hit root, we redirect to login to kickstart
       if(status === "anonymous") router.replace("/admin/login");
    }
  }, [status, pathname, router]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8f6f0]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">Verifying Admin Session...</p>
        </div>
      </div>
    );
  }

  // If on login page and not authenticated, render login page
  if (pathname === "/admin/login" && status === "anonymous") {
    return <>{children}</>;
  }

  // If authenticated, render children
  if (status === "authenticated") {
    return <>{children}</>;
  }

  return null;
}
