import dotenv from "dotenv";

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const TENANT_NAME = process.env.TENANT_NAME;
const ENVIRONMENT = process.env.ENVIRONMENT;

const CORTI_CODING_URL = `https://api.${ENVIRONMENT}.corti.app/v2/tools/coding`;

// getAccessToken() retrieves your temporary Bearer token from Corti API
async function getAccessToken() {
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

    const data = await res.json();
    return data.access_token;
}

// predictCodes() is called in the coding REST endpoint to retrieve code predictions
async function predictCodes(system = ["icd10cm", "icd10pcs", "cpt"], context, maxCandidates) {

    // getAccessToken() is called each time to refresh token and maintain data security
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