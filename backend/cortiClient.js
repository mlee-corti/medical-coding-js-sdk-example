import dotenv from "dotenv";

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const TENANT_NAME = process.env.TENANT_NAME;
const ENVIRONMENT = process.env.ENVIRONMENT;

console.log("CLIENT_ID:", CLIENT_ID);
console.log("CLIENT_SECRET:", CLIENT_SECRET);
console.log("TENANT_NAME:", TENANT_NAME);
console.log("ENVIRONMENT:", ENVIRONMENT);

if (!CLIENT_ID || !CLIENT_SECRET || !TENANT_NAME) {
    console.error("Error: Credentials not found in .env");
    process.exit(1);
}

import { CortiClient } from "@corti/sdk";

const cortiClient = new CortiClient({
    environment: ENVIRONMENT,
    auth: {
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET
    },
    tenantName: TENANT_NAME
});

console.log("Corti client initialized");

export { cortiClient };