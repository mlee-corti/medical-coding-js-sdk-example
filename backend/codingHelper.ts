import dotenv from "dotenv";

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;
const TENANT_NAME = process.env.TENANT_NAME as string;
const ENVIRONMENT = process.env.ENVIRONMENT as string;

const CORTI_CODING_URL = `https://api.${ENVIRONMENT}.corti.app/v2/tools/coding`;

interface TokenResponse {
    access_token: string;
}

interface Context {
    type: string;
    documentId?: string;
}

async function getAccessToken(): Promise<string> {
    const tokenUrl = `https://auth.${ENVIRONMENT}.corti.app/realms/${TENANT_NAME}/protocol/openid-connect/token`;

    const params = new URLSearchParams();
    params.append("client_id", CLIENT_ID);
    params.append("client_secret", CLIENT_SECRET);
    params.append("grant_type", "client_credentials");
    params.append("scope", "openid");

    const res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    if (!res.ok) {
        throw new Error(`Failed to get token, status ${res.status}`);
    }

    const data: TokenResponse = await res.json();
    return data.access_token;
}

async function predictCodes(
    system: string[] = ["icd10cm", "icd10pcs", "cpt"], 
    context: Context[], 
    maxCandidates: number
) {
    const accessToken = await getAccessToken();

    const codes = await fetch(CORTI_CODING_URL, {
        method: 'POST',
        headers: {
            'Tenant-Name': TENANT_NAME,
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': "application/json"
        },
        body: JSON.stringify({
            system: system,
            context: context,
            maxCandidates
        })
    });

    return codes.json();
}

export { predictCodes };