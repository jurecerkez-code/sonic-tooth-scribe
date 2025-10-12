# sonic-tooth-scribe

## Project Overview

**sonic-tooth-scribe** is a modern web application for digital recording, management, and analysis of dental findings. The goal is to optimize workflows in dental practices through innovative voice recording, structured patient management, and integration with automation and AI tools. The app leverages state-of-the-art web technologies and connects to external services such as n8n, Lovable, and OpenAI.

---

## 1. Setup & Installation

### Prerequisites

- Node.js (recommended: latest LTS version)
- npm (comes with Node.js)
- Git

### Clone & Start the Project

```sh
# Clone the repository
git clone https://github.com/jurecerkez-code/sonic-tooth-scribe.git
cd sonic-tooth-scribe

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will then be available locally at http://localhost:5173 (Vite default).

---

## 2. Technologies, APIs & Tools Used

### Frameworks & Libraries

- **React**: UI framework for component-based development
- **Vite**: Modern build and development server for fast hot-reloads
- **TypeScript**: Type-safe development for better maintainability
- **Tailwind CSS**: Utility-first CSS framework for modern, responsive design
- **shadcn-ui**: UI component library for React, integrated with Tailwind

### Tools & Integrations

- **n8n**: Open-source workflow automation. The project uses a Supabase function (`send-to-n8n`) to send data to n8n and trigger workflows.
- **Lovable**: No-code/low-code platform for rapid development and deployment of web applications. The project is linked to Lovable and can be edited and published there.
- **OpenAI**: AI integration for speech processing, analysis, or automation (e.g., transcription of voice recordings, intelligent findings extraction).
- **Supabase**: Backend-as-a-Service for authentication, database, and API (see `src/integrations/supabase`).

### Other Tools

- **ESLint**: Linter for code quality
- **PostCSS**: CSS transformations

---

## 3. n8n Workflow: Voice Assistant with OpenAI GPT-4o-mini & Text-to-Speech

The project integrates an n8n workflow that enables automated transcription, analysis, and structured extraction of findings from dental examination voice recordings. The main workflow steps are:

### Workflow Overview

1. **Webhook Reception**: The voice recording is sent via HTTP POST to the n8n webhook (`/voice-process`).
2. **Audio Preprocessing**: The audio data is processed as base64 and converted to a suitable format (e.g., WebM/WAV).
3. **Transcription**: The audio file is transcribed using OpenAI (Whisper).
4. **Analysis with GPT-4o-mini**: The transcript is passed to a GPT-4o-mini model (OpenAI) that is specifically instructed to extract and structure dental findings (see prompt in the workflow).
5. **Structured Output**: The model returns a JSON with `transcript`, `findings` (findings per tooth), `teethStatus` (status per tooth), and a `summary`.
6. **Response**: The structured result is returned as JSON to the client.

#### Example of the Structured JSON Response

```json
{
  "transcript": "Tooth 1 is removed and tooth 14 needs root canal checkup",
  "findings": [
    {
      "toothNumber": 1,
      "condition": "missing",
      "notes": "Tooth removed",
      "severity": "none",
      "urgent": false,
      "confidence": 95
    },
    {
      "toothNumber": 14,
      "condition": "root_canal_needed",
      "notes": "Needs root canal checkup",
      "severity": "moderate",
      "urgent": true,
      "confidence": 95
    }
  ],
  "teethStatus": [
    {
      "toothNumber": 1,
      "condition": "missing",
      "verified": true,
      "flagged": false
    },
    {
      "toothNumber": 14,
      "condition": "root_canal_needed",
      "verified": false,
      "flagged": true
    }
  ],
  "summary": {
    "totalTeethExamined": 2,
    "healthyTeeth": 0,
    "teethNeedingTreatment": 1,
    "urgentFindings": 1
  }
}
```

#### Key Rules in the Workflow

- Only the condition types defined in the prompt are used: `missing`, `root_canal_needed`, `cavity`, `crown`, `filling`, `healthy`.
- For each mentioned tooth, the fields `severity`, `urgent`, and `confidence` are set.
- The output is always a valid JSON object.

#### Technical Details

- The workflow uses OpenAI models (Whisper for transcription, GPT-4o-mini for analysis).
- Integration is done via a Supabase Edge Function that forwards audio data to the n8n webhook.
- Results can be stored in Supabase or used for further automations (e.g., notifications, documentation).

---

## 4. Technical Documentation for the Jury

### Project Structure (Excerpt)

- `src/`: Main source code (React components, hooks, integrations)
  - `components/`: UI components (e.g., DentalChart, PatientList, VoiceRecording)
  - `hooks/`: Custom React hooks (e.g., useDentalData)
  - `integrations/supabase/`: Supabase client and type definitions
  - `pages/`: Pages (e.g., Auth, Index, NotFound)
  - `types/`: Type definitions for dental data
- `supabase/functions/send-to-n8n/`: Supabase Edge Function for integration with n8n
- `public/`: Static files (e.g., robots.txt)
- `tailwind.config.ts`, `postcss.config.js`: Styling configuration

### Key Features

- **Patient Management**: Overview, selection, and management of patient data
- **Tooth Status & Findings**: Visualization and editing of tooth status, structured recording of findings
- **Voice Recording**: Recording and transcription of findings (OpenAI integration)
- **Session History**: Traceable history of sessions and findings
- **Automation**: Sending data to n8n for automated workflows (e.g., documentation, notifications)
- **Auth**: User authentication via Supabase

### Integration Points

- **n8n**: Data is sent to n8n via the Supabase function to automate workflows (e.g., documentation, notifications).
- **OpenAI**: Used for speech-to-text, text analysis, and AI-powered suggestions.
- **Lovable**: Enables editing and deployment of the app via a no-code interface.

### Deployment

- Deployment is preferably done via Lovable (see above), alternatively the app can be hosted on any Node.js-capable server.

---

## 5. Summary

sonic-tooth-scribe is an innovative, cloud-based solution for digital dentistry. It combines modern web technologies with powerful automation and AI tools to make everyday practice more efficient and smarter. The open architecture allows for easy extension and integration into existing systems.

---

**Contact & Support:**
For questions or a live demo, the team is happy to help.
