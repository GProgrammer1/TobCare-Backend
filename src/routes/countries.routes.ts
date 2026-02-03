import { Router } from 'express'
import { getCountries } from '../controllers/countries.controller.ts'

const router = Router()

router.get('/', getCountries)

export default router
