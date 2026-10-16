"use client";
import { UserActivity } from "@/components/admin/UserActivity";
export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User activity</h1>
        <p className="text-slate-500 mt-2">
          Review account actions across trading, wallet and platform services.
        </p>
      </div>
      <UserActivity />
    </div>
  );
}
