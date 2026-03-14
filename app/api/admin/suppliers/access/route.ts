import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { authMiddleware, AuthUser } from "@server/auth-helper";
import { insertSupplierProjectAccessSchema } from "@shared/schema";

export const GET = authMiddleware(async (req: NextRequest) => {
  try {
    const access = await storage.listSupplierProjectAccess();
    return NextResponse.json(access);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const POST = authMiddleware(async (req: NextRequest, authUser: AuthUser) => {
  try {
    const body = await req.json();
    const parsed = insertSupplierProjectAccessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error }, { status: 400 });
    }

    const access = await storage.assignProjectToSupplier({
      ...parsed.data,
      assignedBy: authUser.username
    });

    return NextResponse.json(access, { status: 201 });
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

    await storage.removeProjectFromSupplier(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
