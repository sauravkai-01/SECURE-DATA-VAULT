import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserRole = "admin" | "user";

export const encryptedItems = pgTable("encrypted_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(),
  encryptedDataPath: text("encrypted_data_path").notNull(),
  iv: text("iv").notNull(),
  salt: text("salt").notNull(),
  hash: text("hash").notNull(),
  hmac: text("hmac").notNull(),
  accessCode: text("access_code").notNull(),
  linkId: text("link_id").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  aiSummary: text("ai_summary"),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  tags: text("tags").array(),
  folder: text("folder").default("General"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  encryptedItems: many(encryptedItems),
  auditLogs: many(auditLogs),
}));

export const encryptedItemsRelations = relations(encryptedItems, ({ one }) => ({
  user: one(users, {
    fields: [encryptedItems.userId],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type EncryptedItem = typeof encryptedItems.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
