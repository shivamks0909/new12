import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { storage } from "@server/storage";

const JWT_SECRET = process.env.JWT_SECRET || "opinion-insights-jwt-secret-2026";

export interface SupplierJWTPayload {
  userId: string;
  username: string;
  supplierId: string;
  supplierCode: string;
}

export async function getSupplierFromToken(req: NextRequest) {
  const token = req.cookies.get("supplier_token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SupplierJWTPayload;
    const user = await storage.getSupplierUserById(decoded.userId);
    
    if (!user || !user.isActive) return null;
    
    return user;
  } catch (err) {
    return null;
  }
}

export function createSupplierToken(payload: SupplierJWTPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export async function requireSupplier(req: NextRequest) {
  const supplier = await getSupplierFromToken(req);
  if (!supplier) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return supplier;
}
