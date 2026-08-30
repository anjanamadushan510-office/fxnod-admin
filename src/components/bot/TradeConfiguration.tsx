"use client";

import { cn } from "@/lib/cn";
import { ArrowDownIcon, ArrowUpIcon, CaretDownIcon, InfoIcon } from "@/components/ui/Icons";
import { findMarket } from "@/components/options/market/catalog";
import type { BotIndicator } from "@/services/api/model";
import {
  BOT_MARKET_IDS,
  DURATION_UNITS,
  GROWTH_RATES,
  MULTIPLIER_STEPS,
  formShapeFor,
} from "./botMeta";
import { IndicatorPicker, hasDirectionalIndicator } from "./IndicatorPicker";
import type { BotFormState, Direction } from "./formState";

interface TradeConfigurationProps {
  strategyId: string;
  state: BotFormState;
  onChange: (patch: Partial<BotFormState>) => void;
  /** Locked while a run is in progress — parameters are snapshotted at start. */
  disabled?: boolean;
  /** Server-supplied ceilings, shown so a user is not clamped silently. */
  maxStakePerTrade?: string;
  maxSessionLoss?: string;
}

/**
 * The pre-run configuration panel.
 *
 * Which controls appear is driven by the selected bot (see botMeta), so adding
 * a bot backend-side does not mean adding a screen here.
 *
 * Session Stop Loss has NO off switch. The engine treats it as mandatory —
 * risk.Limits has no "disabled" representation — because a run without a loss
 * bound can empty an account while the user is asleep. The earlier mock showed
 * a toggle; honouring it would have meant shipping a request the API rejects.
 */
