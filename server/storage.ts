import { eq, and, desc, sql, gte } from "drizzle-orm";
import { db } from "./db";
import {
  admins, projects, countrySurveys, suppliers, respondents, activityLogs, clients,
  type Admin, type InsertAdmin,
  type Project, type InsertProject,
  type CountrySurvey, type InsertCountrySurvey,
  type Supplier, type InsertSupplier,
  type Respondent, type InsertRespondent,
  type ActivityLog, type InsertActivityLog,
  type Client, type InsertClient
} from "@shared/schema";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface IStorage {
  // Auth
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getAdminById(id: number): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdminPassword(id: number, passwordHash: string): Promise<void>;

  // Projects
  getProjects(): Promise<Project[]>;
  getProjectById(id: number): Promise<Project | undefined>;
  getProjectByCode(projectCode: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;

  // Country Surveys
  getCountrySurveys(projectId: number): Promise<CountrySurvey[]>;
  getCountrySurveyByCode(projectCode: string, countryCode: string): Promise<CountrySurvey | undefined>;
  createCountrySurvey(survey: InsertCountrySurvey): Promise<CountrySurvey>;
  deleteCountrySurvey(id: number): Promise<void>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplierById(id: number): Promise<Supplier | undefined>;
  getSupplierByCode(code: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<void>;

  // Respondents (Tracking)
  createRespondent(respondent: InsertRespondent): Promise<Respondent>;
  getRespondentBySession(oiSession: string): Promise<Respondent | undefined>;
  updateRespondentStatus(oiSession: string, status: string): Promise<Respondent | undefined>;
  checkDuplicateRespondent(projectCode: string, supplierCode: string, supplierRid: string): Promise<boolean>;

  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(oiSession: string): Promise<ActivityLog[]>;

  // Stats
  getDashboardStats(): Promise<{
    totalToday: number;
    completesToday: number;
    terminatesToday: number;
    quotafullsToday: number;
  }>;

  // Clients
  getClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<void>;
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

  // Projects
  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectByCode(projectCode: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.projectCode, projectCode));
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
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Country Surveys
  async getCountrySurveys(projectId: number): Promise<CountrySurvey[]> {
    return db.select().from(countrySurveys).where(eq(countrySurveys.projectId, projectId));
  }

  async getCountrySurveyByCode(projectCode: string, countryCode: string): Promise<CountrySurvey | undefined> {
    const [result] = await db.select().from(countrySurveys)
      .where(and(eq(countrySurveys.projectCode, projectCode), eq(countrySurveys.countryCode, countryCode)));
    return result;
  }

  async createCountrySurvey(survey: InsertCountrySurvey): Promise<CountrySurvey> {
    const [created] = await db.insert(countrySurveys).values(survey).returning();
    return created;
  }

  async deleteCountrySurvey(id: number): Promise<void> {
    await db.delete(countrySurveys).where(eq(countrySurveys.id, id));
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  async getSupplierById(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async getSupplierByCode(code: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.code, code));
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

  // Respondents
  async createRespondent(respondent: InsertRespondent): Promise<Respondent> {
    const [created] = await db.insert(respondents).values(respondent).returning();
    return created;
  }

  async getRespondentBySession(oiSession: string): Promise<Respondent | undefined> {
    const [res] = await db.select().from(respondents).where(eq(respondents.oiSession, oiSession));
    return res;
  }

  async updateRespondentStatus(oiSession: string, status: string): Promise<Respondent | undefined> {
    const [updated] = await db.update(respondents)
      .set({ status: status as any, completedAt: status !== 'started' ? new Date() : null })
      .where(eq(respondents.oiSession, oiSession))
      .returning();
    return updated;
  }

  async checkDuplicateRespondent(projectCode: string, supplierCode: string, supplierRid: string): Promise<boolean> {
    const [existing] = await db.select({ count: sql`count(*)` })
      .from(respondents)
      .where(and(
        eq(respondents.projectCode, projectCode),
        eq(respondents.supplierCode, supplierCode),
        eq(respondents.supplierRid, supplierRid)
      ));
    return Number(existing.count) > 0;
  }

  // Activity Logs
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [created] = await db.insert(activityLogs).values(log).returning();
    return created;
  }

  async getActivityLogs(oiSession: string): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).where(eq(activityLogs.oiSession, oiSession)).orderBy(desc(activityLogs.createdAt));
  }

  // Stats
  async getDashboardStats(): Promise<{
    totalToday: number;
    completesToday: number;
    terminatesToday: number;
    quotafullsToday: number;
  }> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [total] = await db.select({ count: sql`count(*)` }).from(respondents).where(gte(respondents.startedAt, startOfToday));
    const [completes] = await db.select({ count: sql`count(*)` }).from(respondents).where(and(gte(respondents.startedAt, startOfToday), eq(respondents.status, "complete")));
    const [terminates] = await db.select({ count: sql`count(*)` }).from(respondents).where(and(gte(respondents.startedAt, startOfToday), eq(respondents.status, "terminate")));
    const [quotafulls] = await db.select({ count: sql`count(*)` }).from(respondents).where(and(gte(respondents.startedAt, startOfToday), eq(respondents.status, "quotafull")));

    return {
      totalToday: Number(total.count),
      completesToday: Number(completes.count),
      terminatesToday: Number(terminates.count),
      quotafullsToday: Number(quotafulls.count),
    };
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return db.select().from(clients).orderBy(desc(clients.createdAt));
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
}

