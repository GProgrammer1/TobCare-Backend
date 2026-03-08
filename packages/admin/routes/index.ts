import { Router } from "express"
import { createAdminApplicationRoutes } from "./application.routes"
import { createNotificationRoutes } from "./notification.routes"
import { authMiddleware, requireRole } from "common/middlewares/auth.middleware"

export function createAdminRouter(): Router {
  const router = Router()
  router.use(authMiddleware, requireRole("ADMIN"))
  router.use("/applications", createAdminApplicationRoutes())
  router.use("/notifications", createNotificationRoutes())
  return router
}
