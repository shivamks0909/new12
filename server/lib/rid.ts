import { db } from "../db";
import { projects } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export async function generateClientRID(projectCode: string): Promise<string> {
    const [project] = await db
        .update(projects)
        .set({
            ridCounter: sql`${projects.ridCounter} + 1`,
        })
        .where(eq(projects.projectCode, projectCode))
        .returning();

    if (!project) {
        throw new Error(`Project with code ${projectCode} not found`);
    }

    const prefix = project.ridPrefix || "";
    const countryCode = project.ridCountryCode || "";
    const padding = project.ridPadding || 4;
    const counter = project.ridCounter || 1;

    const paddedCounter = counter.toString().padStart(padding, "0");
    return `${prefix}${countryCode}${paddedCounter}`;
}
