import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { getUrgencyBadgeConfig } from '../src/utils/urgencyConfig.ts';
import { DashboardPanel } from '../src/components/DashboardPanel.tsx';
import { EmergencyAnalysis, ServiceDispatchState, UrgencyLevel } from '../src/types.ts';

const mockDispatchState: Record<string, ServiceDispatchState> = {
  Ambulance: { service: 'Ambulance', required: true, notified: false },
  Fire: { service: 'Fire', required: false, notified: false },
  Police: { service: 'Police', required: false, notified: false },
  'Social Support': { service: 'Social Support', required: false, notified: false },
};

function createMockAnalysis(urgency: UrgencyLevel): EmergencyAnalysis {
  return {
    emergency_type: 'Test Incident',
    urgency,
    location: '123 Main St',
    people_involved: '1 individual',
    services_to_alert: ['Ambulance'],
    summary: 'Testing urgency badge display',
    suggested_questions: ['Is the patient safe?'],
  };
}

describe('Urgency Badge Color Mapping', () => {
  describe('Config function mapping (low=green, medium=yellow, high=orange, critical=red)', () => {
    it('maps Critical urgency to red', () => {
      const config = getUrgencyBadgeConfig('Critical');
      expect(config.colorName).toBe('red');
      expect(config.label).toContain('CRITICAL');
      expect(config.classes).toContain('red');
    });

    it('maps High urgency to orange', () => {
      const config = getUrgencyBadgeConfig('High');
      expect(config.colorName).toBe('orange');
      expect(config.label).toContain('HIGH');
      expect(config.classes).toContain('orange');
    });

    it('maps Medium urgency to yellow', () => {
      const config = getUrgencyBadgeConfig('Medium');
      expect(config.colorName).toBe('yellow');
      expect(config.label).toContain('MEDIUM');
      expect(config.classes).toContain('yellow');
    });

    it('maps Low urgency to green', () => {
      const config = getUrgencyBadgeConfig('Low');
      expect(config.colorName).toBe('green');
      expect(config.label).toContain('LOW');
      expect(config.classes).toContain('emerald');
    });
  });

  describe('Dashboard UI Badge Rendering', () => {
    it('renders red badge when incident urgency is Critical', () => {
      render(
        <DashboardPanel
          analysis={createMockAnalysis('Critical')}
          dispatchState={mockDispatchState as any}
          onConfirmDispatch={() => {}}
          isDispatchConfirmed={false}
          soundEnabled={false}
          isAnalyzing={false}
        />
      );

      const badge = screen.getByTestId('urgency-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-color', 'red');
      expect(badge).toHaveAttribute('data-urgency', 'Critical');
      expect(badge).toHaveTextContent(/CRITICAL/i);
    });

    it('renders orange badge when incident urgency is High', () => {
      render(
        <DashboardPanel
          analysis={createMockAnalysis('High')}
          dispatchState={mockDispatchState as any}
          onConfirmDispatch={() => {}}
          isDispatchConfirmed={false}
          soundEnabled={false}
          isAnalyzing={false}
        />
      );

      const badge = screen.getByTestId('urgency-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-color', 'orange');
      expect(badge).toHaveAttribute('data-urgency', 'High');
      expect(badge).toHaveTextContent(/HIGH/i);
    });

    it('renders yellow badge when incident urgency is Medium', () => {
      render(
        <DashboardPanel
          analysis={createMockAnalysis('Medium')}
          dispatchState={mockDispatchState as any}
          onConfirmDispatch={() => {}}
          isDispatchConfirmed={false}
          soundEnabled={false}
          isAnalyzing={false}
        />
      );

      const badge = screen.getByTestId('urgency-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-color', 'yellow');
      expect(badge).toHaveAttribute('data-urgency', 'Medium');
      expect(badge).toHaveTextContent(/MEDIUM/i);
    });

    it('renders green badge when incident urgency is Low', () => {
      render(
        <DashboardPanel
          analysis={createMockAnalysis('Low')}
          dispatchState={mockDispatchState as any}
          onConfirmDispatch={() => {}}
          isDispatchConfirmed={false}
          soundEnabled={false}
          isAnalyzing={false}
        />
      );

      const badge = screen.getByTestId('urgency-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-color', 'green');
      expect(badge).toHaveAttribute('data-urgency', 'Low');
      expect(badge).toHaveTextContent(/LOW/i);
    });
  });
});
