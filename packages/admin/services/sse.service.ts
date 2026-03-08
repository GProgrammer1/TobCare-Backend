import { injectable } from "tsyringe"
import type { Response } from "express"
import { logger } from "common/lib/logger"

interface SseClient {
  id: string
  res: Response
  connectedAt: number
}

@injectable()
export class SseService {
  private clients = new Map<string, SseClient>()
  private heartbeatInterval: ReturnType<typeof setInterval>

  constructor() {
    // Heartbeat every 30s; also cleans dead connections
    this.heartbeatInterval = setInterval(() => {
      this.heartbeat()
    }, 30_000)
    this.heartbeatInterval.unref() // don't block Node shutdown
  }

  addClient(id: string, res: Response) {
    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // nginx
    })

    // Send a retry directive so the browser reconnects after 3s on drop
    res.write("retry: 3000\n\n")

    this.clients.set(id, { id, res, connectedAt: Date.now() })
    logger.info({ clientId: id }, "SSE client connected")

    // Clean up on close
    res.on("close", () => {
      this.removeClient(id)
    })
  }

  removeClient(id: string) {
    const client = this.clients.get(id)
    if (!client) return
    this.clients.delete(id)
    try {
      if (!client.res.writableEnded) {
        client.res.end()
      }
    } catch {
      // already closed — ignore
    }
    logger.info({ clientId: id }, "SSE client disconnected")
  }

  broadcast(event: string, data: unknown, eventId?: string) {
    const payload = typeof data === "string" ? data : JSON.stringify(data)
    const dead: string[] = []

    for (const [id, client] of this.clients) {
      try {
        if (client.res.writableEnded) {
          dead.push(id)
          continue
        }
        if (eventId) client.res.write(`id: ${eventId}\n`)
        client.res.write(`event: ${event}\n`)
        client.res.write(`data: ${payload}\n\n`)
      } catch {
        dead.push(id)
      }
    }

    // Clean up dead connections
    for (const id of dead) {
      this.removeClient(id)
    }
  }

  private heartbeat() {
    const dead: string[] = []

    for (const [id, client] of this.clients) {
      try {
        if (client.res.writableEnded) {
          dead.push(id)
          continue
        }
        client.res.write(": heartbeat\n\n")
      } catch {
        dead.push(id)
      }
    }

    for (const id of dead) {
      this.removeClient(id)
    }

    if (dead.length > 0) {
      logger.info({ count: dead.length }, "Cleaned dead SSE connections")
    }
  }

  get clientCount() {
    return this.clients.size
  }

  disconnectAll() {
    for (const [id] of this.clients) {
      this.removeClient(id)
    }
    clearInterval(this.heartbeatInterval)
  }
}
