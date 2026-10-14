import { UrgencyLevel } from '../types.ts';

export interface UrgencyBadgeConfig {
  label: string;
  colorName: 'red' | 'orange' | 'yellow' | 'green';
  classes: string;
  dot: string;
  ariaLabel: string;
}

export function getUrgencyBadgeConfig(urgency: UrgencyLevel): UrgencyBadgeConfig {
  switch (urgency) {
    case 'Critical':
      return {
        label: 'CRITICAL SEVERITY',
        colorName: 'red',
        classes: 'bg-red-950 text-red-200 border-red-500 ring-2 ring-red-500/50 shadow-red-900/50',
        dot: 'bg-red-400',
        ariaLabel: 'Urgency tier: Critical Severity. Immediate life threat.',
      };
    case 'High':
      return {
        label: 'HIGH PRIORITY',
        colorName: 'orange',
        classes: 'bg-orange-950 text-orange-200 border-orange-500 ring-1 ring-orange-500/50 shadow-orange-900/40',
        dot: 'bg-orange-400',
        ariaLabel: 'Urgency tier: High Priority. Rapid emergency dispatch required.',
      };
    case 'Medium':
      return {
        label: 'MEDIUM URGENCY',
        colorName: 'yellow',
        classes: 'bg-yellow-950 text-yellow-200 border-yellow-500 ring-1 ring-yellow-500/50 shadow-yellow-900/40',
        dot: 'bg-yellow-400',
        ariaLabel: 'Urgency tier: Medium Urgency. Standard priority dispatch.',
      };
    case 'Low':
    default:
      return {
        label: 'LOW / ROUTINE',
        colorName: 'green',
        classes: 'bg-emerald-950 text-emerald-200 border-emerald-500 ring-1 ring-emerald-500/50',
        dot: 'bg-emerald-400',
        ariaLabel: 'Urgency tier: Low or Routine. Non-emergency assistance.',
      };
  }
}
