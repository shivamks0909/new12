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
  const config = await storage.getS2sConfig(id);
  return NextResponse.json(config || null);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { s2sSecret, requireS2S } = await req.json();
  const existing = await storage.getS2sConfig(id);

  if (existing) {
    const updated = await storage.updateS2sConfig(id, { s2sSecret, requireS2S });
    return NextResponse.json(updated);
  } else {
    const created = await storage.createS2sConfig({
      projectCode: id,
      s2sSecret,
      requireS2S
    });
    return NextResponse.json(created, { status: 201 });
  }
}
