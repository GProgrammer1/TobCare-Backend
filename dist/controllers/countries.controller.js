import { getAllCountries } from "../services/countries.service.js";
export async function getCountries(req, res) {
    const countries = await getAllCountries(req.prisma);
    const data = countries.map((c) => ({
        id: c.id.toString(),
        name: c.name,
        phoneCode: c.phoneCode,
        phoneNumberLength: c.phoneNumberLength,
    }));
    const response = { success: true, data };
    res.json(response);
}
