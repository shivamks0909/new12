import { createClient } from "@insforge/sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory for robust .env loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const baseUrl = process.env.INSFORGE_BASE_URL;
const anonKey = process.env.INSFORGE_API_KEY;

if (!baseUrl || !anonKey) {
  console.error("CRITICAL: InsForge environment variables (INSFORGE_BASE_URL, INSFORGE_API_KEY) are missing!");
}

export const insforge = createClient({
  baseUrl: baseUrl!,
  anonKey: anonKey!,
});

console.log('InsForge Client Initialized:', {
  baseUrl,
  hasDatabase: !!insforge.database,
  hasAuth: !!insforge.auth,
  hasStorage: !!insforge.storage,
});
