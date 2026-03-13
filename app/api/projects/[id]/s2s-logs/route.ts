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
  const logs = await storage.getS2sLogs(id);
  return NextResponse.json(logs);
}
