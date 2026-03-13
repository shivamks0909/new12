import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { getAuthUser } from "@server/auth-helper";
import { insertSupplierAssignmentSchema } from "@shared/schema";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectCode = searchParams.get("projectCode");
  const supplierId = searchParams.get("supplierId");

  const assignments = await storage.getSupplierAssignments(
    projectCode || undefined,
    supplierId || undefined
  );
  return NextResponse.json(assignments);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { projectCode, countryCode, supplierId } = body;

  // Check for duplicate
  const existing = await storage.getSupplierAssignmentByCombo(projectCode, countryCode, supplierId);
  if (existing) {
    return NextResponse.json({ message: "Assignment already exists for this project, country, and supplier." }, { status: 409 });
  }

  const parsed = insertSupplierAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed", errors: parsed.error.flatten() }, { status: 400 });
  }

  const assignment = await storage.createSupplierAssignment(parsed.data);
  return NextResponse.json(assignment, { status: 201 });
}
