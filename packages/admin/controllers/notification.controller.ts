import { inject, injectable } from "tsyringe"
import type { Request, Response } from "express"
import { randomUUID } from "node:crypto"
import { NotificationService } from "../services/notification.service"
import { SseService } from "../services/sse.service"
import { asyncHandler } from "common/middlewares/async-handler"

@injectable()
export class NotificationController {
  constructor(
    @inject("NotificationService")
    private notificationService: NotificationService,
    @inject("SseService")
    private sseService: SseService,
  ) {}

  /**
   * SSE stream endpoint.
   * If the client sends `Last-Event-ID`, replay missed notifications.
   */
  stream = async (req: Request, res: Response) => {
    const clientId = randomUUID()
    this.sseService.addClient(clientId, res)

    // Replay missed notifications on reconnect
    const lastEventId = req.headers["last-event-id"] as string | undefined
    if (lastEventId) {
      try {
        const missed = await this.notificationService.getSince(BigInt(lastEventId))
        // Send oldest first so IDs ascend
        for (const n of missed.reverse()) {
          res.write(`id: ${n.id}\n`)
          res.write(`event: notification\n`)
          res.write(`data: ${JSON.stringify(n)}\n\n`)
        }
      } catch {
        // invalid lastEventId — ignore, client gets fresh stream
      }
    }
  }

  getUnread = asyncHandler(async (_req: Request, res: Response) => {
    const notifications = await this.notificationService.getUnread()
    res.status(200).json(notifications)
  })

  getUnreadCount = asyncHandler(async (_req: Request, res: Response) => {
    const count = await this.notificationService.getUnreadCount()
    res.status(200).json({ count })
  })

  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const id = BigInt(req.params.id as string)
    const notification = await this.notificationService.markAsRead(id)
    res.status(200).json(notification)
  })

  markAllAsRead = asyncHandler(async (_req: Request, res: Response) => {
    await this.notificationService.markAllAsRead()
    res.status(200).json({ success: true })
  })
}
