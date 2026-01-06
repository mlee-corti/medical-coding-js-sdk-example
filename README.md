# Medical Coding Assistant

A full-stack application for processing medical audio recordings, generating clinical documents, and predicting medical codes using the Corti API and JavaScript SDK.

## Features

- **Audio Recording Upload**: Upload and process medical audio recordings
- **Template Selection**: Choose from available document templates
- **Clinical Fact Extraction**: Automatic extraction of structured medical data using Asynchronous Extraction
- **Document Generation**: Generate SOAP notes and clinical documents
- **Medical Code Prediction**: Predict ICD-10-CM, ICD-10-PCS, and CPT codes with evidence
- **Interactive UI**: Expandable codes with evidence, progressive workflow, visual feedback

## Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** (included with Node.js)
- **Corti API credentials** - Get them from the [Corti Console](https://console.corti.app)

## Project Structure

```plaintext
medical-coding-app/
├── src/                     # React frontend
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── backend/                 # Node.js server
│   ├── server.js
│   ├── cortiClient.js
│   ├── codingHelper.js
│   ├── package.json
│   └── .env                 # Your credentials
├── index.html
├── package.json
├── vite.config.js
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
| `ENVIRONMENT`   | Yes      | Corti region: `us`, `eu`, or `dev`   |
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

## Development

### Development Mode (auto-reload)
```bash
# Backend
cd backend && npm run dev

# Frontend (from root)
npm run dev
```

### Production Build
```bash
# Frontend
npm run build
npm run preview

# Backend
cd backend && npm start
```

## Tech Stack

- **Frontend**: React 19, Vite, CSS3
- **Backend**: Node.js, Express, Multer
- **API Client**: [@corti/sdk](https://www.npmjs.com/package/@corti/sdk)

## Resources

- [Corti Website](https://www.corti.ai/)
- [Corti Console](https://console.corti.app)
- [Corti SDK on npm](https://www.npmjs.com/package/@corti/sdk)
- [Corti API Documentation](https://docs.corti.ai)
- Support: [help@corti.ai](mailto:help@corti.ai)