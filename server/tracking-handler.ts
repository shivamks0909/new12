import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { randomUUID } from "crypto";
import { generateS2SToken } from "@server/s2s";

export async function handleTracking(req: NextRequest, projectCodeParam?: string) {
  const { searchParams } = new URL(req.url);
  const code = projectCodeParam || searchParams.get("code");
  const country = searchParams.get("country");
  const sup = searchParams.get("sup");
  const uid = searchParams.get("uid");

  if (!code || !country || !sup || !uid) {
    return new Response(`Missing tracking parameters (code: ${code}, country: ${country}, sup: ${sup}, uid: ${uid})`, { status: 400 });
  }

  const projectCode = code;
  const countryCode = country;
  const supplierCode = sup;
  const supplierRid = uid;

  try {
    // 1. Validate Project and Supplier
    const project = await storage.getProjectByCode(projectCode);
    if (!project || project.status !== "active") {
      console.log(`Tracking 404: Project not found or inactive. Code: ${projectCode}`);
      return new Response("Project not found or inactive", { status: 404 });
    }

    const supplier = await storage.getSupplierByCode(supplierCode);
    if (!supplier) {
      console.log(`Tracking 404: Supplier not found. Code: ${supplierCode}`);
      return new Response("Supplier not found", { status: 404 });
    }

    // 2. Validate Country Survey
    const countrySurvey = await storage.getCountrySurveyByCode(projectCode, countryCode);
    if (!countrySurvey || countrySurvey.status !== "active") {
      console.log(`Tracking 404: Survey not found for country. Code: ${projectCode}, Country: ${countryCode}`);
      return new Response("Survey not found for this country", { status: 404 });
    }

    // 3. Check for Duplicates
    const isDuplicate = await storage.checkDuplicateRespondent(projectCode, supplierCode, supplierRid);
    const currentTimeUnix = Math.floor(Date.now() / 1000).toString();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

    if (isDuplicate) {
      const oiSession = randomUUID();
      await storage.createActivityLog({
        oiSession,
        projectCode,
        eventType: "duplicate_entry",
        meta: { details: `Duplicate RID detected: ${supplierRid} for ${supplierCode} on ${projectCode}` }
      });

      const params = new URLSearchParams({
        pid: projectCode,
        uid: supplierRid,
        ip: ip,
        start: currentTimeUnix,
        end: currentTimeUnix,
        loi: "0",
        status: "Duplicate",
        country: countryCode
      });
      return NextResponse.redirect(new URL(`/pages/duplicate?${params.toString()}`, req.url));
    }

    // 4. Generate Client RID (Atomic)
    const clientRid = await storage.generateClientRID(projectCode);

    // 5. Create Respondent Session
    const oiSession = randomUUID();
    
    // S2S Generation
    let s2sToken = null;
    const s2sConfig = await storage.getS2sConfig(projectCode);
    
    if (s2sConfig && s2sConfig.requireS2S) {
      s2sToken = generateS2SToken(oiSession, s2sConfig.s2sSecret);
    }

    await storage.createRespondent({
      oiSession,
      projectCode,
      supplierCode,
      supplierRid,
      countryCode,
      clientRid,
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || "unknown",
      status: "started",
      s2sToken: s2sToken || undefined,
      fraudScore: 0,
      s2sVerified: false
    });

    // 6. Log Entry
    await storage.createActivityLog({
      oiSession,
      projectCode,
      eventType: "entry",
      meta: { details: `Respondent started. Redirecting to client survey.` }
    });

    // 7. Redirect to Client Survey URL
    let redirectUrl = countrySurvey.surveyUrl
      .replace("{RID}", clientRid)
      .replace("{oi_session}", oiSession);

    if (s2sToken) {
      const separator = redirectUrl.includes("?") ? "&" : "?";
      redirectUrl += `${separator}s2s_token=${s2sToken}`;
    }

    return NextResponse.redirect(new URL(redirectUrl));

  } catch (err: any) {
    console.error("Tracking Error:", err);
    return new Response("Internal Server Error during tracking", { status: 500 });
  }
}
