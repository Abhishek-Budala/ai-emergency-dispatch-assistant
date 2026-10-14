import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../src/App.tsx';
import { DashboardPanel } from '../src/components/DashboardPanel.tsx';
import { CadHeader } from '../src/components/CadHeader.tsx';
import { EmergencyAnalysis, ServiceDispatchState } from '../src/types.ts';

const mockAnalysis: EmergencyAnalysis = {
  emergency_type: 'Structural Fire with Trapped Occupants',
  urgency: 'Critical',
  location: '3rd Floor, Brodipet Main Road',
  people_involved: 'Multiple occupants visible at windows',
  services_to_alert: ['Fire', 'Ambulance'],
  summary: 'Active commercial fire with trapped civilians.',
  suggested_questions: ['Are stairwells blocked?'],
};

const mockDispatchState: Record<string, ServiceDispatchState> = {
  Ambulance: { service: 'Ambulance', required: true, notified: false },
  Fire: { service: 'Fire', required: true, notified: false },
  Police: { service: 'Police', required: false, notified: false },
  'Social Support': { service: 'Social Support', required: false, notified: false },
};

describe('WCAG 2.1 AA Accessibility Conformance', () => {
  it('provides a "Skip to main content" link pointing to #main-content', () => {
    render(<App />);
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');

    const mainElement = document.querySelector('main#main-content');
    expect(mainElement).not.toBeNull();
  });

  it('ensures all interactive buttons have accessible aria-labels or text', () => {
    render(<App />);

    // Microphone button
    const micBtn = screen.getByTestId('mic-toggle-btn');
    expect(micBtn).toHaveAttribute('aria-label');
    expect(micBtn.getAttribute('aria-label')).toMatch(/recording/i);

    // Language selector buttons
    expect(screen.getByTestId('lang-btn-en')).toHaveAttribute('aria-label');
    expect(screen.getByTestId('lang-btn-te')).toHaveAttribute('aria-label');
    expect(screen.getByTestId('lang-btn-hi')).toHaveAttribute('aria-label');

    // Analyze button
    const analyzeBtn = screen.getByTestId('analyze-btn');
    expect(analyzeBtn).toHaveAttribute('aria-label');

    // Clear button
    const clearBtn = screen.getByTestId('clear-btn');
    expect(clearBtn).toHaveAttribute('aria-label');

    // Sample call buttons
    expect(screen.getByTestId('sample-call-0')).toHaveAttribute('aria-label');
    expect(screen.getByTestId('sample-call-1')).toHaveAttribute('aria-label');
    expect(screen.getByTestId('sample-call-2')).toHaveAttribute('aria-label');
  });

  it('features aria-live="polite" on the live transcript and dashboard results', () => {
    render(<App />);

    // Live transcript container
    const transcriptRegion = document.getElementById('live-transcript-region');
    expect(transcriptRegion).toHaveAttribute('aria-live', 'polite');

    // Dashboard content area
    render(
      <DashboardPanel
        analysis={mockAnalysis}
        dispatchState={mockDispatchState as any}
        onConfirmDispatch={() => {}}
        isDispatchConfirmed={false}
        soundEnabled={false}
        isAnalyzing={false}
      />
    );

    const liveArea = document.querySelector('[aria-live="polite"]');
    expect(liveArea).not.toBeNull();
  });

  it('does not rely on color alone: displays explicit text label and aria-label for urgency', () => {
    render(
      <DashboardPanel
        analysis={mockAnalysis}
        dispatchState={mockDispatchState as any}
        onConfirmDispatch={() => {}}
        isDispatchConfirmed={false}
        soundEnabled={false}
        isAnalyzing={false}
      />
    );

    const badge = screen.getByTestId('urgency-badge');
    expect(badge).toHaveTextContent(/CRITICAL SEVERITY/i);
    expect(badge).toHaveAttribute('aria-label');
    expect(badge.getAttribute('aria-label')).toMatch(/critical/i);
  });

  it('supports keyboard navigation and Space/Enter keys on checklist items', () => {
    render(
      <DashboardPanel
        analysis={mockAnalysis}
        dispatchState={mockDispatchState as any}
        onConfirmDispatch={() => {}}
        isDispatchConfirmed={false}
        soundEnabled={false}
        isAnalyzing={false}
      />
    );

    const questionCheckbox = screen.getByRole('checkbox', {
      name: /protocol question 1/i,
    });
    expect(questionCheckbox).toBeInTheDocument();
    expect(questionCheckbox).toHaveAttribute('aria-checked', 'false');

    // Press Space key to toggle
    fireEvent.keyDown(questionCheckbox, { key: ' ' });
    expect(questionCheckbox).toHaveAttribute('aria-checked', 'true');

    // Press Enter key to toggle back
    fireEvent.keyDown(questionCheckbox, { key: 'Enter' });
    expect(questionCheckbox).toHaveAttribute('aria-checked', 'false');
  });

  it('uses semantic landmarks (header, main, section, footer)', () => {
    render(<App />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('provides accessible toggle state (aria-pressed) on audio control button', () => {
    const onToggle = () => {};
    const { rerender } = render(
      <CadHeader
        soundEnabled={true}
        onToggleSound={onToggle}
        onResetAll={() => {}}
        activeCaseCount={2}
      />
    );

    const audioBtn = screen.getByRole('button', { name: /mute cad audio/i });
    expect(audioBtn).toHaveAttribute('aria-pressed', 'true');

    rerender(
      <CadHeader
        soundEnabled={false}
        onToggleSound={onToggle}
        onResetAll={() => {}}
        activeCaseCount={2}
      />
    );

    const mutedBtn = screen.getByRole('button', { name: /enable cad audio/i });
    expect(mutedBtn).toHaveAttribute('aria-pressed', 'false');
  });
});