export class MemStorage implements IStorage {
  private admins: Map<number, Admin>;
  private projects: Map<number, Project>;
  private countrySurveys: Map<number, CountrySurvey>;
  private suppliers: Map<number, Supplier>;
  private respondents: Map<number, Respondent>;
  private activityLogs: Map<number, ActivityLog>;
  private clients: Map<number, Client>;
  private nextIds: Record<string, number>;

  constructor() {
    this.admins = new Map();
    this.projects = new Map();
    this.countrySurveys = new Map();
    this.suppliers = new Map();
    this.respondents = new Map();
    this.activityLogs = new Map();
    this.clients = new Map();
    this.nextIds = {
      admins: 1,
      projects: 1,
      countrySurveys: 1,
      suppliers: 1,
      respondents: 1,
      activityLogs: 1,
      clients: 1
    };
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(a => a.username === username);
  }
  async getAdminById(id: number): Promise<Admin | undefined> {
    return this.admins.get(id);
  }
  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const id = this.nextIds.admins++;
    const created: Admin = { ...admin, id, createdAt: new Date() };
    this.admins.set(id, created);
    return created;
  }
  async updateAdminPassword(id: number, passwordHash: string): Promise<void> {
    const admin = this.admins.get(id);
    if (admin) this.admins.set(id, { ...admin, passwordHash });
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getProjectById(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  async getProjectByCode(projectCode: string): Promise<Project | undefined> {
    return Array.from(this.projects.values()).find(p => p.projectCode === projectCode);
  }
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.nextIds.projects++;
    const created: Project = {
      ...project,
      id,
      status: project.status || 'active',
      ridCounter: project.ridCounter || 1,
      ridPadding: project.ridPadding || 4,
      createdAt: new Date(),
      completeUrl: project.completeUrl || null,
      terminateUrl: project.terminateUrl || null,
      quotafullUrl: project.quotafullUrl || null,
      securityUrl: project.securityUrl || null,
      client: project.client || null,
      ridPrefix: project.ridPrefix || null,
      ridCountryCode: project.ridCountryCode || null,
    };
    this.projects.set(id, created);
    return created;
  }
  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const existing = this.projects.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...project };
    this.projects.set(id, updated);
    return updated;
  }
  async deleteProject(id: number): Promise<void> {
    this.projects.delete(id);
  }

  async getCountrySurveys(projectId: number): Promise<CountrySurvey[]> {
    return Array.from(this.countrySurveys.values()).filter(cs => cs.projectId === projectId);
  }
  async getCountrySurveyByCode(projectCode: string, countryCode: string): Promise<CountrySurvey | undefined> {
    return Array.from(this.countrySurveys.values()).find(cs => cs.projectCode === projectCode && cs.countryCode === countryCode);
  }
  async createCountrySurvey(survey: InsertCountrySurvey): Promise<CountrySurvey> {
    const id = this.nextIds.countrySurveys++;
    const created: CountrySurvey = {
      ...survey,
      id,
      projectId: survey.projectId || 0,
      status: survey.status || 'active',
      createdAt: new Date()
    };
    this.countrySurveys.set(id, created);
    return created;
  }
  async deleteCountrySurvey(id: number): Promise<void> {
    this.countrySurveys.delete(id);
  }

  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getSupplierById(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }
  async getSupplierByCode(code: string): Promise<Supplier | undefined> {
    return Array.from(this.suppliers.values()).find(s => s.code === code);
  }
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const id = this.nextIds.suppliers++;
    const created: Supplier = {
      ...supplier,
      id,
      createdAt: new Date(),
      completeUrl: supplier.completeUrl || null,
      terminateUrl: supplier.terminateUrl || null,
      quotafullUrl: supplier.quotafullUrl || null,
      securityUrl: supplier.securityUrl || null,
    };
    this.suppliers.set(id, created);
    return created;
  }
  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const existing = this.suppliers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...supplier };
    this.suppliers.set(id, updated);
    return updated;
  }
  async deleteSupplier(id: number): Promise<void> {
    this.suppliers.delete(id);
  }

  async createRespondent(respondent: InsertRespondent): Promise<Respondent> {
    const id = this.nextIds.respondents++;
    const created: Respondent = {
      ...respondent,
      id,
      status: respondent.status || 'started',
      startedAt: new Date(),
      completedAt: null,
      countryCode: respondent.countryCode || null,
      supplierCode: respondent.supplierCode || null,
      clientRid: respondent.clientRid || null,
      ipAddress: respondent.ipAddress || null,
      userAgent: respondent.userAgent || null,
    };
    this.respondents.set(id, created);
    return created;
  }
  async getRespondentBySession(oiSession: string): Promise<Respondent | undefined> {
    return Array.from(this.respondents.values()).find(r => r.oiSession === oiSession);
  }
  async updateRespondentStatus(oiSession: string, status: string): Promise<Respondent | undefined> {
    const existing = Array.from(this.respondents.values()).find(r => r.oiSession === oiSession);
    if (!existing) return undefined;
    const updated = { ...existing, status: status as any, completedAt: status !== 'started' ? new Date() : null };
    this.respondents.set(existing.id, updated);
    return updated;
  }
  async checkDuplicateRespondent(projectCode: string, supplierCode: string, supplierRid: string): Promise<boolean> {
    return Array.from(this.respondents.values()).some(r => r.projectCode === projectCode && r.supplierCode === supplierCode && r.supplierRid === supplierRid);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.nextIds.activityLogs++;
    const created: ActivityLog = { ...log, id, createdAt: new Date() };
    this.activityLogs.set(id, created);
    return created;
  }
  async getActivityLogs(oiSession: string): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(l => l.oiSession === oiSession)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getDashboardStats(): Promise<{ totalToday: number; completesToday: number; terminatesToday: number; quotafullsToday: number; }> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayRes = Array.from(this.respondents.values()).filter(r => r.startedAt.getTime() >= now.getTime());
    return {
      totalToday: todayRes.length,
      completesToday: todayRes.filter(r => r.status === 'complete').length,
      terminatesToday: todayRes.filter(r => r.status === 'terminate').length,
      quotafullsToday: todayRes.filter(r => r.status === 'quotafull').length,
    };
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async createClient(client: InsertClient): Promise<Client> {
    const id = this.nextIds.clients++;
    const created: Client = { ...client, id, website: client.website || null, createdAt: new Date() };
    this.clients.set(id, created);
    return created;
  }
  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined> {
    const existing = this.clients.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...client };
    this.clients.set(id, updated);
    return updated;
  }
  async deleteClient(id: number): Promise<void> {
    this.clients.delete(id);
  }
}

async function seedAdmin(storage: IStorage) {
  const existing = await storage.getAdminByUsername("admin");
  if (!existing) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await storage.createAdmin({ username: "admin", passwordHash });
    console.log("Seeded admin user (username: admin, password: admin123)");
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();

seedAdmin(storage).catch(console.error);
