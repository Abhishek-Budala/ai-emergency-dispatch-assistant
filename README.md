# AI Emergency Dispatch Assistant

A real-time Computer-Aided Dispatch (CAD) console designed for 911/112 emergency response intake. It combines multilingual speech recognition (English, Telugu, Hindi), AI-powered incident triaging using Gemini, first responder service routing (Ambulance, Fire, Police, Social Support), and an incident audit case log.

---

## Accessibility (WCAG 2.1 AA Compliant)

This application is built to meet **WCAG 2.1 Level AA** standards:
- **Skip to Main Content Link**: Accessible via keyboard Tab navigation at the top of the viewport.
- **Screen Reader Announcements**: `aria-live="polite"` applied to live caller audio transcription and AI triage dashboard results.
- **Contrast & Typography**: All text elements meet or exceed 4.5:1 contrast ratios on dark surfaces. Low-contrast gray text has been eliminated.
- **Multimodal Urgency Representation**: Does not rely on color alone; displays explicit text labels (`CRITICAL SEVERITY`, `HIGH PRIORITY`, `MEDIUM URGENCY`, `LOW / ROUTINE`) and descriptive ARIA tags.
- **Full Keyboard Navigation**: Visible, high-contrast focus rings (`focus-visible`) across all interactive buttons, inputs, checklist checkboxes, and table rows. Supports Tab, Enter, and Space keys.
- **Semantic HTML**: Proper landmarks (`header[role="banner"]`, `main#main-content`, `section`, `footer[role="contentinfo"]`) and heading hierarchy (`h1` &rarr; `h2` &rarr; `h3` &rarr; `h4`).
- **Icon Accessibility**: All decorative Lucide icons include `aria-hidden="true"`, and interactive icons provide explicit `aria-label` tags.
- **Responsive & Zoom Resilient**: Works on mobile viewports and scales cleanly up to 200% zoom without horizontal clipping or overlapping text.

---

## Features

- **Multilingual Audio Intake**: Live speech recognition in English (`en-US`), Telugu (`te-IN`), and Hindi (`hi-IN`) with microphone capture and backup manual text input.
- **Instant AI Triage**: Extracts emergency type, urgency tier, incident location, people involved, required services, one-line situational summary, and tactical dispatcher protocol questions.
- **Dynamic Service Dispatch**: Highlights only the required emergency service units (Ambulance, Fire, Police, Social Support) with high-priority status indicators.
- **Confirm Dispatch Execution**: One-click dispatch confirmation marking required services as "Notified" with recorded timestamps and synthetic CAD audio signals.
- **Case Log & Audit Trail**: Real-time record of all triaged and dispatched emergency cases with search filtering and click-to-review capabilities.

---

## How to Run Tests

The application uses **Vitest** and **React Testing Library** for automated unit and integration tests. All Gemini API calls and browser audio APIs are mocked so that tests run completely offline without requiring a real Gemini API key or external network access.

### 1. Run all tests once:
```bash
npm test
```

### 2. Run tests in watch mode (for development):
```bash
npm run test:watch
```

### 3. Run linting & TypeScript type checks:
```bash
npm run lint
```

---

## Test Suite Coverage

The automated test suite in `/tests` covers the core business logic, UI flows, and accessibility requirements:

| Test File | Description |
| :--- | :--- |
| `tests/accessibility.test.tsx` | Verifies WCAG 2.1 AA conformance: Skip to main content link, non-empty ARIA labels, `aria-live="polite"` regions, text-based urgency tiers, keyboard toggling (Space/Enter), and semantic landmarks. |
| `tests/triageParser.test.ts` | Validates parsing and normalization of Gemini's structured JSON output into emergency type, urgency, location, and services. Tests markdown code block stripping and fallbacks. |
| `tests/urgencyBadge.test.tsx` | Verifies the color-coded urgency mapping: **Low = Green**, **Medium = Yellow**, **High = Orange**, and **Critical = Red**, both in configuration and rendered UI elements. |
| `tests/serviceCards.test.tsx` | Asserts that **only the needed service cards are highlighted** (e.g. Ambulance and Police when required; Fire and Social Support on Standby) and verifies that clicking "Confirm Dispatch" updates highlighted cards to **Notified** with an exact timestamp. |
| `tests/caseLog.test.tsx` | Verifies that **a new case is immediately added to the case log after each analysis**, tracks status transitions (`TRIAGED` &rarr; `DISPATCHED`), and tests keyword search filtering. |
| `tests/geminiMock.test.ts` | Demonstrates how the Gemini API SDK (`@google/genai`) is mocked so tests run deterministically and fast without needing a real API key. |

---

## Running the Application

### Development mode:
```bash
npm run dev
```
Starts the full-stack Express server with Vite middleware on `http://localhost:3000`.

### Production build:
```bash
npm run build
npm start
```
