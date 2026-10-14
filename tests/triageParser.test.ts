import { describe, it, expect } from 'vitest';
import { parseGeminiTriageResponse } from '../src/utils/triageParser.ts';

describe('Gemini JSON Response Parser', () => {
  it('correctly parses standard Gemini JSON into emergency type, urgency, location, and services', () => {
    const rawJson = JSON.stringify({
      emergency_type: 'Multi-Vehicle Road Crash',
      urgency: 'Critical',
      location: 'Highway toll gate, KM 42',
      people_involved: '2 motorcycle riders injured, 1 truck driver',
      services_to_alert: ['Ambulance', 'Police'],
      summary: 'High-speed collision near toll plaza blocking 2 lanes with active bleeding victim.',
      suggested_questions: [
        'Is the bleeding patient conscious?',
        'Are there any hazardous materials or leaking fuel?',
      ],
    });

    const parsed = parseGeminiTriageResponse(rawJson);

    expect(parsed.emergency_type).toBe('Multi-Vehicle Road Crash');
    expect(parsed.urgency).toBe('Critical');
    expect(parsed.location).toBe('Highway toll gate, KM 42');
    expect(parsed.people_involved).toBe('2 motorcycle riders injured, 1 truck driver');
    expect(parsed.services_to_alert).toEqual(['Ambulance', 'Police']);
    expect(parsed.suggested_questions).toHaveLength(2);
  });

  it('strips markdown ```json formatting before parsing', () => {
    const rawMarkdown = `\`\`\`json
{
  "emergency_type": "Commercial Structural Fire",
  "urgency": "High",
  "location": "Brodipet Main Road, 3rd Floor",
  "people_involved": "Staff and shoppers evacuated",
  "services_to_alert": ["Fire", "Police", "Ambulance"],
  "summary": "Heavy smoke emanating from kitchen vents with residents evacuating.",
  "suggested_questions": ["Are flames visible?"]
}
\`\`\``;

    const parsed = parseGeminiTriageResponse(rawMarkdown);

    expect(parsed.emergency_type).toBe('Commercial Structural Fire');
    expect(parsed.urgency).toBe('High');
    expect(parsed.location).toBe('Brodipet Main Road, 3rd Floor');
    expect(parsed.services_to_alert).toContain('Fire');
    expect(parsed.services_to_alert).toContain('Police');
    expect(parsed.services_to_alert).toContain('Ambulance');
  });

  it('normalizes case variations in urgency level', () => {
    const rawCritical = JSON.stringify({
      emergency_type: 'Cardiac Arrest',
      urgency: 'critical',
      location: 'Bus Stand Platform 1',
      services_to_alert: ['Ambulance'],
    });
    const parsedCritical = parseGeminiTriageResponse(rawCritical);
    expect(parsedCritical.urgency).toBe('Critical');

    const rawLow = JSON.stringify({
      emergency_type: 'Cat in tree',
      urgency: 'low',
      location: 'Park Lane',
      services_to_alert: [],
    });
    const parsedLow = parseGeminiTriageResponse(rawLow);
    expect(parsedLow.urgency).toBe('Low');
  });

  it('filters out invalid service names and preserves valid ones', () => {
    const rawWithInvalidServices = JSON.stringify({
      emergency_type: 'Disturbance',
      urgency: 'Medium',
      location: 'City Square',
      services_to_alert: ['Police', 'Coast Guard', 'Ambulance', 'NASA', 'Social Support'],
    });

    const parsed = parseGeminiTriageResponse(rawWithInvalidServices);
    expect(parsed.services_to_alert).toEqual(['Police', 'Ambulance', 'Social Support']);
  });

  it('provides safe fallbacks for missing or empty fields', () => {
    const parsed = parseGeminiTriageResponse({});
    expect(parsed.emergency_type).toBe('Unclassified Emergency');
    expect(parsed.location).toBe('Unspecified / Needs confirmation');
    expect(parsed.people_involved).toBe('Unknown');
    expect(parsed.services_to_alert).toEqual([]);
    expect(parsed.suggested_questions).toEqual([]);
  });
});
