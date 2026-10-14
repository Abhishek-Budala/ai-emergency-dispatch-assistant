import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardPanel } from '../src/components/DashboardPanel.tsx';
import { EmergencyAnalysis, EmergencyServiceType, ServiceDispatchState } from '../src/types.ts';

const mockAnalysis: EmergencyAnalysis = {
  emergency_type: 'Multi-Vehicle Road Crash',
  urgency: 'Critical',
  location: 'Highway toll gate',
  people_involved: '2 motorcycle riders, 1 truck driver',
  services_to_alert: ['Ambulance', 'Police'],
  summary: 'Severe road collision with blocked highway.',
  suggested_questions: ['Is anyone trapped?'],
};

describe('Service Cards Highlighting and Dispatch Notification', () => {
  it('highlights ONLY the needed service cards (Ambulance and Police in this scenario)', () => {
    const dispatchState: Record<EmergencyServiceType, ServiceDispatchState> = {
      Ambulance: { service: 'Ambulance', required: true, notified: false },
      Fire: { service: 'Fire', required: false, notified: false },
      Police: { service: 'Police', required: true, notified: false },
      'Social Support': { service: 'Social Support', required: false, notified: false },
    };

    render(
      <DashboardPanel
        analysis={mockAnalysis}
        dispatchState={dispatchState}
        onConfirmDispatch={() => {}}
        isDispatchConfirmed={false}
        soundEnabled={false}
        isAnalyzing={false}
      />
    );

    // Ambulance should be highlighted
    const ambulanceCard = screen.getByTestId('service-card-ambulance');
    expect(ambulanceCard).toHaveAttribute('data-highlighted', 'true');
    expect(screen.getByTestId('status-ambulance')).toHaveTextContent(/DISPATCH REQUIRED/i);

    // Police should be highlighted
    const policeCard = screen.getByTestId('service-card-police');
    expect(policeCard).toHaveAttribute('data-highlighted', 'true');
    expect(screen.getByTestId('status-police')).toHaveTextContent(/DISPATCH REQUIRED/i);

    // Fire should NOT be highlighted (Standby)
    const fireCard = screen.getByTestId('service-card-fire');
    expect(fireCard).toHaveAttribute('data-highlighted', 'false');
    expect(screen.getByTestId('status-fire')).toHaveTextContent(/STANDBY/i);

    // Social Support should NOT be highlighted (Standby)
    const socialSupportCard = screen.getByTestId('service-card-social-support');
    expect(socialSupportCard).toHaveAttribute('data-highlighted', 'false');
    expect(screen.getByTestId('status-social-support')).toHaveTextContent(/STANDBY/i);
  });

  it('triggers onConfirmDispatch when Confirm Dispatch button is clicked', () => {
    const onConfirmDispatch = vi.fn();
    const dispatchState: Record<EmergencyServiceType, ServiceDispatchState> = {
      Ambulance: { service: 'Ambulance', required: true, notified: false },
      Fire: { service: 'Fire', required: false, notified: false },
      Police: { service: 'Police', required: true, notified: false },
      'Social Support': { service: 'Social Support', required: false, notified: false },
    };

    render(
      <DashboardPanel
        analysis={mockAnalysis}
        dispatchState={dispatchState}
        onConfirmDispatch={onConfirmDispatch}
        isDispatchConfirmed={false}
        soundEnabled={false}
        isAnalyzing={false}
      />
    );

    const confirmButton = screen.getByTestId('confirm-dispatch-btn');
    expect(confirmButton).not.toBeDisabled();
    expect(confirmButton).toHaveTextContent(/CONFIRM DISPATCH/i);

    fireEvent.click(confirmButton);
    expect(onConfirmDispatch).toHaveBeenCalledTimes(1);
  });

  it('changes highlighted cards to "Notified" with a timestamp when dispatch is confirmed', () => {
    const testTimestamp = '10:14:32 AM';
    const notifiedDispatchState: Record<EmergencyServiceType, ServiceDispatchState> = {
      Ambulance: { service: 'Ambulance', required: true, notified: true, timestamp: testTimestamp },
      Fire: { service: 'Fire', required: false, notified: false },
      Police: { service: 'Police', required: true, notified: true, timestamp: testTimestamp },
      'Social Support': { service: 'Social Support', required: false, notified: false },
    };

    render(
      <DashboardPanel
        analysis={mockAnalysis}
        dispatchState={notifiedDispatchState}
        onConfirmDispatch={() => {}}
        isDispatchConfirmed={true}
        soundEnabled={false}
        isAnalyzing={false}
      />
    );

    // Ambulance card changes to Notified with timestamp
    const ambulanceCard = screen.getByTestId('service-card-ambulance');
    expect(ambulanceCard).toHaveAttribute('data-notified', 'true');
    expect(screen.getByTestId('status-ambulance')).toHaveTextContent(/NOTIFIED/i);
    expect(screen.getByTestId('timestamp-ambulance')).toHaveTextContent(testTimestamp);

    // Police card changes to Notified with timestamp
    const policeCard = screen.getByTestId('service-card-police');
    expect(policeCard).toHaveAttribute('data-notified', 'true');
    expect(screen.getByTestId('status-police')).toHaveTextContent(/NOTIFIED/i);
    expect(screen.getByTestId('timestamp-police')).toHaveTextContent(testTimestamp);

    // Fire and Social Support remain on standby
    expect(screen.getByTestId('status-fire')).toHaveTextContent(/STANDBY/i);
    expect(screen.getByTestId('status-social-support')).toHaveTextContent(/STANDBY/i);

    // Button updates to confirmed state
    const confirmButton = screen.getByTestId('confirm-dispatch-btn');
    expect(confirmButton).toHaveTextContent(/ALL REQUIRED UNITS NOTIFIED & DISPATCHED/i);
  });
});
