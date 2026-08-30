"use client";

import { cn } from "@/lib/cn";
import type { ResizableSplit } from "./useResizable";

interface SplitHandleProps {
  split: ResizableSplit;
  direction?: "vertical" | "horizontal";
}

/**
 * The draggable divider between two panes.
 *
 * The visible line is 1px so it reads as a border rather than a control, but the
 * hit area is 9px — a 1px grab target is the classic reason resizable layouts
 * feel broken. Double-click restores the default, which is the escape hatch for
 * a split dragged somewhere useless.
 */
export function SplitHandle({ split, direction = "vertical" }: SplitHandleProps) {
  const vertical = direction === "vertical";

  return (
    <div
      {...split.handleProps}
      onDoubleClick={split.reset}
      title="Drag to resize · double-click to reset · arrow keys to nudge"
      className={cn(
        "group relative shrink-0 touch-none",
        vertical ? "w-[9px] cursor-col-resize" : "h-[9px] cursor-row-resize",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold",
      )}
    >
      {/* The line the user reads as the edge between panes. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute bg-opt-line transition-colors",
          vertical
            ? "left-1/2 top-0 h-full w-px -translate-x-1/2"
            : "left-0 top-1/2 h-px w-full -translate-y-1/2",
          "group-hover:bg-opt-rise",
          split.dragging && "bg-opt-rise",
        )}
      />
      {/* Grip dots, shown on hover so the divider is discoverable without
          decorating the resting state. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "flex gap-[3px] opacity-0 transition-opacity group-hover:opacity-100",
          vertical ? "flex-col" : "flex-row",
          split.dragging && "opacity-100",
        )}
      >
        <Dot />
        <Dot />
        <Dot />
      </span>
    </div>
  );
}

function Dot() {
  return <span className="h-[3px] w-[3px] rounded-full bg-opt-ink-4" />;
}
