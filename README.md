# Medical Coding Assistant

A full-stack TypeScript application for processing medical audio recordings, generating clinical documents, and predicting medical codes using the Corti API and JavaScript SDK.

## Features

- **Audio Recording Upload**: Upload and process medical audio recordings
- **Template Selection**: Choose from available document templates
- **Clinical Fact Extraction**: Automatic extraction of structured medical data using FactsR™
- **Document Generation**: Generate SOAP notes and clinical documents
- **Medical Code Prediction**: Predict ICD-10-CM, ICD-10-PCS, and CPT codes with evidence
- **Interactive UI**: Expandable codes with evidence, progressive workflow, visual feedback

## Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** (included with Node.js)
- **TypeScript** 5.0 or higher
- **Corti API credentials** - Get them from the [Corti Console](https://console.corti.app)

## Project Structure

```plaintext
medical-coding-js-sdk-example/
├── src/                     # React frontend (TypeScript)
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── backend/                 # Node.js server (TypeScript)
│   ├── server.ts
│   ├── cortiClient.ts
│   ├── codingHelper.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env                 # Your credentials
├── index.html
├── tsconfig.json
├── tsconfig.node.json
├── package.json
├── vite.config.ts
└── README.md
```

## Quick Start

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (from project root)
cd ..
npm install
```

**Note**: If you get an error about `@corti/sdk` version, check the actual installed version:
```bash
npm list @corti/sdk
```
You can find the correct version from the [Corti SDK on npm](https://www.npmjs.com/package/@corti/sdk).
Then update `backend/package.json` with the correct version number.

### 2. Configure Environment

Create `backend/.env`:

```env
CLIENT_ID=your-client-id-here
CLIENT_SECRET=your-client-secret-here
TENANT_NAME=your-tenant-name
ENVIRONMENT=us
PORT=3000
```

Get credentials from [Corti Console](https://console.corti.app) → Settings → API Credentials.

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

The backend uses `tsx` for TypeScript execution with auto-reload.

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## Usage

1. **Upload Recording**: Select an audio file and click "Upload Recording"
2. **Choose Template**: Select a document template from the dropdown
3. **Generate Document**: Click "Generate Document" to create a SOAP note
4. **Predict Codes**: Click "Predict Codes" to get ICD-10 and CPT codes
5. **View Evidence**: Click any code to expand and see supporting evidence

## API Endpoints

| Method | Endpoint                               | Description                              |
| ------ | -------------------------------------- | ---------------------------------------- |
| `POST` | `/api/interactions`                    | Create a new interaction                 |
| `POST` | `/api/interactions/:id/recording`      | Upload audio recording                   |
| `GET`  | `/api/templates`                       | List available document templates        |
| `POST` | `/api/interactions/:id/documents`      | Generate document (transcripts + facts + doc) |
| `POST` | `/api/tools/coding`                    | Predict medical codes*                   |

*_Note: The medical coding endpoint is currently implemented using a custom API helper (`codingHelper.js`) as the Corti SDK does not yet have a native method for code prediction. This endpoint makes direct REST API calls to the Corti coding service._

## Implementation Notes

### Medical Code Prediction

The `/api/tools/coding` endpoint currently uses a **custom implementation** rather than the Corti SDK because the SDK does not yet expose a native method for medical code prediction.

**Current Implementation:**
```javascript
// backend/codingHelper.js
async function predictCodes(system, context, maxCandidates) {
    const accessToken = await getAccessToken();
    
    const response = await fetch(CORTI_CODING_URL, {
        method: 'POST',
        headers: {
            'Tenant-Name': TENANT_NAME,
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ system, context, maxCandidates })
    });
    
    return response.json();
}
```

**Why This Approach?**
- The Corti JavaScript SDK doesn't currently include a `corti.coding.predict()` method
- Direct REST API calls provide the same functionality
- This approach will be replaced when the SDK adds official support

**Future Migration:**
When the SDK adds coding support, the implementation will be updated to:
```javascript
// Future SDK implementation
const codes = await corti.coding.predict(documentId, {
    systems: ['icd10cm', 'icd10pcs', 'cpt'],
    maxCandidates: 5
});
```

## Environment Variables

| Variable        | Required | Description                          |
| --------------- | -------- | ------------------------------------ |
| `CLIENT_ID`     | Yes      | Your Corti API client ID             |
| `CLIENT_SECRET` | Yes      | Your Corti API client secret         |
| `TENANT_NAME`   | Yes      | Your organization's tenant name      |
| `ENVIRONMENT`   | Yes      | Corti region: `us` or `eu`           |
| `PORT`          | No       | Backend server port (default: 3000)  |

## Troubleshooting

**"Credentials not found in .env"**
- Ensure `.env` file exists in `backend/` directory
- Verify all required variables are set
- Restart the backend server

**"Failed to upload recording"**
- Check audio file format (WAV, MP3, M4A, WebM)
- Verify file size is reasonable (< 100MB)
- Review backend logs for errors

**"Configuration denied" or authentication errors**
- Regenerate credentials in Corti Console
- Verify `TENANT_NAME` matches exactly (case-sensitive)
- Ensure `ENVIRONMENT` matches your account region

**No codes predicted**
- Verify document contains medical/clinical content
- Check backend logs for API errors
- Ensure recording has clear medical terminology

**TypeScript errors about "unknown" type**
- Use type guards: `if (err instanceof Error) { err.message }`
- Or use helper function: `getErrorMessage(err)`

**"Cannot find module" with .js extension**
- This is expected with TypeScript + ES modules
- Keep `.js` extensions in import statements
- TypeScript will handle the resolution correctly

**@corti/sdk version mismatch**
- Check actual installed version: `npm list @corti/sdk`
- Update `package.json` to match the installed version
- The SDK may not have a 1.0.0 version - use the actual version

## Development

### Development Mode (auto-reload)
```bash
# Backend (uses tsx with watch mode)
cd backend && npm run dev

# Frontend (uses Vite HMR)
npm run dev
```

### Production Build
```bash
# Frontend
npm run build
npm run preview

# Backend (compiles TypeScript to JavaScript)
cd backend
npm run build
npm start
```

### TypeScript Notes

- **Frontend**: Uses Vite with React TypeScript template
- **Backend**: Uses `tsx` for development (faster than ts-node, better ES module support)
- **Imports**: Keep `.js` extensions in imports for ES module compatibility
- **Type Safety**: All event handlers and API responses are typed

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, CSS3
- **Backend**: Node.js, Express, TypeScript, Multer
- **API Client**: [@corti/sdk](https://www.npmjs.com/package/@corti/sdk)
- **Dev Tools**: tsx (TypeScript runner), Vite (build tool)

## Resources

- [Corti Website](https://www.corti.ai/)
- [Corti Console](https://console.corti.app)
- [Corti SDK on npm](https://www.npmjs.com/package/@corti/sdk)
- [Corti API Documentation](https://docs.corti.ai)
- Support: [help@corti.ai](mailto:help@corti.ai)