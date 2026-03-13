import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { getAuthUser } from "@server/auth-helper";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const assignment = await storage.updateSupplierAssignment(id, body);
  if (!assignment) return NextResponse.json({ message: "Assignment not found" }, { status: 404 });

  return NextResponse.json(assignment);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await storage.deleteSupplierAssignment(id);
  return NextResponse.json({ message: "Deleted" });
}
