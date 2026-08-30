"use client";

import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { CaretDownIcon, UserIcon } from "@/components/ui/Icons";

interface BotTopBarProps {
  loginId: string;
  balance: number;
  currency: string;
  /** Demo balances are labelled — mistaking one for real money is expensive. */
  isVirtual?: boolean;
}

export function BotTopBar({
  loginId,
  balance,
  currency,
  isVirtual = false,
}: BotTopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-opt-line bg-opt-bg-elev px-5">
      <Link
        href={"/options" as Route}
        className="flex items-center gap-2.5 text-opt-ink transition-opacity hover:opacity-80"
      >
        <span
          aria-hidden="true"
          className="grid h-8 w-8 place-items-center rounded-lg bg-[linear-gradient(180deg,var(--navy),var(--navy-3))] text-[13px] font-bold text-gold"
        >
          dB
        </span>
        <span className="text-[17px] font-bold tracking-[-0.01em]">dBot</span>
      </Link>

      <div className="ml-auto flex items-center gap-3 max-lg:gap-2">
        <div className="flex items-center gap-2.5 max-lg:hidden">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-full bg-opt-bg-sunk text-opt-ink-3"
          >
            <UserIcon className="h-4 w-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[10px] text-opt-ink-3">Login ID</span>
            <span className="text-[12px] font-semibold tabular-nums text-opt-ink">
              {loginId}
            </span>
          </span>
        </div>

        <button
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-[var(--opt-radius-sm)] border border-opt-line",
            "bg-opt-bg-elev px-3 py-2 transition-colors hover:border-opt-line-strong",
          )}
        >
          {isVirtual && (
            <span className="rounded-full bg-opt-ink-4/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-opt-ink-2">
              Demo
            </span>
          )}
          <span className="text-[13px] font-bold tabular-nums text-opt-ink">
            {balance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            {currency}
          </span>
          <CaretDownIcon className="h-3 w-3 text-opt-ink-3" />
        </button>

        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-[var(--opt-radius-sm)] border border-opt-line",
            "bg-opt-bg-elev px-3 py-2 text-[12px] font-semibold text-opt-ink-2",
            "transition-colors hover:border-opt-line-strong max-lg:hidden",
          )}
        >
          Reports
          <CaretDownIcon className="h-3 w-3 text-opt-ink-3" />
        </button>
      </div>
    </header>
  );
}
