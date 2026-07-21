import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import passport from "passport";
import {
  deriveKey,
  generateSalt,
  generateAccessCode,
  encryptData,
  decryptData,
  hashPassword,
  computeHash,
  computeHmac,
} from "./crypto";
import { openai } from "./openai";
import QRCode from "qrcode";

const upload = multer({ dest: path.join(process.cwd(), "uploads") });

function logAction(userId: number, action: string, details?: string, req?: Request) {
  storage
    .createAuditLog({
      userId,
      action,
      details: details || null,
      ipAddress: req?.ip || "unknown",
    })
    .catch(console.error);
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated?.()) return next();
  return res.status(401).json({ message: "Unauthorized", code: "UNAUTHORIZED" });
}

function requireRole(role: "admin" | "user") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated?.()) {
      return res.status(401).json({ message: "Unauthorized", code: "UNAUTHORIZED" });
    }

    const currentRole = (req.user as any)?.role;
    if (currentRole !== role) {
      return res.status(403).json({ message: "Forbidden", code: "FORBIDDEN" });
    }
    return next();
  };
}

// Rate limiting map
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

function checkRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      message: "Too many requests. Please try again later.",
      code: "RATE_LIMITED",
    });
  }

  record.count++;
  return next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await fs.mkdir(path.join(process.cwd(), "uploads"), { recursive: true });
  setupAuth(app);

  app.use("/api", checkRateLimit);

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);

      if (input.username.length < 3 || input.username.length > 30) {
        return res.status(400).json({ message: "Username must be between 3 and 30 characters" });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(input.username)) {
        return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
      }
      if (input.password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      if (!/[a-zA-Z]/.test(input.password) || !/[0-9]/.test(input.password)) {
        return res.status(400).json({ message: "Password must contain both letters and numbers" });
      }

      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        username: input.username,
        email: input.email,
        password: hashPassword(input.password),
        role: "user",
      });

      req.login(user, (loginErr) => {
        if (loginErr) return res.status(500).json({ message: "Login after register failed" });
        req.session.save((saveErr) => {
          if (saveErr) return res.status(500).json({ message: "Session save failed" });
          logAction(user.id, "REGISTER", "Account created", req);
          return res.status(201).json(user);
        });
      });
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: err instanceof Error ? err.message : "Internal server error" });
    }
  });

  app.post(api.auth.login.path, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Login failed" });

      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);
          logAction(user.id, "LOGIN", "Successful login", req);
          return res.json(user);
        });
      });
    })(req, res, next);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout?.((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      return res.json({ message: "Logged out" });
    });
  });

  app.delete("/api/auth/account", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    await storage.deleteUser(userId);
    req.logout?.((err) => {
      if (err) return res.status(500).json({ message: "Logout after delete failed" });
      return res.json({ message: "Account terminated" });
    });
  });

  app.get(api.auth.me.path, requireAuth, (req, res) => {
    return res.json(req.user);
  });

  app.get(api.items.list.path, requireAuth, async (req, res) => {
    const items = await storage.getEncryptedItems(req.user!.id);
    return res.json(items);
  });

  app.post(api.items.search.path, requireAuth, async (req, res) => {
    try {
      const input = api.items.search.input.parse(req.body);
      const all = await storage.getEncryptedItems(req.user!.id);
      const q = input.q.trim().toLowerCase();

      let filtered = all;

      if (!input.includeDeleted) filtered = filtered.filter((i) => !i.deletedAt);
      if (input.folder) filtered = filtered.filter((i) => i.folder === input.folder);

      if (input.type !== "all") {
        if (input.type === "favorites") filtered = filtered.filter((i) => i.isFavorite);
        if (input.type === "images") filtered = filtered.filter((i) => i.fileType.startsWith("image/"));
        if (input.type === "videos") filtered = filtered.filter((i) => i.fileType.startsWith("video/"));
        if (input.type === "documents")
          filtered = filtered.filter(
            (i) => i.fileType.includes("pdf") || i.fileType.includes("word") || i.fileType === "text/plain"
          );
      }

      if (q) {
        filtered = filtered.filter((i) => {
          const summary = i.aiSummary?.toLowerCase() ?? "";
          return (
            i.originalName.toLowerCase().includes(q) ||
            summary.includes(q) ||
            (i.tags ?? []).some((t) => t.toLowerCase().includes(q))
          );
        });
      }

      filtered = filtered.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = filtered.length;
      const start = (input.page - 1) * input.pageSize;
      const end = start + input.pageSize;
      const items = filtered.slice(start, end);

      return res.json({ items, page: input.page, pageSize: input.pageSize, total });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("ITEM SEARCH ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  function getFilteredItemsForExport(userId: number, input: z.infer<typeof api.items.search.input>) {
    return (async () => {
      const all = await storage.getEncryptedItems(userId);
      const q = (input.q ?? "").trim().toLowerCase();
      let filtered = all;

      if (!input.includeDeleted) filtered = filtered.filter((i) => !i.deletedAt);
      if (input.folder) filtered = filtered.filter((i) => i.folder === input.folder);

      if (input.type !== "all") {
        if (input.type === "favorites") filtered = filtered.filter((i) => i.isFavorite);
        if (input.type === "images") filtered = filtered.filter((i) => i.fileType.startsWith("image/"));
        if (input.type === "videos") filtered = filtered.filter((i) => i.fileType.startsWith("video/"));
        if (input.type === "documents")
          filtered = filtered.filter((i) => i.fileType.includes("pdf") || i.fileType.includes("word") || i.fileType === "text/plain");
      }

      if (q) {
        filtered = filtered.filter((i) => {
          const summary = i.aiSummary?.toLowerCase() ?? "";
          return (
            i.originalName.toLowerCase().includes(q) ||
            summary.includes(q) ||
            (i.tags ?? []).some((t) => t.toLowerCase().includes(q))
          );
        });
      }

      return filtered
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    })();
  }

  app.post(api.items.exportCsv.path, requireAuth, async (req, res) => {
    try {
      const input = api.items.exportCsv.input.parse(req.body);

      const filtered = await getFilteredItemsForExport(req.user!.id, {
        ...input,
        // export always excludes deleted
        page: 1,
        pageSize: 2000,
        includeDeleted: false,
      } as any);

      const escapeCsv = (v: unknown) => {
        const s = v === null || v === undefined ? "" : String(v);
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      };

      const header = [
        "id",
        "originalName",
        "fileType",
        "createdAt",
        "expiresAt",
        "isFavorite",
        "folder",
        "tags",
        "aiSummary",
        "linkId",
      ];

      const rows = filtered.map((i: any) =>
        [
          i.id,
          i.originalName,
          i.fileType,
          new Date(i.createdAt).toISOString(),
          new Date(i.expiresAt).toISOString(),
          i.isFavorite,
          i.folder ?? "General",
          (i.tags ?? []).join("|"),
          i.aiSummary ?? "",
          i.linkId,
        ]
          .map(escapeCsv)
          .join(",")
      );

      const csv = [header.join(","), ...rows].join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="vault-export-${Date.now()}.csv"`);
      res.status(200).send(csv);

      logAction(req.user!.id, "EXPORT_CSV", `Exported ${filtered.length} item(s)`, req);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("EXPORT CSV ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // XLSX export (placeholder)
  app.post(api.items.exportXlsx.path, requireAuth, async (req, res) => {
    try {
      const input = api.items.exportXlsx.input.parse(req.body);
      const filtered = await getFilteredItemsForExport(req.user!.id, {
        ...input,
        page: 1,
        pageSize: 2000,
        includeDeleted: false,
      } as any);

      const escapeCsv = (v: unknown) => {
        const s = v === null || v === undefined ? "" : String(v);
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      };

      const header = [
        "id",
        "originalName",
        "fileType",
        "createdAt",
        "expiresAt",
        "isFavorite",
        "folder",
        "tags",
        "aiSummary",
        "linkId",
      ];

      const rows = filtered.map((i: any) =>
        [
          i.id,
          i.originalName,
          i.fileType,
          new Date(i.createdAt).toISOString(),
          new Date(i.expiresAt).toISOString(),
          i.isFavorite,
          i.folder ?? "General",
          (i.tags ?? []).join("|"),
          i.aiSummary ?? "",
          i.linkId,
        ]
          .map(escapeCsv)
          .join(",")
      );

      const body = [header.join(","), ...rows].join("\n");

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="vault-export-${Date.now()}.xlsx"`);
      res.status(200).send(body);

      logAction(req.user!.id, "EXPORT_XLSX", `Exported ${filtered.length} item(s)`, req);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("EXPORT XLSX ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // PDF export (placeholder)
  app.post(api.items.exportPdf.path, requireAuth, async (req, res) => {
    try {
      const input = api.items.exportPdf.input.parse(req.body);
      const filtered = await getFilteredItemsForExport(req.user!.id, {
        ...input,
        page: 1,
        pageSize: 2000,
        includeDeleted: false,
      } as any);

      const lines = [
        `Vault Export - ${new Date().toISOString()}`,
        `Items: ${filtered.length}`,
        "---",
        ...filtered.map((i: any) => `${i.id}\t${i.originalName}\t${i.fileType}\t${i.folder ?? "General"}\t${i.isFavorite ? "★" : ""}`),
      ];

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="vault-export-${Date.now()}.pdf"`);
      res.status(200).send(lines.join("\n"));

      logAction(req.user!.id, "EXPORT_PDF", `Exported ${filtered.length} item(s)`, req);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("EXPORT PDF ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // File type allowlist for security
  const ALLOWED_FILE_TYPES = [
    "text/plain",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "audio/mpeg",
    "audio/wav",
    "application/zip",
    "application/x-zip-compressed",
  ];

  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  app.post(api.items.upload.path, requireAuth, upload.single("file"), async (req, res) => {
    try {
      const password = req.body.password;
      if (!password) return res.status(400).json({ message: "Password is required for encryption" });

      let dataBuffer: Buffer;
      let originalName: string;
      let fileType: string;

      if (req.file) {
        if (req.file.size > MAX_FILE_SIZE) {
          return res
            .status(400)
            .json({ message: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` });
        }

        const allowed =
          ALLOWED_FILE_TYPES.includes(req.file.mimetype) ||
          ALLOWED_FILE_TYPES.some((t) => req.file!.mimetype.startsWith(t.replace(/.*\//, "")));

        if (!allowed) return res.status(400).json({ message: "File type not allowed for security reasons" });

        originalName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 255);
        dataBuffer = await fs.readFile(req.file.path);
        fileType = req.file.mimetype;
        await fs.unlink(req.file.path);
      } else if (req.body.text_message) {
        if (req.body.text_message.length > 1024 * 1024) {
          return res.status(400).json({ message: "Text message exceeds maximum length of 1MB" });
        }

        dataBuffer = Buffer.from(req.body.text_message, "utf-8");
        originalName = "secure_note.txt";
        fileType = "text/plain";
      } else {
        return res.status(400).json({ message: "No file or text_message provided" });
      }

      const salt = generateSalt();
      const key = deriveKey(password, salt);
      const hash = computeHash(dataBuffer);
      const hmac = computeHmac(dataBuffer, key);
      const { encrypted, iv, authTag } = encryptData(dataBuffer, key);

      const fileName = randomUUID() + ".enc";
      const filePath = path.join(process.cwd(), "uploads", fileName);
      const fileData = Buffer.concat([authTag, encrypted]);
      await fs.writeFile(filePath, fileData);

      const accessCode = generateAccessCode();
      const linkId = randomUUID();

      let expiresAt: Date;
      const expiry = req.body.expiry || "5m";
      switch (expiry) {
        case "1h":
          expiresAt = new Date(Date.now() + 60 * 60 * 1000);
          break;
        case "24h":
          expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
          break;
        case "7d":
          expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          break;
        case "never":
          expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      }

      const folder = req.body.folder || "General";

      const item = await storage.createEncryptedItem({
        userId: req.user!.id,
        originalName,
        fileType,
        encryptedDataPath: filePath,
        iv,
        salt,
        hash,
        hmac,
        accessCode,
        linkId,
        expiresAt,
        folder,
        aiSummary: null,
        isFavorite: false,
        tags: [],
        deletedAt: null,
      });

      logAction(req.user!.id, "UPLOAD", `Uploaded: ${originalName} (${fileType})`, req);
      return res.status(201).json(item);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Encryption failed" });
    }
  });

  app.delete(api.items.delete.path, requireAuth, async (req, res) => {
    const item = await storage.getEncryptedItem(Number(req.params.id));
    if (!item || item.userId !== req.user!.id) return res.status(404).json({ message: "Not found" });

    try {
      await fs.unlink(item.encryptedDataPath);
    } catch {
      // ignore
    }

    await storage.deleteEncryptedItem(item.id);
    logAction(req.user!.id, "DELETE", `Deleted item: ${item.originalName}`, req);
    return res.status(204).end();
  });

  app.patch("/api/items/:id/favorite", requireAuth, async (req, res) => {
    const item = await storage.getEncryptedItem(Number(req.params.id));
    if (!item || item.userId !== req.user!.id) return res.status(404).json({ message: "Not found" });
    const updated = await storage.updateEncryptedItem(item.id, { isFavorite: !item.isFavorite });
    return res.json(updated);
  });

  app.post("/api/items/:id/analyze", requireAuth, async (req, res) => {
    const item = await storage.getEncryptedItem(Number(req.params.id));
    if (!item || item.userId !== req.user!.id) return res.status(404).json({ message: "Not found" });
    if (item.fileType !== "text/plain") return res.status(400).json({ message: "Only text files can be analyzed currently" });

    const password = req.body.password;
    if (!password) return res.status(400).json({ message: "Password required for decryption" });

    try {
      const key = deriveKey(password, item.salt);
      const fileData = await fs.readFile(item.encryptedDataPath);
      const authTag = fileData.subarray(0, 16);
      const encrypted = fileData.subarray(16);

      const decrypted = decryptData(encrypted, key, item.iv, authTag.toString("hex"));
      const text = decrypted.toString("utf-8");

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Analyze the following encrypted text and provide a short summary and 3-5 keywords. Respond in JSON format: { \"summary\": \"...\", \"tags\": [\"...\", \"...\"] }",
          },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      await storage.updateEncryptedItem(item.id, { aiSummary: result.summary, tags: result.tags });
      logAction(req.user!.id, "ANALYZE", `Analyzed item: ${item.originalName}`, req);
      return res.json(result);
    } catch {
      return res.status(500).json({ message: "AI Analysis failed" });
    }
  });

  app.get("/api/items/:id/qr", requireAuth, async (req, res) => {
    const item = await storage.getEncryptedItem(Number(req.params.id));
    if (!item || item.userId !== req.user!.id) return res.status(404).json({ message: "Not found" });
    if (new Date() > item.expiresAt) return res.status(403).json({ message: "Link expired" });

    try {
      const protocol = req.protocol;
      const host = req.get("host");
      const url = `${protocol}://${host}/access/${item.linkId}`;
      const qrCode = await QRCode.toDataURL(url);
      return res.json({ qrCode });
    } catch {
      return res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  app.post(api.items.access.path, async (req, res) => {
    try {
      const input = api.items.access.input.parse(req.body);
      const item = await storage.getEncryptedItemByLink(input.linkId);
      if (!item) return res.status(404).json({ message: "Link not found" });
      if (new Date() > item.expiresAt) return res.status(403).json({ message: "Link expired" });
      if (item.accessCode !== input.accessCode) return res.status(403).json({ message: "Invalid access code" });
      if (!input.password) return res.status(400).json({ message: "Password is required to decrypt" });

      const key = deriveKey(input.password, item.salt);
      const fileData = await fs.readFile(item.encryptedDataPath);
      const authTag = fileData.subarray(0, 16);
      const encrypted = fileData.subarray(16);

      try {
        const decrypted = decryptData(encrypted, key, item.iv, authTag.toString("hex"));
        const currentHash = computeHash(decrypted);
        const currentHmac = computeHmac(decrypted, key);

        if (currentHash !== item.hash || currentHmac !== item.hmac) {
          return res.status(403).json({ message: "Data integrity verification failed" });
        }

        res.json({ originalName: item.originalName, fileType: item.fileType, data: decrypted.toString("base64") });
        logAction(item.userId, "ACCESS_SHARED", `Shared file accessed: ${item.originalName}`, req);
      } catch {
        return res.status(403).json({ message: "Decryption failed (incorrect password?)" });
      }
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/audit-logs", requireAuth, async (req, res) => {
    const logs = await storage.getAuditLogs(req.user!.id);
    return res.json(logs);
  });

  app.post("/api/items/:id/trash", requireAuth, async (req, res) => {
    const item = await storage.getEncryptedItem(Number(req.params.id));
    if (!item || item.userId !== req.user!.id) return res.status(404).json({ message: "Not found" });
    const updated = await storage.trashItem(item.id);
    logAction(req.user!.id, "TRASH", `Trashed item: ${item.originalName}`, req);
    return res.json(updated);
  });

  app.post("/api/items/:id/restore", requireAuth, async (req, res) => {
    const item = await storage.getEncryptedItem(Number(req.params.id));
    if (!item || item.userId !== req.user!.id) return res.status(404).json({ message: "Not found" });
    const updated = await storage.restoreItem(item.id);
    logAction(req.user!.id, "RESTORE", `Restored item: ${item.originalName}`, req);
    return res.json(updated);
  });

  app.get("/api/items/trash", requireAuth, async (req, res) => {
    const items = await storage.getTrashedItems(req.user!.id);
    return res.json(items);
  });

  app.get("/api/folders", requireAuth, async (req, res) => {
    const folders = await storage.getFolders(req.user!.id);
    return res.json(folders);
  });

  app.patch("/api/items/:id/tags", requireAuth, async (req, res) => {
    const item = await storage.getEncryptedItem(Number(req.params.id));
    if (!item || item.userId !== req.user!.id) return res.status(404).json({ message: "Not found" });
    const { tags } = req.body;
    const updated = await storage.updateEncryptedItem(item.id, { tags: tags || [] });
    return res.json(updated);
  });

  app.patch("/api/items/:id/folder", requireAuth, async (req, res) => {
    const item = await storage.getEncryptedItem(Number(req.params.id));
    if (!item || item.userId !== req.user!.id) return res.status(404).json({ message: "Not found" });
    const { folder } = req.body;
    const updated = await storage.updateEncryptedItem(item.id, { folder: folder || "General" });
    return res.json(updated);
  });

  setInterval(() => {
    storage.deleteExpiredItems().catch(console.error);
  }, 60 * 1000);

  return httpServer;
}

