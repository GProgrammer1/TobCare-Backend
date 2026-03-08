import { inject, injectable } from "tsyringe"
import type { PrismaClient, NotificationType, Prisma } from "@tobcare/prisma"

@injectable()
export class NotificationRepository {
  constructor(
    @inject("PrismaClient") private prisma: PrismaClient,
  ) {}

  async create(data: {
    type: NotificationType
    title: string
    message: string
    data?: Record<string, unknown>
  }) {
    return this.prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data as Prisma.InputJsonValue ?? undefined,
      },
    })
  }

  async findUnread() {
    return this.prisma.notification.findMany({
      where: { read: false },
      orderBy: { createdAt: "desc" },
    })
  }

  async findSince(lastId: bigint) {
    return this.prisma.notification.findMany({
      where: { id: { gt: lastId } },
      orderBy: { createdAt: "desc" },
    })
  }

  async markAsRead(id: bigint) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    })
  }

  async markAllAsRead() {
    return this.prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    })
  }

  async countUnread() {
    return this.prisma.notification.count({ where: { read: false } })
  }
}
