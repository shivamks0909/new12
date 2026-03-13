import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { getAuthUser } from "@server/auth-helper";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await storage.getProjectById(id);
  if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 });

  return NextResponse.json(project);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const project = await storage.updateProject(id, body);
  if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 });

  return NextResponse.json(project);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await storage.deleteProject(id);
  return NextResponse.json({ message: "Deleted" });
}
