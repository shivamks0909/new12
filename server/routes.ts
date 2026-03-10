import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAdmin } from "./auth";
import {
  insertProjectSchema,
  insertSupplierSchema,
  insertCountrySurveySchema,
  insertRespondentSchema,
  insertActivityLogSchema
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { generateClientRID } from "./lib/rid";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // AUTH ROUTES
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    const admin = await storage.getAdminByUsername(username);
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    req.session.adminId = admin.id;
    return res.json({ id: admin.id, username: admin.username });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Failed to logout" });
      res.clearCookie("connect.sid");
      return res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.adminId) return res.status(401).json({ message: "Not authenticated" });
    const admin = await storage.getAdminById(req.session.adminId);
    if (!admin) return res.status(401).json({ message: "Not authenticated" });
    return res.json({ id: admin.id, username: admin.username });
  });

  // ADMIN STATS
  app.get("/api/admin/stats", requireAdmin, async (_req: Request, res: Response) => {
    const stats = await storage.getDashboardStats();
    return res.json(stats);
  });

  // PROJECTS
  app.get("/api/projects", requireAdmin, async (_req: Request, res: Response) => {
    const allProjects = await storage.getProjects();
    return res.json(allProjects);
  });

  app.post("/api/projects", requireAdmin, async (req: Request, res: Response) => {
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const project = await storage.createProject(parsed.data);
    return res.status(201).json(project);
  });

  app.get("/api/projects/:id", requireAdmin, async (req: Request, res: Response) => {
    const project = await storage.getProjectById(Number(req.params.id));
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json(project);
  });

  app.patch("/api/projects/:id", requireAdmin, async (req: Request, res: Response) => {
    const project = await storage.updateProject(Number(req.params.id), req.body);
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json(project);
  });

  app.delete("/api/projects/:id", requireAdmin, async (req: Request, res: Response) => {
    await storage.deleteProject(Number(req.params.id));
    return res.json({ message: "Deleted" });
  });

  // COUNTRY SURVEYS (v2 Mapping)
  app.get("/api/projects/:id/surveys", requireAdmin, async (req: Request, res: Response) => {
    const surveys = await storage.getCountrySurveys(Number(req.params.id));
    return res.json(surveys);
  });

  app.post("/api/projects/:id/surveys", requireAdmin, async (req: Request, res: Response) => {
    const parsed = insertCountrySurveySchema.safeParse({ ...req.body, projectId: Number(req.params.id) });
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const survey = await storage.createCountrySurvey(parsed.data);
    return res.status(201).json(survey);
  });

  app.delete("/api/surveys/:id", requireAdmin, async (req: Request, res: Response) => {
    await storage.deleteCountrySurvey(Number(req.params.id));
    return res.json({ message: "Deleted" });
  });

  // SUPPLIERS
  app.get("/api/suppliers", requireAdmin, async (_req: Request, res: Response) => {
    const sups = await storage.getSuppliers();
    return res.json(sups);
  });

  app.post("/api/suppliers", requireAdmin, async (req: Request, res: Response) => {
    const parsed = insertSupplierSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const supplier = await storage.createSupplier(parsed.data);
    return res.status(201).json(supplier);
  });

  app.patch("/api/suppliers/:id", requireAdmin, async (req: Request, res: Response) => {
    const supplier = await storage.updateSupplier(Number(req.params.id), req.body);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    return res.json(supplier);
  });

  app.delete("/api/suppliers/:id", requireAdmin, async (req: Request, res: Response) => {
    await storage.deleteSupplier(Number(req.params.id));
    return res.json({ message: "Deleted" });
  });

  // CLIENTS (Legacy Mocked)
  app.get("/api/clients", requireAdmin, async (_req: Request, res: Response) => {
    const clients = await storage.getClients();
    return res.json(clients);
  });

  app.post("/api/clients", requireAdmin, async (req: Request, res: Response) => {
    const client = await storage.createClient(req.body);
    return res.status(201).json(client);
  });

  app.patch("/api/clients/:id", requireAdmin, async (req: Request, res: Response) => {
    const client = await storage.updateClient(Number(req.params.id), req.body);
    return res.json(client);
  });

  app.delete("/api/clients/:id", requireAdmin, async (req: Request, res: Response) => {
    await storage.deleteClient(Number(req.params.id));
    return res.json({ message: "Deleted" });
  });

  // ====== REDIRECT TRACKING ENDPOINT (/track) ======
  // https://router.domain.com/track?code={PROJECT_CODE}&country={CC}&sup={SUP_CODE}&uid={SUP_RID}
  app.get("/track", async (req: Request, res: Response) => {
    const { code, country, sup, uid } = req.query;

    if (!code || !country || !sup || !uid) {
      return res.status(400).send("Missing tracking parameters (code, country, sup, uid)");
    }

    const projectCode = code as string;
    const countryCode = country as string;
    const supplierCode = sup as string;
    const supplierRid = uid as string;

    try {
      // 1. Validate Project and Supplier
      const project = await storage.getProjectByCode(projectCode);
      if (!project || project.status !== 'active') return res.status(404).send("Project not found or inactive");

      const supplier = await storage.getSupplierByCode(supplierCode);
      if (!supplier) return res.status(404).send("Supplier not found");

      // 2. Validate Country Survey
      const countrySurvey = await storage.getCountrySurveyByCode(projectCode, countryCode);
      if (!countrySurvey || countrySurvey.status !== 'active') return res.status(404).send("Survey not found for this country");

      // 3. Check for Duplicates
      const isDuplicate = await storage.checkDuplicateRespondent(projectCode, supplierCode, supplierRid);
      if (isDuplicate) {
        // Log activity and terminate
        const oiSession = randomUUID();
        await storage.createActivityLog({
          oiSession,
          eventType: 'duplicate_entry',
          meta: { details: `Duplicate RID detected: ${supplierRid} for ${supplierCode} on ${projectCode}` } as any
        } as any);
        return res.redirect(`${supplier.terminateUrl?.replace("{RID}", supplierRid)}&oi_session=${oiSession}`);
      }

      // 4. Generate Client RID (Atomic)
      const clientRid = await generateClientRID(projectCode);

      // 5. Create Respondent Session
      const oiSession = randomUUID();
      await storage.createRespondent({
        oiSession,
        projectCode,
        supplierCode,
        supplierRid,
        countryCode,
        clientRid,
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        status: 'started'
      });

      // 6. Log Entry
      await storage.createActivityLog({
        oiSession,
        eventType: 'entry',
        meta: { details: `Respondent started. Redirecting to client survey.` } as any
      } as any);

      // 7. Redirect to Client Survey URL
      // Replace placeholders in client URL
      let redirectUrl = countrySurvey.surveyUrl
        .replace("{RID}", clientRid)
        .replace("{oi_session}", oiSession);

      return res.redirect(redirectUrl);

    } catch (err: any) {
      console.error("Tracking Error:", err);
      return res.status(500).send("Internal Server Error during tracking");
    }
  });

  // ====== CALLBACK ENDPOINTS ======
  const handleCallback = async (req: Request, res: Response, status: string) => {
    const { oi_session } = req.query;
    if (!oi_session) return res.status(400).send("Missing oi_session");

    const respondent = await storage.getRespondentBySession(oi_session as string);
    if (!respondent) return res.status(404).send("Session not found");

    if (respondent.status !== 'started') {
      return res.status(400).send("Respondent already reached a final status");
    }

    // Update Status
    await storage.updateRespondentStatus(respondent.oiSession, status);

    // Get Supplier
    const supplier = await storage.getSupplierByCode(respondent.supplierCode || "");
    if (!supplier) return res.status(404).send("Supplier not found");

    // Log Activity
    await storage.createActivityLog({
      oiSession: respondent.oiSession,
      eventType: 'callback',
      meta: { details: `Received ${status} callback from client.` } as any
    } as any);

    // Get the base redirect URL from supplier based on status
    let supplierRedirectBase = supplier.terminateUrl;
    if (status === 'complete') supplierRedirectBase = supplier.completeUrl;
    if (status === 'quotafull') supplierRedirectBase = supplier.quotafullUrl;
    if (status === 'security-terminate') supplierRedirectBase = supplier.securityUrl;

    if (!supplierRedirectBase) return res.send(`Successfully logged ${status}, but no supplier redirect configured.`);

    // Final Redirect to Supplier with their RID
    const finalUrl = supplierRedirectBase
      .replace("{RID}", respondent.supplierRid)
      .replace("{oi_session}", respondent.oiSession);

    return res.redirect(finalUrl);
  };

  app.get("/complete", (req, res) => handleCallback(req, res, "complete"));
  app.get("/terminate", (req, res) => handleCallback(req, res, "terminate"));
  app.get("/quotafull", (req, res) => handleCallback(req, res, "quotafull"));
  app.get("/security-terminate", (req, res) => handleCallback(req, res, "security-terminate"));

  return createServer(app);
}
