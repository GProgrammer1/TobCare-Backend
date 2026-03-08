import { inject, injectable } from "tsyringe"
import type { ApplicationStatus, PrismaClient } from "@tobcare/prisma"
import type { ListApplicationsQueryDto } from "../dtos/admin.dto"

@injectable()
export class AdminApplicationRepository {
  constructor(
    @inject("PrismaClient") private prisma: PrismaClient,
  ) {}

  async findAll(query: ListApplicationsQueryDto) {
    const { cursor, limit, status, search } = query

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    const queryArgs: Record<string, unknown> = {
      where,
      take: limit + 1,
      orderBy: { createdAt: "desc" },
      include: {
        clinics: true,
        hospitals: true,
      },
    }

    if (cursor) {
      queryArgs.cursor = { id: BigInt(cursor) }
      queryArgs.skip = 1 // skip the cursor itself
    }

    const applications = await this.prisma.doctorApplication.findMany(queryArgs as any)

    const hasMore = applications.length > limit
    const data = hasMore ? applications.slice(0, limit) : applications
    const nextCursor = hasMore ? String(data[data.length - 1]!.id) : null

    return {
      data,
      meta: {
        hasMore,
        nextCursor,
        limit,
      },
    }
  }

  async findById(id: bigint) {
    return this.prisma.doctorApplication.findUnique({
      where: { id },
      include: {
        clinics: true,
        hospitals: true,
      },
    })
  }

  async updateStatus(
    id: bigint,
    status: ApplicationStatus,
    adminId: bigint,
    adminNotes?: string,
  ) {
    return this.prisma.doctorApplication.update({
      where: { id },
      data: {
        status,
        verifiedAt: status === "VERIFIED" ? new Date() : null,
        verifiedBy: adminId,
        adminNotes: adminNotes ?? null,
      },
      include: {
        clinics: true,
        hospitals: true,
      },
    })
  }

  async countByStatus() {
    const [pending, verified, rejected, suspended] = await Promise.all([
      this.prisma.doctorApplication.count({ where: { status: "PENDING" } }),
      this.prisma.doctorApplication.count({ where: { status: "VERIFIED" } }),
      this.prisma.doctorApplication.count({ where: { status: "REJECTED" } }),
      this.prisma.doctorApplication.count({ where: { status: "SUSPENDED" } }),
    ])
    return { pending, verified, rejected, suspended, total: pending + verified + rejected + suspended }
  }
}
