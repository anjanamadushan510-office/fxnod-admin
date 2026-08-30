import React from "react";
import { cn } from "@/lib/cn";

const TEAL = "#00A79E";
const RED = "#ef5350";
const GREY = "#999999";

interface IconProps {
  className?: string;
}

export function IconAwesomeOscillator({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <rect x="4" y="10" width="3" height="6" fill={RED} />
      <rect x="9" y="6" width="3" height="10" fill={TEAL} />
      <rect x="14" y="4" width="3" height="12" fill={TEAL} />
      <rect x="19" y="8" width="3" height="8" fill={RED} />
    </svg>
  );
}

export function IconDPO({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <path d="M3 12 L7 6 L11 15 L16 8 L21 14" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMACD({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      {/* Histogram */}
      <rect x="4" y="12" width="2" height="4" fill={GREY} opacity="0.3" />
      <rect x="8" y="10" width="2" height="6" fill={GREY} opacity="0.5" />
      <rect x="12" y="7" width="2" height="9" fill={GREY} opacity="0.7" />
      <rect x="16" y="11" width="2" height="5" fill={GREY} opacity="0.5" />
      <rect x="20" y="13" width="2" height="3" fill={GREY} opacity="0.3" />
      {/* Lines */}
      <path d="M2 14 L8 10 L14 16 L22 6" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 16 L9 12 L15 14 L22 8" stroke={RED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconROC({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <path d="M3 8 L9 16 L15 12 L21 6" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="2" y1="12" x2="22" y2="12" stroke={GREY} strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  );
}

export function IconRSI({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <line x1="2" y1="6" x2="22" y2="6" stroke={RED} strokeWidth="1" strokeDasharray="2 2" />
      <line x1="2" y1="18" x2="22" y2="18" stroke={RED} strokeWidth="1" strokeDasharray="2 2" />
      <path d="M2 14 L6 10 L10 16 L15 8 L18 12 L22 5" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconStochastic({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <path d="M2 12 Q6 4, 10 12 T18 12 T22 8" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 14 Q7 7, 11 14 T19 14 T22 10" stroke={RED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconWPR({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <line x1="2" y1="5" x2="22" y2="5" stroke={GREY} strokeWidth="1" strokeDasharray="2 2" />
      <line x1="2" y1="19" x2="22" y2="19" stroke={GREY} strokeWidth="1" strokeDasharray="2 2" />
      <path d="M2 10 L6 16 L10 8 L15 14 L19 6 L22 12" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ==========================================
// TREND ICONS
// ==========================================

export function IconAroon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <path d="M4 20 L12 4 L20 16" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 4 L12 20 L20 8" stroke={RED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconADX({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <path d="M2 12 Q6 8 10 12 T18 12 T22 8" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 16 Q6 20 10 16 T18 16 T22 20" stroke={RED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 8 Q6 4 10 8 T18 8 T22 4" stroke={GREY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCCI({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <line x1="2" y1="12" x2="22" y2="12" stroke={GREY} strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M2 18 L6 10 L10 14 L14 6 L18 16 L22 8" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconIchimoku({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <path d="M3 14 L8 9 L13 14 L19 8" fill={RED} fillOpacity="0.2" />
      <path d="M3 14 L8 9 L13 14 L19 8" stroke={RED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16 L10 11 L15 16 L21 10" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconParabolicSAR({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <circle cx="4" cy="4" r="1.5" fill={TEAL} />
      <circle cx="8" cy="6" r="1.5" fill={TEAL} />
      <circle cx="12" cy="10" r="1.5" fill={TEAL} />
      <circle cx="16" cy="15" r="1.5" fill={TEAL} />
      <circle cx="20" cy="20" r="1.5" fill={TEAL} />
    </svg>
  );
}

export function IconZigZag({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <path d="M2 18 L8 6" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6 L16 20" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 20 L22 8" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ==========================================
// GENERIC FALLBACKS
// ==========================================

export function IconGenericTrend({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <path d="M3 18 L9 10 L15 14 L21 4" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconGenericVolatility({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <path d="M2 12 Q6 4 12 12 T22 12" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12 Q6 20 12 12 T22 12" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconGenericMA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <path d="M2 16 Q8 10 14 12 T22 6" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconGenericOther({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <circle cx="6" cy="12" r="2" fill={GREY} />
      <circle cx="12" cy="12" r="2" fill={GREY} />
    </svg>
  );
}

export function IconRainbowMA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-5 h-5", className)}>
      <path d="M4 16 L8 8 L14 12 L20 4" stroke="#ff3b3b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 18 L8 10 L14 14 L20 6" stroke="#ff9800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20 L8 12 L14 16 L20 8" stroke="#00bcd4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 22 L8 14 L14 18 L20 10" stroke="#9c27b0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
