import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { authMiddleware } from "@server/auth-helper";
import { insertProjectSchema } from "@shared/schema";

export const GET = authMiddleware(async (req: NextRequest) => {
  const projects = await storage.getProjects();
  return NextResponse.json(projects);
});

export const POST = authMiddleware(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = insertProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed", errors: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const project = await storage.createProject(parsed.data);
    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("Project creation error:", error);
    return NextResponse.json({ 
      message: "Failed to create project", 
      error: error.message 
    }, { status: 500 });
  }
});
