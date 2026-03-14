import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { authMiddleware, AuthUser } from "@server/auth-helper";
import bcrypt from "bcryptjs";
import { insertSupplierUserSchema } from "@shared/schema";

export const GET = authMiddleware(async (req: NextRequest) => {
  try {
    const users = await storage.listSupplierUsers();
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const POST = authMiddleware(async (req: NextRequest, authUser: AuthUser) => {
  try {
    const body = await req.json();
    const parsed = insertSupplierUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error }, { status: 400 });
    }

    const { username, passwordHash, supplierId, supplierCode } = parsed.data;
    
    // Check if user exists
    const existing = await storage.getSupplierUserByUsername(username);
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(passwordHash, 10);
    
    const user = await storage.createSupplierUser({
      username,
      passwordHash: hashed,
      supplierId,
      supplierCode,
      isActive: true,
      createdBy: authUser.username
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const DELETE = authMiddleware(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await storage.deleteSupplierUser(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
