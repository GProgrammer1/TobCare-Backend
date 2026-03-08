import { Request, Response, NextFunction } from "express"
import { verifyToken } from "common/utils/encryption"
import { env } from "common/lib/env"
import { logger } from "common/lib/logger"

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string
        role: string
      }
    }
  }
}

/**
 * Middleware that verifies the JWT access_token from httpOnly cookies.
 * Attaches `req.user = { sub, role }` on success.
 * Returns 401 if the token is missing, invalid, or expired.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.access_token
  if (!token) {
    logger.warn("Auth failed: missing token")
    res.status(401).json({ message: "Authentication required" })
    return
  }

  try {
    const payload = verifyToken(token, env.JWT_SECRET) as { sub: string; role: string }
    req.user = { sub: payload.sub, role: payload.role }
    next()
  } catch {
    logger.warn("Auth failed: invalid or expired token")
    res.status(401).json({ message: "Invalid or expired token" })
  }
}

/**
 * Factory that creates a middleware which checks `req.user.role` against allowed roles.
 * Must be used after `authMiddleware`.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" })
      return
    }

    if (!roles.includes(req.user.role)) {
      logger.warn({ userId: req.user.sub, role: req.user.role, required: roles }, "Auth failed: insufficient permissions")
      res.status(403).json({ message: "Insufficient permissions" })
      return
    }

    next()
  }
}
