import { Router } from "express"
import { container } from "common/container/registry"
import { AdminApplicationController } from "../controllers/admin-application.controller"

export function createAdminApplicationRoutes(): Router {
  const router = Router()
  const controller = container.resolve(AdminApplicationController)

  router.get("/", controller.list)
  router.get("/counts", controller.statusCounts)
  router.get("/:id", controller.getById)
  router.patch("/:id/status", controller.updateStatus)

  return router
}
