export async function getAllCountries(prisma) {
    const countries = await prisma.country.findMany({
        select: { id: true, name: true, phoneCode: true, phoneNumberLength: true },
        orderBy: { name: 'asc' },
    });
    return countries;
}
