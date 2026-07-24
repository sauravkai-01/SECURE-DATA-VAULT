import { z } from 'zod';
import { users, encryptedItems } from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: z.object({
        username: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(6),
      }),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() })
      }
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  items: {
    list: {
      method: 'GET' as const,
      path: '/api/items' as const,
      responses: {
        200: z.array(z.custom<typeof encryptedItems.$inferSelect>()),
        401: errorSchemas.unauthorized,
      }
    },
    search: {
      method: 'POST' as const,
      path: '/api/items/search' as const,
      input: z.object({
        q: z.string().optional().default(''),
        type: z.enum(['all', 'favorites', 'images', 'videos', 'documents']).optional().default('all'),
        folder: z.string().optional(),
        page: z.number().int().min(1).optional().default(1),
        pageSize: z.number().int().min(1).max(200).optional().default(20),
        includeDeleted: z.boolean().optional().default(false),
      }),
      responses: {
        200: z.object({
          items: z.array(z.custom<typeof encryptedItems.$inferSelect>()),
          page: z.number().int(),
          pageSize: z.number().int(),
          total: z.number().int(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    exportCsv: {
      method: 'POST' as const,
      path: '/api/items/export/csv' as const,
      input: z.object({
        q: z.string().optional().default(''),
        type: z.enum(['all', 'favorites', 'images', 'videos', 'documents']).optional().default('all'),
        folder: z.string().optional(),
      }),
      responses: {
        200: z.void(),
        401: errorSchemas.unauthorized,
      },
    },
    exportXlsx: {
      method: 'POST' as const,
      path: '/api/items/export/xlsx' as const,
      input: z.object({
        q: z.string().optional().default(''),
        type: z.enum(['all', 'favorites', 'images', 'videos', 'documents']).optional().default('all'),
        folder: z.string().optional(),
      }),
      responses: {
        200: z.void(),
        401: errorSchemas.unauthorized,
      },
    },
    exportPdf: {
      method: 'POST' as const,
      path: '/api/items/export/pdf' as const,
      input: z.object({
        q: z.string().optional().default(''),
        type: z.enum(['all', 'favorites', 'images', 'videos', 'documents']).optional().default('all'),
        folder: z.string().optional(),
      }),
      responses: {
        200: z.void(),
        401: errorSchemas.unauthorized,
      },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/items/upload' as const,
      // Form data: file or text_message, plus 'password' for deriving encryption key
      responses: {
        201: z.custom<typeof encryptedItems.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/items/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    },
    toggleFavorite: {
      method: 'PATCH' as const,
      path: '/api/items/:id/favorite' as const,
      responses: {
        200: z.custom<typeof encryptedItems.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    },
    analyze: {
      method: 'POST' as const,
      path: '/api/items/:id/analyze' as const,
      responses: {
        200: z.object({ summary: z.string(), tags: z.array(z.string()) }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    },
    qr: {
      method: 'GET' as const,
      path: '/api/items/:id/qr' as const,
      responses: {
        200: z.object({ qrCode: z.string() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
        403: z.object({ message: z.string() }),
      }
    },
    access: {
      method: 'POST' as const,
      path: '/api/items/access' as const,
      input: z.object({
        linkId: z.string(),
        accessCode: z.string(),
        password: z.string(), // uploader's password to derive decryption key
      }),
      responses: {
        200: z.object({
          originalName: z.string(),
          fileType: z.string(),
          data: z.string(), // base64 encoded data or plaintext
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      }
    }
  },
  auditLogs: {
    list: {
      method: 'GET' as const,
      path: '/api/audit-logs' as const,
      responses: {
        200: z.array(z.any()), // Can be more specific if desired
        401: errorSchemas.unauthorized,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