export function TradeConfiguration({
  strategyId,
  state,
  onChange,
  disabled = false,
  maxStakePerTrade,
  maxSessionLoss,
}: TradeConfigurationProps) {
  const shape = formShapeFor(strategyId);
  const autoAvailable = hasDirectionalIndicator(state.indicators);

  return (
    <section className="flex flex-col gap-3.5">
      <h2 className="m-0 text-[13px] font-bold tracking-[-0.01em] text-opt-ink">
        Trade Configuration
      </h2>

      <Field label="Market">
        <SelectRow
          value={state.marketId}
          disabled={disabled}
          onChange={(marketId) => onChange({ marketId })}
          options={BOT_MARKET_IDS.map((id) => ({
            value: id,
            label: findMarket(id)?.name ?? id,
          }))}
        />
      </Field>

      {shape.sideLabels && (
        <Field label="Direction">
          <div className="grid grid-cols-3 gap-2">
            <SideButton
              label={shape.sideLabels[0]}
              tone="rise"
              active={state.direction === "up"}
              disabled={disabled}
              onClick={() => onChange({ direction: "up" })}
            />
            <SideButton
              label={shape.sideLabels[1]}
              tone="fall"
              active={state.direction === "down"}
              disabled={disabled}
              onClick={() => onChange({ direction: "down" })}
            />
            <SideButton
              label="Auto"
              tone="auto"
              active={state.direction === "auto"}
              disabled={disabled || !autoAvailable}
              onClick={() => onChange({ direction: "auto" })}
            />
          </div>
          {!autoAvailable && (
            <p className="m-0 text-[10px] leading-snug text-opt-ink-3">
              To unlock Auto, add RSI, Bollinger, Stochastic, MACD, EMA or SMA
              below. ATR is a filter and does not count.
            </p>
          )}
        </Field>
      )}

      {shape.growthRate && (
        <Field label="Growth Rate">
          <ChipRow
            options={GROWTH_RATES.map((g) => ({ value: g, label: `${g}%` }))}
            value={state.growthRate}
            disabled={disabled}
            onChange={(growthRate) => onChange({ growthRate })}
            columns={5}
          />
        </Field>
      )}

      {shape.multiplier && (
        <Field label="Multiplier">
          <ChipRow
            options={MULTIPLIER_STEPS.map((m) => ({ value: m, label: `×${m}` }))}
            value={state.multiplier}
            disabled={disabled}
            onChange={(multiplier) => onChange({ multiplier })}
            columns={4}
          />
        </Field>
      )}

      {shape.digit && (
        <Field label="Digit (0–9)">
          <ChipRow
            options={Array.from({ length: 10 }, (_, d) => ({ value: d, label: String(d) }))}
            value={state.digit}
            disabled={disabled || state.autoDigit}
            onChange={(digit) => onChange({ digit })}
            columns={5}
          />
          <CheckboxRow
            label="Auto digit"
            hint="Use the most frequent last digit in recent ticks"
            checked={state.autoDigit}
            disabled={disabled}
            onChange={(autoDigit) => onChange({ autoDigit })}
          />
        </Field>
      )}

      {shape.barrierDigit && (
        <Field label="Barrier digit (0–8)">
          <ChipRow
            options={Array.from({ length: 9 }, (_, d) => ({ value: d, label: String(d) }))}
            value={state.barrierDigit}
            disabled={disabled}
            onChange={(barrierDigit) => onChange({ barrierDigit })}
            columns={5}
          />
        </Field>
      )}

      {shape.barrierOffset && (
        <Field label="Barrier">
          <div className="grid grid-cols-2 gap-2">
            <Toggle2
              a="Above (+)"
              b="Below (−)"
              value={state.barrierAbove ? "a" : "b"}
              disabled={disabled}
              onChange={(v) => onChange({ barrierAbove: v === "a" })}
            />
          </div>
          <TextInput
            value={state.barrierOffset}
            disabled={disabled}
            ariaLabel="Barrier offset from spot"
            onChange={(barrierOffset) => onChange({ barrierOffset })}
          />
          <p className="m-0 font-mono text-[10px] text-opt-ink-3">
            API barrier: <b>{state.barrierAbove ? "+" : "-"}{state.barrierOffset || "0"}</b>
          </p>
        </Field>
      )}

      {shape.duration && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Duration">
            <TextInput
              value={state.duration}
              disabled={disabled}
              ariaLabel="Duration"
              onChange={(duration) => onChange({ duration })}
            />
          </Field>
          <Field label="Unit">
            <SelectRow
              value={state.durationUnit}
              disabled={disabled}
              onChange={(durationUnit) => onChange({ durationUnit })}
              options={DURATION_UNITS.map((u) => ({ value: u.value, label: u.label }))}
            />
          </Field>
        </div>
      )}

      <Field label={`Stake (${state.currency})`} hint={maxStakePerTrade && `Max ${maxStakePerTrade}`}>
        <TextInput
          value={state.stake}
          disabled={disabled}
          ariaLabel="Stake per trade"
          onChange={(stake) => onChange({ stake })}
        />
      </Field>

      {shape.takeProfit && (
        <Field label={`Take Profit (${state.currency})`}>
          <TextInput
            value={state.takeProfit}
            disabled={disabled}
            ariaLabel="Take profit"
            onChange={(takeProfit) => onChange({ takeProfit })}
          />
        </Field>
      )}

      {shape.perTradeStopLoss && (
        <Field label={`Stop Loss per trade (${state.currency})`}>
          <TextInput
            value={state.perTradeStopLoss}
            disabled={disabled}
            ariaLabel="Stop loss per trade"
            onChange={(perTradeStopLoss) => onChange({ perTradeStopLoss })}
          />
        </Field>
      )}

      <Divider />

      <h2 className="m-0 text-[13px] font-bold tracking-[-0.01em] text-opt-ink">
        Session Limits
      </h2>

      {/* No toggle: the engine has no representation of a run without a loss
          bound, and offering one here would build a request the API rejects. */}
      <Field
        label={`Session Stop Loss (${state.currency})`}
        required
        hint={maxSessionLoss && `Max ${maxSessionLoss}`}
      >
        <TextInput
          value={state.sessionStopLoss}
          disabled={disabled}
          ariaLabel="Session stop loss"
          onChange={(sessionStopLoss) => onChange({ sessionStopLoss })}
        />
        <p className="m-0 text-[10px] leading-snug text-opt-ink-3">
          The bot stops itself here. Enforced on the server, so it still applies
          with this tab closed.
        </p>
      </Field>

      <Field label={`Session Target Profit (${state.currency})`} hint="Optional">
        <TextInput
          value={state.sessionTargetProfit}
          disabled={disabled}
          ariaLabel="Session target profit"
          onChange={(sessionTargetProfit) => onChange({ sessionTargetProfit })}
        />
      </Field>

      <Field label="Max trades this session" hint="Optional">
        <TextInput
          value={state.maxTrades}
          disabled={disabled}
          ariaLabel="Max trades"
          onChange={(maxTrades) => onChange({ maxTrades })}
        />
      </Field>

      <Divider />

      <CheckboxRow
        label="Martingale"
        hint="Increase stake after a loss, reset on a win"
        checked={state.martingaleEnabled}
        disabled={disabled}
        onChange={(martingaleEnabled) => onChange({ martingaleEnabled })}
      />

      {state.martingaleEnabled && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Multiplier">
            <TextInput
              value={state.martingaleMultiplier}
              disabled={disabled}
              ariaLabel="Martingale multiplier"
              onChange={(martingaleMultiplier) => onChange({ martingaleMultiplier })}
            />
          </Field>
          <Field label="Max steps">
            <TextInput
              value={state.martingaleMaxSteps}
              disabled={disabled}
              ariaLabel="Martingale max steps"
              onChange={(martingaleMaxSteps) => onChange({ martingaleMaxSteps })}
            />
          </Field>
        </div>
      )}

      {state.martingaleEnabled && (
        <p className="m-0 rounded-[var(--opt-radius-sm)] bg-opt-fall-soft px-2.5 py-2 text-[10px] leading-relaxed text-opt-fall">
          Martingale raises your stake after every loss. When the steps run out
          the bot stops rather than restarting at the base stake, and the
          platform caps both the multiplier and the per-trade stake.
        </p>
      )}

      <Divider />

      <IndicatorPicker
        value={state.indicators}
        onChange={(indicators: BotIndicator[]) => {
          // Dropping the last directional indicator makes Auto unreachable, so
          // fall back rather than leaving a direction the API will reject.
          const patch: Partial<BotFormState> = { indicators };
          if (state.direction === "auto" && !hasDirectionalIndicator(indicators)) {
            patch.direction = "up";
          }
          onChange(patch);
        }}
        disabled={disabled}
      />
    </section>
  );
}

