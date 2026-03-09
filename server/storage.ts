import { eq, and, desc, sql, gte, lte, like, inArray, count } from "drizzle-orm";
import { db } from "./db";
import {
  admins, clients, projects, suppliers, responses,
  type Admin, type InsertAdmin,
  type Client, type InsertClient,
  type Project, type InsertProject,
  type Supplier, type InsertSupplier,
  type SurveyResponse, type InsertResponse,
} from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getAdminById(id: number): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdminPassword(id: number, passwordHash: string): Promise<void>;

  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<void>;

  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectByPid(pid: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;

  getSuppliersByProject(projectId: number): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  getSupplierByCode(projectId: number, supplierCode: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<void>;

  getResponses(filters?: {
    projectId?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: SurveyResponse[]; total: number }>;
  getResponse(id: number): Promise<SurveyResponse | undefined>;
  getResponseBySession(oiSession: string): Promise<SurveyResponse | undefined>;
  createResponse(response: InsertResponse): Promise<SurveyResponse>;
  updateResponseStatus(id: number, status: string): Promise<SurveyResponse | undefined>;
  bulkDeleteResponses(ids: number[]): Promise<void>;
  checkDuplicateIp(projectId: number, ipAddress: string): Promise<boolean>;
  checkDuplicateUid(projectId: number, uid: string): Promise<boolean>;

  getStats(): Promise<{
    totalToday: number;
    completesToday: number;
    terminatesToday: number;
    quotafullsToday: number;
  }>;
  getLatestResponses(limit: number): Promise<SurveyResponse[]>;
  getDailyResponseCounts(days: number): Promise<{ date: string; count: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin;
  }

  async getAdminById(id: number): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [created] = await db.insert(admins).values(admin).returning();
    return created;
  }

  async updateAdminPassword(id: number, passwordHash: string): Promise<void> {
    await db.update(admins).set({ passwordHash }).where(eq(admins.id, id));
  }

  async getClients(): Promise<Client[]> {
    return db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [created] = await db.insert(clients).values(client).returning();
    return created;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined> {
    const [updated] = await db.update(clients).set(client).where(eq(clients.id, id)).returning();
    return updated;
  }

  async deleteClient(id: number): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectByPid(pid: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.pid, pid));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db.update(projects).set(project).where(eq(projects.id, id)).returning();
    return updated;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.projectId, id));
    await db.delete(responses).where(eq(responses.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getSuppliersByProject(projectId: number): Promise<Supplier[]> {
    return db.select().from(suppliers).where(eq(suppliers.projectId, projectId));
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async getSupplierByCode(projectId: number, supplierCode: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(
      and(eq(suppliers.projectId, projectId), eq(suppliers.supplierCode, supplierCode))
    );
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [created] = await db.insert(suppliers).values(supplier).returning();
    return created;
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updated] = await db.update(suppliers).set(supplier).where(eq(suppliers.id, id)).returning();
    return updated;
  }

  async deleteSupplier(id: number): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  async getResponses(filters?: {
    projectId?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: SurveyResponse[]; total: number }> {
    const conditions = [];
    if (filters?.projectId) conditions.push(eq(responses.projectId, filters.projectId));
    if (filters?.status) conditions.push(eq(responses.status, filters.status));
    if (filters?.startDate) conditions.push(gte(responses.createdAt, filters.startDate));
    if (filters?.endDate) conditions.push(lte(responses.createdAt, filters.endDate));
    if (filters?.search) conditions.push(like(responses.uid, `%${filters.search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    const [totalResult] = await db.select({ count: count() }).from(responses).where(where);
    const data = await db.select().from(responses).where(where)
      .orderBy(desc(responses.createdAt))
      .limit(limit)
      .offset(offset);

    return { data, total: totalResult.count };
  }

  async getResponse(id: number): Promise<SurveyResponse | undefined> {
    const [response] = await db.select().from(responses).where(eq(responses.id, id));
    return response;
  }

  async getResponseBySession(oiSession: string): Promise<SurveyResponse | undefined> {
    const [response] = await db.select().from(responses).where(eq(responses.oiSession, oiSession));
    return response;
  }

  async createResponse(response: InsertResponse): Promise<SurveyResponse> {
    const [created] = await db.insert(responses).values(response).returning();
    return created;
  }

  async updateResponseStatus(id: number, status: string): Promise<SurveyResponse | undefined> {
    const [updated] = await db.update(responses).set({ status, updatedAt: new Date() })
      .where(eq(responses.id, id)).returning();
    return updated;
  }

  async bulkDeleteResponses(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await db.delete(responses).where(inArray(responses.id, ids));
  }

  async checkDuplicateIp(projectId: number, ipAddress: string): Promise<boolean> {
    const [result] = await db.select({ count: count() }).from(responses)
      .where(and(eq(responses.projectId, projectId), eq(responses.ipAddress, ipAddress)));
    return result.count > 0;
  }

  async checkDuplicateUid(projectId: number, uid: string): Promise<boolean> {
    const [result] = await db.select({ count: count() }).from(responses)
      .where(and(eq(responses.projectId, projectId), eq(responses.uid, uid)));
    return result.count > 0;
  }

  async getStats(): Promise<{
    totalToday: number;
    completesToday: number;
    terminatesToday: number;
    quotafullsToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCondition = gte(responses.createdAt, today);

    const [total] = await db.select({ count: count() }).from(responses).where(todayCondition);
    const [completes] = await db.select({ count: count() }).from(responses)
      .where(and(todayCondition, eq(responses.status, "complete")));
    const [terminates] = await db.select({ count: count() }).from(responses)
      .where(and(todayCondition, eq(responses.status, "terminate")));
    const [quotafulls] = await db.select({ count: count() }).from(responses)
      .where(and(todayCondition, eq(responses.status, "quotafull")));

    return {
      totalToday: total.count,
      completesToday: completes.count,
      terminatesToday: terminates.count,
      quotafullsToday: quotafulls.count,
    };
  }

  async getLatestResponses(limit: number): Promise<SurveyResponse[]> {
    return db.select().from(responses).orderBy(desc(responses.createdAt)).limit(limit);
  }

  async getDailyResponseCounts(days: number): Promise<{ date: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const result = await db.select({
      date: sql<string>`DATE(${responses.createdAt})::text`,
      count: count(),
    }).from(responses)
      .where(gte(responses.createdAt, startDate))
      .groupBy(sql`DATE(${responses.createdAt})`)
      .orderBy(sql`DATE(${responses.createdAt})`);

    return result;
  }
}

async function seedAdmin() {
  const existing = await db.select().from(admins).where(eq(admins.username, "admin"));
  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await db.insert(admins).values({ username: "admin", passwordHash });
    console.log("Seeded admin user (username: admin, password: admin123)");
  }
}

seedAdmin().catch(console.error);

export const storage = new DatabaseStorage();
