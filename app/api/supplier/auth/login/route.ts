import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import bcrypt from "bcryptjs";
import { createSupplierToken } from "@lib/supplier-auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password required" }, { status: 400 });
    }

    const user = await storage.getSupplierUserByUsername(username);

    if (!user || !user.isActive) {
      return NextResponse.json({ message: "Invalid credentials or inactive account" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Update last login
    await storage.updateSupplierUser(user.id, { lastLogin: new Date() } as any);

    const token = createSupplierToken({
      userId: user.id,
      username: user.username,
      supplierId: user.supplierId,
      supplierCode: user.supplierCode
    });

    const response = NextResponse.json({ 
      user: {
        id: user.id,
        username: user.username,
        supplierCode: user.supplierCode
      }
    });

    response.cookies.set("supplier_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (err) {
    console.error("Supplier login error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
