import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App.tsx';
import { CaseLogTable } from '../src/components/CaseLogTable.tsx';
import { CaseLogEntry } from '../src/types.ts';

const mockSampleAnalysis = {
  emergency_type: 'Cardiac Arrest / Medical Emergency',
  urgency: 'Critical',
  location: 'Near the bus stand',
  people_involved: '1 adult male unconscious',
  services_to_alert: ['Ambulance', 'Police'],
  summary: 'Adult male collapsed near bus stand requiring immediate defibrillation and paramedic response.',
  suggested_questions: ['Is CPR in progress?'],
};

describe('Case Log and History Audit Trail', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders existing cases with incident reference, urgency, and status', () => {
    const mockCases: CaseLogEntry[] = [
      {
        id: 'test-case-1',
        callNumber: '#CAD-1234',
        timestamp: '14:20:00',
        transcript: 'A man collapsed',
        language: 'English',
        analysis: {
          emergency_type: 'Medical Collapse',
          urgency: 'Critical',
          location: 'Main Street',
          people_involved: '1 male',
          services_to_alert: ['Ambulance'],
          summary: 'Collapsed male',
          suggested_questions: [],
        },
        servicesDispatched: ['Ambulance'],
        status: 'DISPATCHED',
      },
    ];

    render(
      <CaseLogTable
        cases={mockCases}
        onSelectCase={() => {}}
        onClearLogs={() => {}}
      />
    );

    expect(screen.getByText('#CAD-1234')).toBeInTheDocument();
    expect(screen.getByText('Medical Collapse')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('DISPATCHED')).toBeInTheDocument();
  });

  it('filters cases when user types in search box', () => {
    const mockCases: CaseLogEntry[] = [
      {
        id: 'test-1',
        callNumber: '#CAD-1111',
        timestamp: '10:00:00',
        transcript: 'Fire on third floor',
        language: 'English',
        analysis: {
          emergency_type: 'Structural Fire',
          urgency: 'High',
          location: 'Brodipet Road',
          people_involved: 'Residents',
          services_to_alert: ['Fire'],
          summary: 'Apartment fire',
          suggested_questions: [],
        },
        servicesDispatched: ['Fire'],
        status: 'DISPATCHED',
      },
      {
        id: 'test-2',
        callNumber: '#CAD-2222',
        timestamp: '11:00:00',
        transcript: 'Bike crash',
        language: 'English',
        analysis: {
          emergency_type: 'Traffic Collision',
          urgency: 'Medium',
          location: 'Highway Toll',
          people_involved: '2 drivers',
          services_to_alert: ['Police'],
          summary: 'Bikes collided',
          suggested_questions: [],
        },
        servicesDispatched: ['Police'],
        status: 'DISPATCHED',
      },
    ];

    render(
      <CaseLogTable
        cases={mockCases}
        onSelectCase={() => {}}
        onClearLogs={() => {}}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Filter cases by keyword/i);
    fireEvent.change(searchInput, { target: { value: 'Structural Fire' } });

    expect(screen.getByText('#CAD-1111')).toBeInTheDocument();
    expect(screen.queryByText('#CAD-2222')).not.toBeInTheDocument();
  });

  it('adds a new case to the case log immediately after each analysis', async () => {
    // Mock fetch for /api/analyze-emergency
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSampleAnalysis,
    } as any);

    render(<App />);

    // Count initial seeded rows
    const initialRows = screen.getAllByTestId('case-log-row');
    const initialCount = initialRows.length;

    // Fill sample call 1
    const sampleBtn = screen.getByTestId('sample-call-0');
    fireEvent.click(sampleBtn);

    // Click Analyze Incident Now
    const analyzeBtn = screen.getByTestId('analyze-btn');
    fireEvent.click(analyzeBtn);

    // Wait for analysis to complete and check that a new row has been added
    await waitFor(() => {
      const updatedRows = screen.getAllByTestId('case-log-row');
      expect(updatedRows.length).toBe(initialCount + 1);
    });

    // Check that newly logged case contains the emergency type and TRIAGED status
    const allRows = screen.getAllByTestId('case-log-row');
    const newestRow = allRows[0];
    expect(newestRow).toHaveTextContent('Cardiac Arrest / Medical Emergency');
    expect(newestRow).toHaveAttribute('data-status', 'TRIAGED');
  });

  it('updates the case status to DISPATCHED when Confirm Dispatch is clicked', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSampleAnalysis,
    } as any);

    render(<App />);

    // Trigger analysis
    fireEvent.click(screen.getByTestId('sample-call-0'));
    fireEvent.click(screen.getByTestId('analyze-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('confirm-dispatch-btn')).toBeInTheDocument();
    });

    // Click Confirm Dispatch
    const confirmBtn = screen.getByTestId('confirm-dispatch-btn');
    fireEvent.click(confirmBtn);

    // Case log row status should now be DISPATCHED
    await waitFor(() => {
      const allRows = screen.getAllByTestId('case-log-row');
      const newestRow = allRows[0];
      expect(newestRow).toHaveAttribute('data-status', 'DISPATCHED');
    });
  });
});
