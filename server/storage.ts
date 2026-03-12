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
  type Client, type InsertClient,
  supplierAssignments, type SupplierAssignment, type InsertSupplierAssignment,
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
  deleteAllCountrySurveys(projectId: number): Promise<void>;

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
  getRespondents(): Promise<Respondent[]>;

  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(oiSession: string): Promise<ActivityLog[]>;

  // Stats
  getDashboardStats(): Promise<{
    totalProjects: number;
    totalRespondents: number;
    completes: number;
    terminates: number;
    quotafulls: number;
    securityTerminates: number;
    activityData: { date: string; count: number }[];
  }>;
  getSystemPulseStats(): Promise<{
    totalVolume: number;
    successChain: number;
    filteredOut: number;
    securityAlerts: number;
    ratePerMinute: number;
    recentActivity: any[];
  }>;

  // RID Generation
  generateClientRID(projectCode: string): Promise<string>;

  // Clients
  getClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<void>;

  // Supplier Assignments
  getSupplierAssignments(projectCode?: string, supplierId?: number): Promise<any[]>;
  createSupplierAssignment(assignment: InsertSupplierAssignment): Promise<SupplierAssignment>;
  updateSupplierAssignment(id: number, data: Partial<SupplierAssignment>): Promise<SupplierAssignment | undefined>;
  deleteSupplierAssignment(id: number): Promise<void>;
  getSupplierAssignmentByCombo(projectCode: string, countryCode: string, supplierId: number): Promise<SupplierAssignment | undefined>;
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

  async generateClientRID(projectCode: string): Promise<string> {
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

  async deleteAllCountrySurveys(projectId: number): Promise<void> {
    await db.delete(countrySurveys).where(eq(countrySurveys.projectId, projectId));
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

  async getRespondents(): Promise<Respondent[]> {
    return db.select().from(respondents).orderBy(desc(respondents.startedAt));
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
  async getDashboardStats() {
    const [totalProjects] = await db.select({ count: sql`count(*)` }).from(projects);
    const [totalRespondents] = await db.select({ count: sql`count(*)` }).from(respondents);
    const [completes] = await db.select({ count: sql`count(*)` }).from(respondents).where(eq(respondents.status, "complete"));
    const [terminates] = await db.select({ count: sql`count(*)` }).from(respondents).where(eq(respondents.status, "terminate"));
    const [quotafulls] = await db.select({ count: sql`count(*)` }).from(respondents).where(eq(respondents.status, "quotafull"));
    const [secTerms] = await db.select({ count: sql`count(*)` }).from(respondents).where(eq(respondents.status, "security-terminate"));

    return {
      totalProjects: Number(totalProjects.count),
      totalRespondents: Number(totalRespondents.count),
      completes: Number(completes.count),
      terminates: Number(terminates.count),
      quotafulls: Number(quotafulls.count),
      securityTerminates: Number(secTerms.count),
      activityData: [],
    };
  }

  async getSystemPulseStats() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [total] = await db.select({ count: sql`count(*)` })
      .from(respondents)
      .where(gte(respondents.startedAt, oneDayAgo));

    const [success] = await db.select({ count: sql`count(*)` })
      .from(respondents)
      .where(and(eq(respondents.status, "complete"), gte(respondents.startedAt, oneDayAgo)));

    const [filtered] = await db.select({ count: sql`count(*)` })
      .from(respondents)
      .where(and(
        sql`${respondents.status} IN ('terminate', 'quotafull')`,
        gte(respondents.startedAt, oneDayAgo)
      ));

    const [alerts] = await db.select({ count: sql`count(*)` })
      .from(respondents)
      .where(and(
        sql`${respondents.status} IN ('security-terminate', 'fraud')`,
        gte(respondents.startedAt, oneDayAgo)
      ));

    const last24h = await db.select()
      .from(respondents)
      .where(and(
        eq(respondents.projectCode, respondents.projectCode), // placeholder for future filtering if needed
        gte(respondents.startedAt, oneDayAgo)
      ));

    const last5m = await db.select()
      .from(respondents)
      .where(gte(respondents.startedAt, fiveMinsAgo));

    const recentActivity = await db.select()
      .from(respondents)
      .orderBy(desc(respondents.startedAt))
      .limit(20)
      .then(res => res.map(r => {
        const mapped: Respondent = {
          id: r.id,
          status: r.status,
          projectCode: r.projectCode,
          countryCode: r.countryCode,
          supplierCode: r.supplierCode,
          supplierRid: r.supplierRid,
          clientRid: r.clientRid,
          oiSession: r.oiSession,
          s2sVerified: r.s2sVerified ?? false,
          fraudScore: r.fraudScore ?? 0,
          s2sToken: r.s2sToken ?? null,
          s2sReceivedAt: r.s2sReceivedAt ?? null,
          startedAt: r.startedAt,
          completedAt: r.completedAt,
          ipAddress: r.ipAddress,
          userAgent: r.userAgent,
        };
        return mapped;
      }));

    return {
      totalVolume: last24h.length,
      successChain: last24h.filter(r => r.status === 'complete' && r.s2sVerified).length,
      filteredOut: last24h.filter(r => ['terminate', 'quotafull'].includes(r.status || '')).length,
      securityAlerts: last24h.filter(r => ['security-terminate', 'fraud'].includes(r.status || '')).length,
      ratePerMinute: Math.round(last5m.length / 5),
      recentActivity: recentActivity
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

  // Supplier Assignments
  async getSupplierAssignments(projectCode?: string, supplierId?: number): Promise<any[]> {
    let query = db.select({
      id: supplierAssignments.id,
      projectCode: supplierAssignments.projectCode,
      countryCode: supplierAssignments.countryCode,
      supplierId: supplierAssignments.supplierId,
      generatedLink: supplierAssignments.generatedLink,
      status: supplierAssignments.status,
      notes: supplierAssignments.notes,
      createdAt: supplierAssignments.createdAt,
      supplierName: suppliers.name,
      supplierCode: suppliers.code,
      projectName: projects.projectName,
    })
    .from(supplierAssignments)
    .leftJoin(suppliers, eq(supplierAssignments.supplierId, suppliers.id))
    .leftJoin(projects, eq(supplierAssignments.projectCode, projects.projectCode));

    const conditions = [];
    if (projectCode) conditions.push(eq(supplierAssignments.projectCode, projectCode));
    if (supplierId) conditions.push(eq(supplierAssignments.supplierId, supplierId));

    if (conditions.length > 0) {
      // @ts-ignore
      query = query.where(and(...conditions));
    }

    return query.orderBy(desc(supplierAssignments.createdAt));
  }

  async createSupplierAssignment(assignment: InsertSupplierAssignment): Promise<SupplierAssignment> {
    const [created] = await db.insert(supplierAssignments).values(assignment).returning();
    return created;
  }

  async updateSupplierAssignment(id: number, data: Partial<SupplierAssignment>): Promise<SupplierAssignment | undefined> {
    const [updated] = await db.update(supplierAssignments).set(data).where(eq(supplierAssignments.id, id)).returning();
    return updated;
  }

  async deleteSupplierAssignment(id: number): Promise<void> {
    await db.delete(supplierAssignments).where(eq(supplierAssignments.id, id));
  }

  async getSupplierAssignmentByCombo(projectCode: string, countryCode: string, supplierId: number): Promise<SupplierAssignment | undefined> {
    const [found] = await db.select()
      .from(supplierAssignments)
      .where(and(
        eq(supplierAssignments.projectCode, projectCode),
        eq(supplierAssignments.countryCode, countryCode),
        eq(supplierAssignments.supplierId, supplierId)
      ))
      .limit(1);
    return found;
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
  private supplierAssignments: Map<number, SupplierAssignment>;
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
      clients: 1,
      supplierAssignments: 1
    };
    this.supplierAssignments = new Map();
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

  async generateClientRID(projectCode: string): Promise<string> {
    const project = Array.from(this.projects.values()).find(p => p.projectCode === projectCode);
    if (!project) {
      throw new Error(`Project with code ${projectCode} not found`);
    }

    const counter = (project.ridCounter || 1);
    const updatedCounter = counter + 1;

    // Update the project in memory
    const updatedProject = { ...project, ridCounter: updatedCounter };
    this.projects.set(project.id, updatedProject);

    const prefix = project.ridPrefix || "";
    const countryCode = project.ridCountryCode || "";
    const padding = project.ridPadding || 4;

    const paddedCounter = counter.toString().padStart(padding, "0");
    return `${prefix}${countryCode}${paddedCounter}`;
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
  async deleteAllCountrySurveys(projectId: number): Promise<void> {
    const idsToDelete = Array.from(this.countrySurveys.values())
      .filter(cs => cs.projectId === projectId)
      .map(cs => cs.id);
    idsToDelete.forEach(id => this.countrySurveys.delete(id));
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
      s2sVerified: respondent.s2sVerified || false,
      fraudScore: respondent.fraudScore || 0,
      s2sToken: respondent.s2sToken || null,
      s2sReceivedAt: respondent.s2sReceivedAt || null,
      startedAt: new Date(),
      completedAt: respondent.completedAt || null,
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

  async getRespondents(): Promise<Respondent[]> {
    return Array.from(this.respondents.values()).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.nextIds.activityLogs++;
    const created: ActivityLog = {
      ...log,
      id,
      createdAt: new Date(),
      projectCode: log.projectCode || null,
      oiSession: log.oiSession || null,
      eventType: log.eventType || null,
      meta: log.meta || null
    };
    this.activityLogs.set(id, created);
    return created;
  }
  async getActivityLogs(oiSession: string): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(l => l.oiSession === oiSession)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getDashboardStats() {
    const allRes = Array.from(this.respondents.values());
    return {
      totalProjects: this.projects.size,
      totalRespondents: allRes.length,
      completes: allRes.filter(r => r.status === 'complete').length,
      terminates: allRes.filter(r => r.status === 'terminate').length,
      quotafulls: allRes.filter(r => r.status === 'quotafull').length,
      securityTerminates: allRes.filter(r => r.status === 'security-terminate').length,
      activityData: [],
    };
  }

  async getSystemPulseStats() {
    return {
      totalVolume: 0,
      successChain: 0,
      filteredOut: 0,
      securityAlerts: 0,
      ratePerMinute: 0,
      recentActivity: []
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

  // Supplier Assignments
  async getSupplierAssignments(projectCode?: string, supplierId?: number): Promise<any[]> {
    let assignments = Array.from(this.supplierAssignments.values());
    
    if (projectCode) {
      assignments = assignments.filter(a => a.projectCode === projectCode);
    }
    if (supplierId) {
      assignments = assignments.filter(a => a.supplierId === supplierId);
    }

    return assignments.map(a => {
      const supplier = Array.from(this.suppliers.values()).find(s => s.id === a.supplierId);
      const project = Array.from(this.projects.values()).find(p => p.projectCode === a.projectCode);
      return {
        ...a,
        supplierName: supplier?.name || "Unknown",
        supplierCode: supplier?.code || "Unknown",
        projectName: project?.projectName || "Unknown",
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createSupplierAssignment(assignment: InsertSupplierAssignment): Promise<SupplierAssignment> {
    const id = this.nextIds.supplierAssignments++;
    const created: SupplierAssignment = {
      ...assignment,
      id,
      status: assignment.status || "active",
      notes: assignment.notes || null,
      createdAt: new Date(),
    };
    this.supplierAssignments.set(id, created);
    return created;
  }

  async updateSupplierAssignment(id: number, data: Partial<SupplierAssignment>): Promise<SupplierAssignment | undefined> {
    const existing = this.supplierAssignments.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.supplierAssignments.set(id, updated);
    return updated;
  }

  async deleteSupplierAssignment(id: number): Promise<void> {
    this.supplierAssignments.delete(id);
  }

  async getSupplierAssignmentByCombo(projectCode: string, countryCode: string, supplierId: number): Promise<SupplierAssignment | undefined> {
    return Array.from(this.supplierAssignments.values()).find(a => 
      a.projectCode === projectCode && 
      a.countryCode === countryCode && 
      a.supplierId === supplierId
    );
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

export { seedAdmin };
