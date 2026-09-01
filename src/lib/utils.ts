import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatHoursDecimal(hours: number): string {
  return `${hours.toFixed(1)} hrs`;
}

export function formatCurrency(amount: number, settings?: { currencySymbol?: string; currencyCode?: string }): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: settings?.currencyCode || 'INR',
      maximumFractionDigits: 0,
    }).format(amount).replace(/^[a-zA-Z]+/, settings?.currencySymbol || '₹');
  } catch {
    return `${settings?.currencySymbol || '₹'}${amount.toLocaleString()}`;
  }
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateString || '-';
  }
}

export function formatShortDate(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch {
    return dateString || '-';
  }
}

export function calculateDateDiffDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

export function formatDurationHuman(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0h 00m 00s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
}

export function getTaskTotalSeconds(task?: { worklogs?: { durationSeconds?: number }[]; isTimerRunning?: boolean; activeTimerStart?: string; loggedHours?: number } | null): number {
  if (!task) return 0;
  const worklogSecs = (task.worklogs || []).reduce((acc, wl) => acc + (wl.durationSeconds || 0), 0);
  let liveSecs = 0;
  if (task.isTimerRunning && task.activeTimerStart) {
    liveSecs = Math.max(0, Math.round((Date.now() - new Date(task.activeTimerStart).getTime()) / 1000));
  }
  const total = worklogSecs + liveSecs;
  if (total > 0) return total;
  return Math.round((task.loggedHours || 0) * 3600);
}

