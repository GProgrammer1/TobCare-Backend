import type { Request, Response } from 'express'
import { getAllCountries } from '../services/countries.service.ts'
import type { ApiResponse } from '../types/api.js'

export type CountryDto = {
  id: string
  name: string
  phoneCode: string
  phoneNumberLength: number | null
}

export async function getCountries(req: Request, res: Response): Promise<void> {
  const countries = await getAllCountries(req.prisma)
  const data: CountryDto[] = countries.map((c) => ({
    id: c.id.toString(),
    name: c.name,
    phoneCode: c.phoneCode,
    phoneNumberLength: c.phoneNumberLength,
  }))
  const response: ApiResponse<CountryDto[]> = { success: true, data }
  res.json(response)
}
