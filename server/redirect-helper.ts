import { NextRequest, NextResponse } from "next/server";
import { storage } from "./storage";

export async function redirectToSupplierOrLanding(respondent: any, status: string, req: NextRequest) {
  const isSupplier = respondent.supplierCode && 
                     respondent.supplierCode !== 'direct' && 
                     respondent.supplierCode !== 'unknown' &&
                     respondent.supplierCode !== 'DIRECT';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  if (isSupplier) {
    // SUPPLIER FLOW — go directly to supplier, skip our landing page
    // 1. Get supplier to find the redirect URL for this status
    const supplier = await storage.getSupplierByCode(respondent.supplierCode);
    
    let redirectUrl = "";
    if (supplier) {
      switch (status) {
        case 'complete': redirectUrl = supplier.completeUrl || ""; break;
        case 'terminate': redirectUrl = supplier.terminateUrl || ""; break;
        case 'quotafull': redirectUrl = supplier.quotafullUrl || ""; break;
        case 'security-terminate': redirectUrl = supplier.securityUrl || ""; break;
      }
    }

    // 2. Fallback if no specific url found (use status page)
    if (!redirectUrl) {
      const pageName = status === 'security-terminate' ? 'security' : status;
      redirectUrl = `${baseUrl}/pages/${pageName}?pid=${respondent.projectCode}&uid=${respondent.supplierRid}`;
    } else {
      // Replace macros if any
      const rid = respondent.supplierRid || "";
      const pid = respondent.projectCode || "";
      const s2s_token = respondent.s2sToken || "";

      redirectUrl = redirectUrl
        .replaceAll("{{RID}}", rid)
        .replaceAll("{{rid}}", rid)
        .replaceAll("{{uid}}", rid)
        .replaceAll("{{UID}}", rid)
        .replaceAll("{RID}", rid)
        .replaceAll("[RID]", rid)
        .replaceAll("{rid}", rid)
        .replaceAll("{uid}", rid)
        .replaceAll("[UID]", rid)
        .replaceAll("{{PID}}", pid)
        .replaceAll("{{pid}}", pid)
        .replaceAll("{PID}", pid)
        .replaceAll("[PID]", pid)
        .replaceAll("{pid}", pid)
        .replaceAll("{{oi_session}}", respondent.oiSession)
        .replaceAll("{oi_session}", respondent.oiSession)
        .replaceAll("{{s2s_token}}", s2s_token)
        .replaceAll("{status}", status);
    }

    return { response: NextResponse.redirect(new URL(redirectUrl)), url: redirectUrl };
  } else {
    // DIRECT USER FLOW — show our landing page
    const pageName = status === 'security-terminate' ? 'security' : status;
    const landingUrl = `${baseUrl}/pages/${pageName}?pid=${respondent.projectCode}&uid=${respondent.supplierRid}`;
    return { response: NextResponse.redirect(new URL(landingUrl)), url: landingUrl };
  }
}
