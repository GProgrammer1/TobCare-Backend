import z from "zod"
import { ApplicationStatus } from "@tobcare/prisma"

const ApplicationStatusValues = Object.values(ApplicationStatus) as [string, ...string[]]

export const updateApplicationStatusSchema = z.object({
  status: z.enum(ApplicationStatusValues as [string, ...string[]]),
  adminNotes: z.string().optional(),
})

export const listApplicationsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(ApplicationStatusValues as [string, ...string[]]).optional(),
  search: z.string().optional(),
})

export type UpdateApplicationStatusDto = z.infer<typeof updateApplicationStatusSchema>
export type ListApplicationsQueryDto = z.infer<typeof listApplicationsQuerySchema>
