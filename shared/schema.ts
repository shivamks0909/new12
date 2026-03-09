import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, timestamp, real, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  pid: text("pid").notNull().unique(),
  name: text("name").notNull(),
  clientId: integer("client_id").references(() => clients.id),
  status: text("status").notNull().default("active"),
  completeUrl: text("complete_url"),
  terminateUrl: text("terminate_url"),
  quotafullUrl: text("quotafull_url"),
  securityTerminateUrl: text("security_terminate_url"),
  prescreenerUrl: text("prescreener_url"),
  surveyUrl: text("survey_url"),
  cpi: real("cpi"),
  expectedCompletes: integer("expected_completes"),
  country: text("country"),
  loi: integer("loi"),
  ir: integer("ir"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  name: text("name").notNull(),
  supplierCode: text("supplier_code").notNull(),
  completeUrl: text("complete_url"),
  terminateUrl: text("terminate_url"),
  quotafullUrl: text("quotafull_url"),
  securityUrl: text("security_url"),
  status: text("status").notNull().default("active"),
}, (table) => [
  unique("suppliers_project_id_supplier_code_unique").on(table.projectId, table.supplierCode),
]);

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
});
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  pid: text("pid").notNull(),
  uid: text("uid"),
  ipAddress: text("ip_address"),
  status: text("status").notNull(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  oiSession: text("oi_session"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertResponseSchema = createInsertSchema(responses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type SurveyResponse = typeof responses.$inferSelect;
