import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAdmin } from "./auth";
import { insertClientSchema, insertProjectSchema, insertSupplierSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import ExcelJS from "exceljs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

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
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.adminId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const admin = await storage.getAdminById(req.session.adminId);
    if (!admin) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    return res.json({ id: admin.id, username: admin.username });
  });

  app.get("/api/admin/stats", requireAdmin, async (_req: Request, res: Response) => {
    const stats = await storage.getStats();
    return res.json(stats);
  });

  app.get("/api/admin/responses", requireAdmin, async (_req: Request, res: Response) => {
    const latest = await storage.getLatestResponses(20);
    return res.json(latest);
  });

  app.get("/api/admin/daily-counts", requireAdmin, async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 14;
    const counts = await storage.getDailyResponseCounts(days);
    return res.json(counts);
  });

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
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const project = await storage.getProject(id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json(project);
  });

  app.patch("/api/projects/:id", requireAdmin, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const project = await storage.updateProject(id, req.body);
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json(project);
  });

  app.delete("/api/projects/:id", requireAdmin, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await storage.deleteProject(id);
    return res.json({ message: "Deleted" });
  });

  app.get("/api/projects/:id/suppliers", requireAdmin, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const sups = await storage.getSuppliersByProject(id);
    return res.json(sups);
  });

  app.post("/api/projects/:id/suppliers", requireAdmin, async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id as string);
    if (isNaN(projectId)) return res.status(400).json({ message: "Invalid ID" });
    const data = { ...req.body, projectId };
    const parsed = insertSupplierSchema.safeParse(data);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const supplier = await storage.createSupplier(parsed.data);
    return res.status(201).json(supplier);
  });

  app.delete("/api/suppliers/:id", requireAdmin, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await storage.deleteSupplier(id);
    return res.json({ message: "Deleted" });
  });

  app.patch("/api/suppliers/:id", requireAdmin, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const supplier = await storage.updateSupplier(id, req.body);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    return res.json(supplier);
  });

  app.get("/api/clients", requireAdmin, async (_req: Request, res: Response) => {
    const allClients = await storage.getClients();
    return res.json(allClients);
  });

  app.post("/api/clients", requireAdmin, async (req: Request, res: Response) => {
    const parsed = insertClientSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const client = await storage.createClient(parsed.data);
    return res.status(201).json(client);
  });

  app.patch("/api/clients/:id", requireAdmin, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const client = await storage.updateClient(id, req.body);
    if (!client) return res.status(404).json({ message: "Client not found" });
    return res.json(client);
  });

  app.delete("/api/clients/:id", requireAdmin, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await storage.deleteClient(id);
    return res.json({ message: "Deleted" });
  });

  app.get("/api/responses", requireAdmin, async (req: Request, res: Response) => {
    const filters: any = {};
    if (req.query.projectId) filters.projectId = parseInt(req.query.projectId as string);
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.page) filters.page = parseInt(req.query.page as string);
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
    const result = await storage.getResponses(filters);
    return res.json(result);
  });

  app.get("/api/responses/export", requireAdmin, async (req: Request, res: Response) => {
    const filters: any = {};
    if (req.query.projectId) filters.projectId = parseInt(req.query.projectId as string);
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
    if (req.query.search) filters.search = req.query.search as string;
    filters.limit = 10000;

    const result = await storage.getResponses(filters);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Responses");
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "OI Session", key: "oiSession", width: 30 },
      { header: "Project ID", key: "projectId", width: 12 },
      { header: "PID", key: "pid", width: 15 },
      { header: "UID", key: "uid", width: 20 },
      { header: "IP Address", key: "ipAddress", width: 18 },
      { header: "Status", key: "status", width: 15 },
      { header: "Supplier ID", key: "supplierId", width: 12 },
      { header: "Created At", key: "createdAt", width: 22 },
      { header: "Updated At", key: "updatedAt", width: 22 },
    ];

    for (const r of result.data) {
      worksheet.addRow(r);
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=responses.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  });

  app.delete("/api/responses/bulk", requireAdmin, async (req: Request, res: Response) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is required" });
    }
    await storage.bulkDeleteResponses(ids);
    return res.json({ message: "Deleted", count: ids.length });
  });

  app.post("/api/secret-reset", requireAdmin, async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    const admin = await storage.getAdminById(req.session.adminId!);
    if (!admin) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    await storage.updateAdminPassword(admin.id, newHash);
    return res.json({ message: "Password updated" });
  });

  app.get("/r/:pid", async (req: Request, res: Response) => {
    const pid = req.params.pid as string;
    const uid = (req.query.uid as string) || null;
    const supplierCode = (req.query.supplier as string) || null;

    const project = await storage.getProjectByPid(pid);
    if (!project) {
      return res.redirect("/terminate?reason=invalid_project");
    }

    if (project.status === "paused") {
      return res.redirect(`/paused?pid=${pid}&uid=${uid || ""}`);
    }

    if (project.status !== "active") {
      return res.redirect("/terminate?reason=project_inactive");
    }

    const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
      || req.socket.remoteAddress || "unknown";

    if (uid) {
      const dupUid = await storage.checkDuplicateUid(project.id, uid);
      if (dupUid) {
        return res.redirect(`/duplicate-string?pid=${pid}&uid=${uid}&ip=${ipAddress}&status=duplicate`);
      }
    }

    const dupIp = await storage.checkDuplicateIp(project.id, ipAddress);
    if (dupIp) {
      return res.redirect(`/duplicate-ip?pid=${pid}&uid=${uid || ""}&ip=${ipAddress}&status=duplicate`);
    }

    let supplierId: number | null = null;
    if (supplierCode) {
      const supplier = await storage.getSupplierByCode(project.id, supplierCode);
      if (supplier) {
        supplierId = supplier.id;
      }
    }

    const oiSession = randomUUID();
    await storage.createResponse({
      projectId: project.id,
      pid,
      uid,
      ipAddress,
      status: "started",
      supplierId,
      oiSession,
    });

    let surveyUrl = project.surveyUrl || "";
    if (surveyUrl) {
      const separator = surveyUrl.includes("?") ? "&" : "?";
      surveyUrl = `${surveyUrl}${separator}oi_session=${oiSession}&uid=${uid || ""}&pid=${pid}`;
      return res.redirect(surveyUrl);
    }

    return res.redirect(`/terminate?reason=no_survey_url&pid=${pid}`);
  });

  app.get("/track/complete", async (req: Request, res: Response) => {
    const oiSession = req.query.oi_session as string;
    if (!oiSession) {
      return res.redirect("/complete?status=complete");
    }

    const response = await storage.getResponseBySession(oiSession);
    if (response) {
      await storage.updateResponseStatus(response.id, "complete");

      const project = await storage.getProject(response.projectId);
      if (project) {
        const supplier = response.supplierId
          ? await storage.getSupplier(response.supplierId)
          : null;

        if (supplier?.completeUrl) {
          const url = supplier.completeUrl
            .replace("{uid}", response.uid || "")
            .replace("{oi_session}", oiSession);
          return res.redirect(url);
        }

        if (project.completeUrl) {
          return res.redirect(project.completeUrl);
        }
      }
    }

    return res.redirect(`/complete?oi_session=${oiSession}&pid=${response?.pid || ""}&uid=${response?.uid || ""}&ip=${response?.ipAddress || ""}&status=complete`);
  });

  app.get("/track/terminate", async (req: Request, res: Response) => {
    const oiSession = req.query.oi_session as string;
    if (!oiSession) {
      return res.redirect("/terminate?status=terminate");
    }

    const response = await storage.getResponseBySession(oiSession);
    if (response) {
      await storage.updateResponseStatus(response.id, "terminate");

      const project = await storage.getProject(response.projectId);
      if (project) {
        const supplier = response.supplierId
          ? await storage.getSupplier(response.supplierId)
          : null;

        if (supplier?.terminateUrl) {
          const url = supplier.terminateUrl
            .replace("{uid}", response.uid || "")
            .replace("{oi_session}", oiSession);
          return res.redirect(url);
        }

        if (project.terminateUrl) {
          return res.redirect(project.terminateUrl);
        }
      }
    }

    return res.redirect(`/terminate?oi_session=${oiSession}&pid=${response?.pid || ""}&uid=${response?.uid || ""}&ip=${response?.ipAddress || ""}&status=terminate`);
  });

  app.get("/track/quotafull", async (req: Request, res: Response) => {
    const oiSession = req.query.oi_session as string;
    if (!oiSession) {
      return res.redirect("/quotafull?status=quotafull");
    }

    const response = await storage.getResponseBySession(oiSession);
    if (response) {
      await storage.updateResponseStatus(response.id, "quotafull");

      const project = await storage.getProject(response.projectId);
      if (project) {
        const supplier = response.supplierId
          ? await storage.getSupplier(response.supplierId)
          : null;

        if (supplier?.quotafullUrl) {
          const url = supplier.quotafullUrl
            .replace("{uid}", response.uid || "")
            .replace("{oi_session}", oiSession);
          return res.redirect(url);
        }

        if (project.quotafullUrl) {
          return res.redirect(project.quotafullUrl);
        }
      }
    }

    return res.redirect(`/quotafull?oi_session=${oiSession}&pid=${response?.pid || ""}&uid=${response?.uid || ""}&ip=${response?.ipAddress || ""}&status=quotafull`);
  });

  app.get("/track/security-terminate", async (req: Request, res: Response) => {
    const oiSession = req.query.oi_session as string;
    if (!oiSession) {
      return res.redirect("/security-terminate?status=security-terminate");
    }

    const response = await storage.getResponseBySession(oiSession);
    if (response) {
      await storage.updateResponseStatus(response.id, "security-terminate");

      const project = await storage.getProject(response.projectId);
      if (project) {
        const supplier = response.supplierId
          ? await storage.getSupplier(response.supplierId)
          : null;

        if (supplier?.securityUrl) {
          const url = supplier.securityUrl
            .replace("{uid}", response.uid || "")
            .replace("{oi_session}", oiSession);
          return res.redirect(url);
        }

        if (project.securityTerminateUrl) {
          return res.redirect(project.securityTerminateUrl);
        }
      }
    }

    return res.redirect(`/security-terminate?oi_session=${oiSession}&pid=${response?.pid || ""}&uid=${response?.uid || ""}&ip=${response?.ipAddress || ""}&status=security-terminate`);
  });

  return httpServer;
}
