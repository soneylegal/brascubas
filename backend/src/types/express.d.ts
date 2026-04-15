import type { JwtPayload } from "jsonwebtoken";

export interface AuthTokenPayload extends JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
      };
    }
  }
}

export {};
