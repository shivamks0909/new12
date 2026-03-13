import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { verifyS2SToken } from "@server/s2s";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project_code, oi_session, status, signature_token } = body;
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    if (!project_code || !oi_session || !signature_token) {
      return NextResponse.json({ error: "Missing required S2S parameters" }, { status: 400 });
    }

    // Log the RAW S2S attempt
    await storage.createS2sLog({
      oiSession: oi_session,
      projectCode: project_code,
      status: status || 'complete',
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || "unknown",
      payload: body,
    });

    const respondent = await storage.getRespondentBySession(oi_session);
    if (!respondent) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const s2sConfig = await storage.getS2sConfig(project_code);
    if (!s2sConfig) {
      return NextResponse.json({ error: "S2S configuration not found" }, { status: 404 });
    }
    const isValid = verifyS2SToken(signature_token, oi_session, s2sConfig.s2sSecret);
    if (!isValid) {
       return NextResponse.json({ error: "Invalid S2S signature" }, { status: 401 });
    }

    // Mark as verified and complete
    await storage.verifyS2sRespondent(oi_session, status);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("S2S Callback Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
