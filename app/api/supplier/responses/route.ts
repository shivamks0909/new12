import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireSupplier } from "@lib/supplier-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSupplier(req);
    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get assigned project ids/codes
    const access = await storage.getSupplierProjectAccess(user.id);
    const projectCodes = access.map(a => a.projectCode);

    if (projectCodes.length === 0) {
      return NextResponse.json({ responses: [] });
    }

    const responses = await storage.getSupplierRespondents(user.supplierCode, projectCodes);

    return NextResponse.json({
      responses
    });
  } catch (error: any) {
    console.error("Supplier Responses API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
