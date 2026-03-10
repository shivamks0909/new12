import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, timestamp, real, unique, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin remains the same for auth
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

// Clients
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Projects 
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  projectCode: text("project_code").notNull().unique(),
  projectName: text("project_name").notNull(),
  client: text("client"),
  status: text("status").notNull().default("active"),
  ridPrefix: text("rid_prefix"),
  ridCountryCode: text("rid_country_code"),
  ridPadding: integer("rid_padding").default(4),
  ridCounter: integer("rid_counter").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Landing page settings
  completeUrl: text("complete_url"),
  terminateUrl: text("terminate_url"),
  quotafullUrl: text("quotafull_url"),
  securityUrl: text("security_url"),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

// Country Surveys
export const countrySurveys = pgTable("country_surveys", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  projectCode: text("project_code").notNull(),
  countryCode: text("country_code").notNull(),
  surveyUrl: text("survey_url").notNull(),
  status: text("status").default('active'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.projectCode, t.countryCode),
}));

export const insertCountrySurveySchema = createInsertSchema(countrySurveys).omit({
  id: true,
  createdAt: true,
});
export type CountrySurvey = typeof countrySurveys.$inferSelect;
export type InsertCountrySurvey = z.infer<typeof insertCountrySurveySchema>;

// Suppliers
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  completeUrl: text("complete_url"),
  terminateUrl: text("terminate_url"),
  quotafullUrl: text("quotafull_url"),
  securityUrl: text("security_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

// Respondents
export const respondents = pgTable("respondents", {
  id: serial("id").primaryKey(),
  projectCode: text("project_code").notNull(),
  countryCode: text("country_code"),
  supplierCode: text("supplier_code"),
  supplierRid: text("supplier_rid").notNull(),
  clientRid: text("client_rid"),
  oiSession: text("oi_session").notNull().unique(),
  status: text("status").default('started'),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
}, (t) => ({
  idx_session: index("idx_respondents_oi_session").on(t.oiSession),
  idx_proj: index("idx_respondents_project").on(t.projectCode),
}));

export const insertRespondentSchema = createInsertSchema(respondents).omit({
  id: true,
  startedAt: true,
});
export type Respondent = typeof respondents.$inferSelect;
export type InsertRespondent = z.infer<typeof insertRespondentSchema>;

// Activity Logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  projectCode: text("project_code"),
  oiSession: text("oi_session"),
  eventType: text("event_type"),
  meta: jsonb("meta").$type<any>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Legacy compatibility types
export type SurveyResponse = Respondent;
export type InsertResponse = InsertRespondent;
export type ProjectCountryUrl = CountrySurvey;
export type InsertProjectCountryUrl = InsertCountrySurvey;
