import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { authMiddleware } from "@server/auth-helper";

// Real Excel generation would require a library like exceljs or xlsx.
// Since we want to avoid adding many new dependencies, we'll return a CSV that Excel can open.
export const GET = authMiddleware(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const supplierId = searchParams.get("supplierId");
  
  if (!supplierId) {
    return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
  }

  const assignments = await storage.getSupplierAssignmentsForExport(supplierId);
    
  // Create CSV header
  const headers = [
    "ID", "OI Session", "Supplier", "Status", "IP Address", 
    "Started At", "Completed At", "Survey URL"
  ].join(",");

  const rows = assignments.map(a => [
    a.id,
    a.oiSession,
    a.supplierName,
    a.status,
    a.ipAddress,
    a.startedAt ? new Date(a.startedAt).toLocaleString() : "",
    a.completedAt ? new Date(a.completedAt).toLocaleString() : "",
    a.surveyUrl
  ].map(v => `"${v || ""}"`).join(","));

  const csv = [headers, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="supplier-assignments-${supplierId}-${new Date().toISOString()}.csv"`,
    },
  });
});
