import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@server/auth-helper";
import { storage } from "@server/storage";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const admin = await storage.getAdminById(user.id);
  if (!admin) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ 
    id: admin.id, 
    username: admin.username 
  });
}
