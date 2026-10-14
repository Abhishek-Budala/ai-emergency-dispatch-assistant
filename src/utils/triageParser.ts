import { EmergencyAnalysis, EmergencyServiceType, UrgencyLevel } from '../types.ts';

const VALID_SERVICES: EmergencyServiceType[] = ['Ambulance', 'Fire', 'Police', 'Social Support'];
const VALID_URGENCIES: UrgencyLevel[] = ['Critical', 'High', 'Medium', 'Low'];

/**
 * Parses and validates Gemini JSON response into a strongly typed EmergencyAnalysis object.
 * Handles raw JSON strings, JSON wrapped in markdown codeblocks, or parsed objects.
 */
export function parseGeminiTriageResponse(raw: string | Record<string, unknown>): EmergencyAnalysis {
  let parsed: any;

  if (typeof raw === 'string') {
    let clean = raw.trim();
    // Strip markdown code block if present
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    parsed = JSON.parse(clean);
  } else {
    parsed = raw;
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid Gemini triage output: Expected JSON object');
  }

  // Validate or normalize urgency
  let urgency: UrgencyLevel = 'High';
  if (typeof parsed.urgency === 'string') {
    const matched = VALID_URGENCIES.find(
      (u) => u.toLowerCase() === parsed.urgency.trim().toLowerCase()
    );
    if (matched) {
      urgency = matched;
    }
  }

  // Validate emergency services
  const services: EmergencyServiceType[] = [];
  if (Array.isArray(parsed.services_to_alert)) {
    parsed.services_to_alert.forEach((svc: any) => {
      if (typeof svc === 'string') {
        const found = VALID_SERVICES.find(
          (valid) => valid.toLowerCase() === svc.trim().toLowerCase()
        );
        if (found && !services.includes(found)) {
          services.push(found);
        }
      }
    });
  }

  return {
    emergency_type: String(parsed.emergency_type || 'Unclassified Emergency').trim(),
    urgency,
    location: String(parsed.location || 'Unspecified / Needs confirmation').trim(),
    people_involved: String(parsed.people_involved || 'Unknown').trim(),
    services_to_alert: services,
    summary: String(parsed.summary || '').trim(),
    suggested_questions: Array.isArray(parsed.suggested_questions)
      ? parsed.suggested_questions.map((q: any) => String(q).trim()).filter(Boolean)
      : [],
  };
}
