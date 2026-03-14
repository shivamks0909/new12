import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { redirectToSupplierOrLanding } from "./redirect-helper";

export async function handleCallback(req: Request, status: string) {
  const url = new URL(req.url);
  const oi_session = url.searchParams.get("oi_session");

  if (!oi_session) {
    return new Response("Missing oi_session", { status: 400 });
  }

  const respondent = await storage.getRespondentBySession(oi_session);
  if (!respondent) {
    return new Response("Session not found", { status: 404 });
  }

  let finalStatus = status;

  // S2S Verification Check for completions
  if (status === 'complete') {
    const s2sConfig = await storage.getS2sConfig(respondent.projectCode || "");
    if (s2sConfig && s2sConfig.requireS2S && !respondent.s2sVerified) {
      finalStatus = 'security-terminate';
      await storage.createActivityLog({
        oiSession: respondent.oiSession,
        projectCode: respondent.projectCode,
        eventType: 'security_alert',
        meta: { details: `Fraud attempt blocked: Manual client complete without S2S verification.` }
      });
      await storage.updateRespondentStatus(respondent.oiSession, 'fraud');
    }
  }

  // 5. Get Redirect Info
  const { response, url: redirectUrl } = await redirectToSupplierOrLanding(respondent, finalStatus, req as any);

  // Update Status and Redirect URL if not already fraud/security
  if (finalStatus !== 'security-terminate') {
     await storage.updateRespondentStatus(respondent.oiSession, finalStatus, redirectUrl);
  } else {
     await storage.updateRespondentStatus(respondent.oiSession, 'fraud', redirectUrl);
  }

  return response;
}
