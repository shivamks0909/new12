import { NextRequest, NextResponse } from "next/server";
import { getSupplierFromToken } from "@lib/supplier-auth";

export async function GET(req: NextRequest) {
  const user = await getSupplierFromToken(req);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      supplierCode: user.supplierCode
    }
  });
}
