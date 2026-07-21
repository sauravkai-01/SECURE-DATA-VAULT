import fs from "fs/promises";
import type { User, InsertUser, EncryptedItem, AuditLog, InsertAuditLog } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: number): Promise<void>;
  createEncryptedItem(item: Omit<EncryptedItem, "id" | "createdAt">): Promise<EncryptedItem>;
  getEncryptedItems(userId: number): Promise<EncryptedItem[]>;
  getEncryptedItem(id: number): Promise<EncryptedItem | undefined>;
  getEncryptedItemByLink(linkId: string): Promise<EncryptedItem | undefined>;
  updateEncryptedItem(id: number, updates: Partial<EncryptedItem>): Promise<EncryptedItem>;
  deleteEncryptedItem(id: number): Promise<void>;
  deleteExpiredItems(): Promise<void>;
  toggleFavorite(id: number): Promise<EncryptedItem>;
  trashItem(id: number): Promise<EncryptedItem>;
  restoreItem(id: number): Promise<EncryptedItem>;
  getTrashedItems(userId: number): Promise<EncryptedItem[]>;
  getFolders(userId: number): Promise<string[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(userId: number): Promise<AuditLog[]>;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private itemsMap: Map<number, EncryptedItem>;
  private auditLogsMap: Map<number, AuditLog>;
  private userIdCounter: number;
  private itemIdCounter: number;
  private logIdCounter: number;

  constructor() {
    this.usersMap = new Map();
    this.itemsMap = new Map();
    this.auditLogsMap = new Map();
    this.userIdCounter = 1;
    this.itemIdCounter = 1;
    this.logIdCounter = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(u => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = { ...user, id: this.userIdCounter++, createdAt: new Date() };
    this.usersMap.set(newUser.id, newUser);
    return newUser;
  }

  async deleteUser(id: number): Promise<void> {
    this.usersMap.delete(id);
    // Also delete all user items and logs
    for (const [itemId, item] of Array.from(this.itemsMap.entries())) {
      if (item.userId === id) {
        try { await fs.unlink(item.encryptedDataPath); } catch (e) {}
        this.itemsMap.delete(itemId);
      }
    }
    for (const [logId, log] of Array.from(this.auditLogsMap.entries())) {
      if (log.userId === id) {
        this.auditLogsMap.delete(logId);
      }
    }
  }

  async createEncryptedItem(item: Omit<EncryptedItem, "id" | "createdAt">): Promise<EncryptedItem> {
    const newItem: EncryptedItem = { ...item, id: this.itemIdCounter++, createdAt: new Date() };
    this.itemsMap.set(newItem.id, newItem);
    return newItem;
  }

  async getEncryptedItems(userId: number): Promise<EncryptedItem[]> {
    return Array.from(this.itemsMap.values()).filter(i => i.userId === userId && !i.deletedAt);
  }

  async getEncryptedItem(id: number): Promise<EncryptedItem | undefined> {
    return this.itemsMap.get(id);
  }

  async getEncryptedItemByLink(linkId: string): Promise<EncryptedItem | undefined> {
    return Array.from(this.itemsMap.values()).find(i => i.linkId === linkId);
  }

  async updateEncryptedItem(id: number, updates: Partial<EncryptedItem>): Promise<EncryptedItem> {
    const item = this.itemsMap.get(id);
    if (!item) throw new Error("Item not found");
    const updated = { ...item, ...updates };
    this.itemsMap.set(id, updated);
    return updated;
  }

  async deleteEncryptedItem(id: number): Promise<void> {
    this.itemsMap.delete(id);
  }

  async deleteExpiredItems(): Promise<void> {
    const now = new Date();
    for (const [id, item] of Array.from(this.itemsMap.entries())) {
      if (item.expiresAt < now) {
        try { await fs.unlink(item.encryptedDataPath); } catch (e) {}
        this.itemsMap.delete(id);
      }
    }
  }

  async toggleFavorite(id: number): Promise<EncryptedItem> {
    const item = this.itemsMap.get(id);
    if (!item) throw new Error("Item not found");
    const updated = { ...item, isFavorite: !item.isFavorite };
    this.itemsMap.set(id, updated);
    return updated;
  }

  async trashItem(id: number): Promise<EncryptedItem> {
    const item = this.itemsMap.get(id);
    if (!item) throw new Error("Item not found");
    const updated = { ...item, deletedAt: new Date() };
    this.itemsMap.set(id, updated);
    return updated;
  }

  async restoreItem(id: number): Promise<EncryptedItem> {
    const item = this.itemsMap.get(id);
    if (!item) throw new Error("Item not found");
    const updated = { ...item, deletedAt: null };
    this.itemsMap.set(id, updated);
    return updated;
  }

  async getTrashedItems(userId: number): Promise<EncryptedItem[]> {
    return Array.from(this.itemsMap.values()).filter(i => i.userId === userId && !!i.deletedAt);
  }

  async getFolders(userId: number): Promise<string[]> {
    const folders = new Set<string>();
    Array.from(this.itemsMap.values())
      .filter(i => i.userId === userId && !i.deletedAt && i.folder)
      .forEach(i => folders.add(i.folder!));
    return Array.from(folders);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: this.logIdCounter++,
      userId: log.userId,
      action: log.action,
      details: log.details ?? null,
      ipAddress: log.ipAddress ?? null,
      createdAt: new Date()
    };
    this.auditLogsMap.set(newLog.id, newLog);
    return newLog;
  }

  async getAuditLogs(userId: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogsMap.values()).filter(l => l.userId === userId);
  }
}

export const storage = new MemStorage();

