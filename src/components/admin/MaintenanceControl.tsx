"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { adminApi } from "@/services/adminApi";

export function MaintenanceControl() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    adminApi.getMaintenanceStatus().then(
      (status) => { if (active) setEnabled(status.enabled); },
      () => { if (active) setError("Unable to load maintenance status. Try reloading this page."); },
    );
    return () => { active = false; };
  }, []);

  async function toggle() {
    if (enabled === null || saving) return;
    setSaving(true);
    setError(null);
    try {
      const status = await adminApi.setMaintenanceStatus(!enabled);
      setEnabled(status.enabled);
    } catch {
      setError("Unable to update maintenance status. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-label="Maintenance notice" className="rounded-3xl border border-gold/30 bg-white p-6 shadow-lg shadow-gold/5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle aria-hidden="true" className="mt-1 h-6 w-6 text-gold-3" />
          <div>
            <h2 className="text-xl font-bold text-navy">Maintenance notice</h2>
            <p className="text-sm text-navy-3">Show a banner to users on the FXNOD frontend. This does not pause any actions.</p>
            <p className="mt-2 text-sm font-semibold text-navy" role="status">
              {enabled === null ? "Loading status..." : enabled ? "Banner is ON" : "Banner is OFF"}
            </p>
          </div>
        </div>
        <button type="button" onClick={toggle} disabled={enabled === null || saving || !!error}
          className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-2 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Saving..." : enabled ? "Turn banner off" : "Turn banner on"}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}
