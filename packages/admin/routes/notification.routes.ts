import { Router } from "express"
import { container } from "common/container/registry"
import { NotificationController } from "../controllers/notification.controller"

export function createNotificationRoutes(): Router {
  const router = Router()
  const controller = container.resolve(NotificationController)

  router.get("/stream", controller.stream)
  router.get("/count", controller.getUnreadCount)
  router.get("/", controller.getUnread)
  router.patch("/read-all", controller.markAllAsRead)
  router.patch("/:id/read", controller.markAsRead)

  return router
}
