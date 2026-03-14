import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireSupplier } from "@lib/supplier-auth";
import { Project } from "@shared/schema";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSupplier(req);
    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await storage.getSupplierDashboardStats(user.id, user.supplierCode);
    const projects = await storage.getAssignedProjects(user.id);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

    const assignedProjects = projects.map((p: Project) => ({
      id: p.id,
      projectCode: p.projectCode,
      projectName: p.projectName,
      supplierLink: `${baseUrl}/prescreener/new?pid=${p.projectCode}&sc=${user.supplierCode}&uid={uid}`,
      status: p.status
    }));

    return NextResponse.json({
      totalTraffic: stats.totalRespondents,
      completes: stats.completes,
      terminates: stats.terminates,
      quotafulls: stats.quotafulls,
      securityTerminates: stats.securityTerminates,
      assignedProjects
    });
  } catch (error: any) {
    console.error("Supplier Dashboard API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