// ─── primitives ──────────────────────────────────────────────────────────────

const inputBase =
  "h-9 w-full rounded-[var(--opt-radius-sm)] border border-opt-line bg-opt-bg-elev px-2.5 text-[12px] text-opt-ink outline-none transition-colors focus:border-opt-line-strong disabled:opacity-55";

function Divider() {
  return <div className="h-px w-full bg-opt-line" />;
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string | false;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-opt-ink-2">
        {label}
        {required && <span className="text-opt-fall">*</span>}
        {hint && <span className="font-normal text-opt-ink-3">{hint}</span>}
      </span>
      {children}
    </div>
  );
}

function SelectRow({
  value,
  options,
  disabled,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (next: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputBase, "appearance-none pr-8")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <CaretDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-opt-ink-3" />
    </div>
  );
}

function ChipRow<T extends number>({
  options,
  value,
  disabled,
  onChange,
  columns,
}: {
  options: { value: T; label: string }[];
  value: T;
  disabled?: boolean;
  onChange: (next: T) => void;
  columns: number;
}) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          aria-pressed={value === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-[var(--opt-radius-sm)] border py-1.5 text-[12px] font-semibold tabular-nums",
            "transition-[background,border-color] duration-150 disabled:opacity-55",
            value === o.value
              ? "border-opt-rise bg-opt-rise-soft text-opt-rise"
              : "border-opt-line bg-opt-bg-elev text-opt-ink-2 hover:border-opt-line-strong",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SideButton({
  label,
  tone,
  active,
  disabled,
  onClick,
}: {
  label: string;
  tone: "rise" | "fall" | "auto";
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = tone === "rise" ? ArrowUpIcon : tone === "fall" ? ArrowDownIcon : null;
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      title={disabled && tone === "auto" ? "Add a directional indicator first" : undefined}
      className={cn(
        "flex h-9 items-center justify-center gap-1 rounded-[var(--opt-radius-sm)] border",
        "text-[12px] font-bold transition-[background,border-color] duration-150",
        "disabled:cursor-not-allowed disabled:opacity-45",
        active && tone === "rise" && "border-opt-rise bg-opt-rise text-white",
        active && tone === "fall" && "border-opt-fall bg-opt-fall text-white",
        active && tone === "auto" && "border-gold bg-gold-soft text-gold-3",
        !active && "border-opt-line bg-opt-bg-elev text-opt-ink-2 hover:border-opt-line-strong",
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {tone === "auto" && <span aria-hidden="true">⚡</span>}
      {label}
    </button>
  );
}

function Toggle2({
  a,
  b,
  value,
  disabled,
  onChange,
}: {
  a: string;
  b: string;
  value: "a" | "b";
  disabled?: boolean;
  onChange: (next: "a" | "b") => void;
}) {
  return (
    <>
      {(["a", "b"] as const).map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          disabled={disabled}
          onClick={() => onChange(key)}
          className={cn(
            "h-9 rounded-[var(--opt-radius-sm)] border text-[12px] font-semibold",
            "transition-[background,border-color] duration-150 disabled:opacity-55",
            value === key
              ? "border-opt-rise bg-opt-rise-soft text-opt-rise"
              : "border-opt-line bg-opt-bg-elev text-opt-ink-2 hover:border-opt-line-strong",
          )}
        >
          {key === "a" ? a : b}
        </button>
      ))}
    </>
  );
}

function TextInput({
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <input
      // `text` with a numeric input mode, not `number`: amounts are sent to the
      // API as decimal STRINGS to preserve precision, and a number input would
      // round-trip them through a float on the way.
      type="text"
      inputMode="decimal"
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className={cn(inputBase, "text-right tabular-nums")}
    />
  );
}

function CheckboxRow({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-150 disabled:opacity-55",
          checked ? "bg-opt-rise" : "bg-opt-line-strong",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-[left] duration-150",
            checked ? "left-[18px]" : "left-0.5",
          )}
        />
      </button>
      <span className="flex flex-col">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-opt-ink-2">
          {label}
          <InfoIcon className="h-3 w-3 text-opt-ink-4" />
        </span>
        {hint && <span className="text-[10px] text-opt-ink-3">{hint}</span>}
      </span>
    </label>
  );
}
