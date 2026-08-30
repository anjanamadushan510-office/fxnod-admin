"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A draggable split between two panes.
 *
 * Hand-rolled rather than pulling in a resizable-panels library: this is ~80
 * lines of pointer events and a clamp, and the dependency would ship a whole
 * layout engine to a trading UI that already has one.
 *
 * Pointer events, not mouse events, so a trackpad, a touch screen and a pen all
 * work from the same code path — a trader on a tablet is not an edge case worth
 * a second implementation.
 *
 * The size is a PERCENTAGE, not pixels. A trader's window changes size (they
 * dock it, they plug in a monitor); a pixel split saved on a 2560px screen leaves
 * one pane unusable on a 1280px one.
 */
export interface ResizableSplit {
  /** First pane's size, as a percentage of the container. */
  size: number;
  /** Attach to the container that holds both panes and the handle. */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Spread onto the drag handle element. */
  handleProps: {
    onPointerDown: (e: React.PointerEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    role: "separator";
    tabIndex: 0;
    "aria-orientation": "vertical" | "horizontal";
    "aria-valuenow": number;
    "aria-valuemin": number;
    "aria-valuemax": number;
    "aria-label": string;
  };
  dragging: boolean;
  /** Restore the default split. */
  reset: () => void;
}

interface Options {
  /** Percentage the first pane starts at. */
  initial: number;
  /** Clamp, so neither pane can be dragged to nothing. */
  min?: number;
  max?: number;
  /** "vertical" splits left|right; "horizontal" splits top/bottom. */
  direction?: "vertical" | "horizontal";
  /** localStorage key. Omit to make the split non-persistent. */
  storageKey?: string;
  label: string;
}

/** Keyboard step, in percentage points. */
const KEY_STEP = 2;

export function useResizable({
  initial,
  min = 20,
  max = 80,
  direction = "vertical",
  storageKey,
  label,
}: Options): ResizableSplit {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(initial);
  const [dragging, setDragging] = useState(false);

  // Read the stored size AFTER mount, never during render: the server has no
  // localStorage, so using it for the initial state would render different
  // markup on each side and fail hydration.
  useEffect(() => {
    if (!storageKey) return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved === null) return;
    const parsed = Number.parseFloat(saved);
    if (Number.isFinite(parsed)) {
      setSize(clamp(parsed, min, max));
    }
  }, [storageKey, min, max]);

  const commit = useCallback(
    (next: number) => {
      const clamped = clamp(next, min, max);
      setSize(clamped);
      if (storageKey) {
        window.localStorage.setItem(storageKey, String(clamped));
      }
    },
    [min, max, storageKey],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      // Capture on the handle so the drag survives the pointer leaving it —
      // without this, moving faster than React re-renders drops the drag.
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDragging(true);

      const move = (ev: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        const pct =
          direction === "vertical"
            ? ((ev.clientX - rect.left) / rect.width) * 100
            : ((ev.clientY - rect.top) / rect.height) * 100;
        commit(pct);
      };

      const up = () => {
        setDragging(false);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      // pointercancel fires when the OS takes over (a system gesture, a
      // notification). Without it the listeners leak and the layout keeps
      // following the pointer after the drag is over.
      window.addEventListener("pointercancel", up);
    },
    [commit, direction],
  );

  // Keyboard resizing. A separator that only responds to a pointer is
  // unreachable for anyone not using one.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const decrease = direction === "vertical" ? "ArrowLeft" : "ArrowUp";
      const increase = direction === "vertical" ? "ArrowRight" : "ArrowDown";

      if (e.key === decrease) {
        e.preventDefault();
        commit(size - KEY_STEP);
      } else if (e.key === increase) {
        e.preventDefault();
        commit(size + KEY_STEP);
      } else if (e.key === "Home") {
        e.preventDefault();
        commit(min);
      } else if (e.key === "End") {
        e.preventDefault();
        commit(max);
      } else if (e.key === "Enter") {
        e.preventDefault();
        commit(initial);
      }
    },
    [commit, direction, size, min, max, initial],
  );

  const reset = useCallback(() => commit(initial), [commit, initial]);

  // While dragging, suppress text selection and force the resize cursor
  // document-wide. Otherwise a fast drag selects the surrounding UI and the
  // cursor flickers as it crosses elements.
  useEffect(() => {
    if (!dragging) return;
    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = direction === "vertical" ? "col-resize" : "row-resize";
    return () => {
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [dragging, direction]);

  return {
    size,
    containerRef,
    dragging,
    reset,
    handleProps: {
      onPointerDown,
      onKeyDown,
      role: "separator",
      tabIndex: 0,
      "aria-orientation": direction,
      "aria-valuenow": Math.round(size),
      "aria-valuemin": min,
      "aria-valuemax": max,
      "aria-label": label,
    },
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
