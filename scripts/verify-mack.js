import { storage } from "../server/storage.js";
import crypto from "crypto";

async function verifyMack() {
  try {
    const projectCode = "PRJ_TEST"; 
    const supplierCode = "MACK";
    const supplierRid = "MACK_VERIFY_" + Date.now();
    const oiSession = "OI_" + crypto.randomUUID().substring(0, 8);
    
    console.log("Creating test respondent for Mack Insights...");
    await storage.createRespondent({
      projectCode,
      supplierCode,
      supplierRid,
      oiSession,
      status: "started",
      ipAddress: "127.0.0.1",
      userAgent: "Mack-Verifier"
    });
    
    console.log("Respondent created with oi_session:", oiSession);
    
    const baseUrl = "https://opinion-insights-router.vercel.app";
    const callbackUrl = `${baseUrl}/callback?oi_session=${oiSession}&status=quotafull`;
    
    console.log("\n--- TEST URL ---");
    console.log(callbackUrl);
    console.log("--- TEST URL ---\n");
    
    console.log("Expected final redirect URL:");
    console.log(`https://dashboard.mackinsights.com/redirect/quotafull?pid=${projectCode}&uid=${supplierRid}`);
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

verifyMack()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
