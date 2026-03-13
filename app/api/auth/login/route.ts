import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import bcrypt from "bcryptjs";
import { generateToken } from "@server/auth-helper";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 });
    }

    console.log("Login attempt for:", username);
    const admin = await storage.getAdminByUsername(username);
    console.log("Admin found:", admin ? "YES" : "NO");

    if (!admin) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    console.log("Comparing password with hash:", admin.passwordHash);
    const valid = await bcrypt.compare(password, admin.passwordHash);
    console.log("Password valid:", valid);

    if (!valid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const token = generateToken({
      id: admin.id,
      username: admin.username,
      role: 'admin'
    });

    return NextResponse.json({ 
      id: admin.id, 
      username: admin.username,
      token 
    });
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
