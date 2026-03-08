import "reflect-metadata"
import { container } from "common/container/registry"
import { AdminApplicationRepository } from "../repositories/admin-application.repository"
import { AdminApplicationService } from "../services/admin-application.service"
import { NotificationRepository } from "../repositories/notification.repository"
import { SseService } from "../services/sse.service"
import { NotificationService } from "../services/notification.service"

export function registerAdminContainer() {
  container.registerSingleton("AdminApplicationRepository", AdminApplicationRepository)
  container.registerSingleton("AdminApplicationService", AdminApplicationService)
  container.registerSingleton("NotificationRepository", NotificationRepository)
  container.registerSingleton("SseService", SseService)
  container.registerSingleton("NotificationService", NotificationService)
}

export { container }
