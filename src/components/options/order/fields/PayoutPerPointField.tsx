"use client";

import { Field } from "./Field";
import { InfoDot } from "./InfoDot";

interface PayoutPerPointFieldProps {
  value: number;
  currency?: string;
  onChange?: (next: number) => void;
  readOnly?: boolean;
  choices?: string[];
}

/**
 * "Payout per point" field for Turbos.
 */
export function PayoutPerPointField({
  value,
  currency = "USD",
  onChange,
  readOnly = false,
  choices,
}: PayoutPerPointFieldProps) {
  return (
    <Field
      label="Payout per point"
      trailing={<InfoDot label="Payout per point info" />}
    >
      {readOnly || !onChange ? (
        <span className="font-mono text-[14px] font-semibold tabular-nums text-opt-ink">
          {value.toFixed(2)}
        </span>
      ) : choices && choices.length > 0 ? (
        <select
          value={value.toString()}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[14px] font-semibold tabular-nums text-opt-ink outline-none cursor-pointer"
        >
          {/* If the current value is not in choices (e.g. while loading new choices), show it temporarily */}
          {!choices.includes(value.toString()) && (
             <option value={value.toString()} className="hidden">{value}</option>
          )}
          {choices.map((c) => (
            <option key={c} value={c} className="text-opt-ink bg-opt-bg">
              {c}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[14px] font-semibold tabular-nums text-opt-ink outline-none"
        />
      )}
      <span className="text-[13px] font-medium text-opt-ink-3">{currency}</span>
    </Field>
  );
}
