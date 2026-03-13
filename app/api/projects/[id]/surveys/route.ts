import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { getAuthUser } from "@server/auth-helper";
import { insertCountrySurveySchema } from "@shared/schema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const surveys = await storage.getCountrySurveys(id);
  return NextResponse.json(surveys);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await storage.getProjectById(id);
  if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 });

  const body = await req.json();
  const parsed = insertCountrySurveySchema.safeParse({ 
    ...body, 
    projectId: id,
    projectCode: body.projectCode || project.projectCode 
  });
  
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed", errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const survey = await storage.createCountrySurvey(parsed.data);
    return NextResponse.json(survey, { status: 201 });
  } catch (error: any) {
    console.error("Survey creation error:", error);
    return NextResponse.json({ message: "Failed to create survey", error: error.message }, { status: 500 });
  }
}
