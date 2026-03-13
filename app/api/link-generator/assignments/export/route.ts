import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { getAuthUser } from "@server/auth-helper";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const assignments = await storage.getSupplierAssignments();
  
  const headers = ["ID", "Project Code", "Project Name", "Country Code", "Supplier Code", "Supplier Name", "Link", "Status", "Notes", "Created At"];
  const rows = assignments.map(a => [
    a.id,
    a.projectCode,
    `"${a.projectName}"`,
    a.countryCode,
    a.supplierCode,
    `"${a.supplierName}"`,
    a.generatedLink,
    a.status,
    `"${a.notes || ""}"`,
    a.createdAt instanceof Date ? a.createdAt.toISOString() : new Date(a.createdAt).toISOString()
  ]);

  const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
  
  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=supplier_assignments_export.csv"
    }
  });
}
