import 'express';
import 'express-session';

declare module 'express-serve-static-core' {
  interface Request {
    // Passport adds these at runtime; we type them for TS.
    isAuthenticated?: () => boolean;
    user?: {
      id: number;
      role?: string;
      [key: string]: unknown;
    };
    login: (user: any, cb: (err: any) => void) => void;
    logout: (cb?: (err: any) => void) => void;

  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

