import { inject, injectable } from "tsyringe"
import { NotificationRepository } from "../repositories/notification.repository"
import { SseService } from "./sse.service"
import type { NotificationType } from "@tobcare/prisma"

@injectable()
export class NotificationService {
  constructor(
    @inject("NotificationRepository")
    private notificationRepository: NotificationRepository,
    @inject("SseService")
    private sseService: SseService,
  ) {}

  async createAndBroadcast(payload: {
    type: NotificationType
    title: string
    message: string
    data?: Record<string, unknown>
  }) {
    const notification = await this.notificationRepository.create(payload)
    this.sseService.broadcast("notification", notification, String(notification.id))
    return notification
  }

  async getUnread() {
    return this.notificationRepository.findUnread()
  }

  async getSince(lastId: bigint) {
    return this.notificationRepository.findSince(lastId)
  }

  async markAsRead(id: bigint) {
    return this.notificationRepository.markAsRead(id)
  }

  async markAllAsRead() {
    return this.notificationRepository.markAllAsRead()
  }

  async getUnreadCount() {
    return this.notificationRepository.countUnread()
  }
}
