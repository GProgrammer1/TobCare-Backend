import type { PrismaClient } from '../generated/prisma/client.ts'

export type CountryWithPhoneCode = {
  id: bigint
  name: string
  phoneCode: string
  phoneNumberLength: number | null
}

export async function getAllCountries(prisma: PrismaClient): Promise<CountryWithPhoneCode[]> {
  const countries = await prisma.country.findMany({
    select: { id: true, name: true, phoneCode: true, phoneNumberLength: true },
    orderBy: { name: 'asc' },
  })
  return countries
}
