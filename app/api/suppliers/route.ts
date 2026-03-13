import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { getAuthUser } from "@server/auth-helper";
import { insertSupplierSchema } from "@shared/schema";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const suppliers = await storage.getSuppliers();
  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = insertSupplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed", errors: parsed.error.flatten() }, { status: 400 });
  }

  const supplier = await storage.createSupplier(parsed.data);
  return NextResponse.json(supplier, { status: 201 });
}
