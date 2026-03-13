import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { authMiddleware } from "@server/auth-helper";

export const GET = authMiddleware(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const projectIds = searchParams.get("projectIds")?.split(",") || [];
  
  // Use the first projectId if available, or undefined for all
  const respondents = await storage.getExportData(projectIds.length > 0 ? projectIds : undefined);
    
  // Create CSV header
  const headers = ["ID", "OI Session", "Status", "IP Address", "Created At"].join(",");
  const rows = respondents.map(r => [
    r.id,
    r.oiSession,
    r.status,
    r.ipAddress,
    new Date(r.createdAt).toISOString()
  ].map(v => `"${v || ""}"`).join(","));

  const csv = [headers, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="respondents-${new Date().toISOString()}.csv"`,
    },
  });
});
