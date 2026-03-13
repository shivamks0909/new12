import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { authMiddleware } from "@server/auth-helper";

export const GET = authMiddleware(async (req: NextRequest) => {
  const pulse = await storage.getSystemPulseStats();
  return NextResponse.json(pulse);
});
