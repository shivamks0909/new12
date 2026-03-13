import { NextResponse } from "next/server";
import { storage } from "@server/storage";

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

  if (respondent.status !== 'started' && respondent.status !== 'pending') {
    // In some cases, we might allow multiple callbacks, but usually, it's one-way.
    // For now, let's just let it pass if it's the same status, or log a warning.
  }

  let finalStatus = status;

  // S2S Verification Check for completions
  if (status === 'complete') {
    const s2sConfig = await storage.getS2sConfig(respondent.projectCode || "");
    if (s2sConfig && s2sConfig.requireS2S && !respondent.s2sVerified) {
      // Fraud detected! Mark as security-terminate
      finalStatus = 'security-terminate';
      await storage.createActivityLog({
        oiSession: respondent.oiSession,
        projectCode: respondent.projectCode,
        eventType: 'security_alert',
        meta: { details: `Fraud attempt blocked: Manual client complete without S2S verification.` }
      });
      
      // We don't update respondent status to complete here, it stays 'started' or becomes 'fraud'
      await storage.updateRespondentStatus(respondent.oiSession, 'fraud');
    }
  }

  // Update Status if not already fraud/security
  if (finalStatus !== 'security-terminate') {
     await storage.updateRespondentStatus(respondent.oiSession, finalStatus);
  }

  // Log Activity
  await storage.createActivityLog({
    oiSession: respondent.oiSession,
    projectCode: respondent.projectCode,
    eventType: 'callback',
    meta: { details: `Received ${status} callback from client.` }
  });

  // Calculate LOI
  const startTime = respondent.startedAt ? Math.floor(new Date(respondent.startedAt).getTime() / 1000) : Math.floor(Date.now() / 1000);
  const endTime = Math.floor(Date.now() / 1000);
  const loi = Math.round((endTime - startTime) / 60);

  // Construct params for internal landing page
  const internalParams = new URLSearchParams({
    pid: respondent.projectCode || "",
    uid: respondent.supplierRid || "",
    ip: respondent.ipAddress || "unknown",
    start: startTime.toString(),
    end: endTime.toString(),
    loi: loi.toString(),
    status: finalStatus,
    country: respondent.countryCode || ""
  });

  // Map status to paths
  let internalPath = "/pages/terminate";
  if (finalStatus === 'complete') internalPath = "/pages/complete";
  if (finalStatus === 'quotafull') internalPath = "/pages/quotafull";
  if (finalStatus === 'security-terminate' || finalStatus === 'fraud') internalPath = "/pages/security";

  // Redirect to the display page
  return NextResponse.redirect(new URL(`${internalPath}?${internalParams.toString()}`, req.url));
}
