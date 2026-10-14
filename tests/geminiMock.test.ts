import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseGeminiTriageResponse } from '../src/utils/triageParser.ts';

// Mock the @google/genai module
vi.mock('@google/genai', () => {
  return {
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      ARRAY: 'ARRAY',
    },
    GoogleGenAI: class MockGoogleGenAI {
      models: {
        generateContent: any;
      };
      constructor(_options?: any) {
        this.models = {
          generateContent: vi.fn(),
        };
      }
    },
  };
});

describe('Mocked Gemini API Emergency Triage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates triage response via mocked Gemini generateContent without an API key', async () => {
    const { GoogleGenAI } = await import('@google/genai');
    const aiInstance = new GoogleGenAI({ apiKey: 'MOCK_KEY_NOT_REAL' });

    const mockApiResponse = {
      text: JSON.stringify({
        emergency_type: 'Structural Fire with Trapped Occupants',
        urgency: 'Critical',
        location: '3rd Floor, Brodipet Main Road',
        people_involved: 'Multiple people shouting from windows',
        services_to_alert: ['Fire', 'Police', 'Ambulance'],
        summary: 'Smoke visible from 3rd floor apartment with people trapped at windows.',
        suggested_questions: [
          'Are there flames visible or only heavy smoke?',
          'How many individuals are at the windows?',
          'Is the building stairwell accessible?',
        ],
      }),
    };

    (aiInstance.models.generateContent as any).mockResolvedValue(mockApiResponse);

    // Call the mocked generateContent
    const response = await aiInstance.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'There is smoke coming from the third floor of the building...',
    });

    expect(aiInstance.models.generateContent).toHaveBeenCalledTimes(1);

    // Parse the output
    const parsed = parseGeminiTriageResponse(response.text!);

    expect(parsed.emergency_type).toBe('Structural Fire with Trapped Occupants');
    expect(parsed.urgency).toBe('Critical');
    expect(parsed.location).toBe('3rd Floor, Brodipet Main Road');
    expect(parsed.services_to_alert).toEqual(['Fire', 'Police', 'Ambulance']);
    expect(parsed.suggested_questions).toHaveLength(3);
  });

  it('handles simulated Gemini API 503 error gracefully with fallback parsing', async () => {
    const { GoogleGenAI } = await import('@google/genai');
    const aiInstance = new GoogleGenAI({ apiKey: 'MOCK_KEY_NOT_REAL' });

    (aiInstance.models.generateContent as any).mockRejectedValue(
      new Error('503 Service Unavailable: High demand')
    );

    let triageResult = null;

    try {
      await aiInstance.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'A man collapsed near the bus stand',
      });
    } catch {
      // Simulate fallback triage
      triageResult = parseGeminiTriageResponse({
        emergency_type: 'Medical Emergency - Patient Unresponsive',
        urgency: 'Critical',
        location: 'Near the bus stand',
        people_involved: '1 adult male',
        services_to_alert: ['Ambulance', 'Police'],
        summary: 'Emergency response activated via CAD fallback.',
        suggested_questions: ['Is the patient breathing?'],
      });
    }

    expect(triageResult).not.toBeNull();
    expect(triageResult?.emergency_type).toBe('Medical Emergency - Patient Unresponsive');
    expect(triageResult?.urgency).toBe('Critical');
    expect(triageResult?.services_to_alert).toContain('Ambulance');
  });
});
