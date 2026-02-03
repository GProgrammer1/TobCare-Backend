

import { Router, type Request, type Response } from 'express'
import { getMailService } from '../services/mail/index.ts'

const router = Router()

router.post('/send-test-email', async (req: Request, res: Response): Promise<void> => {
  const mail = getMailService()
  const to = (req.body?.to as string) ?? 'test@example.com'
  const result = await mail.send({
    to,
    subject: 'TobCare – Welcome',
    template: 'welcome',
    context: {
      name: 'Test User',
      ctaUrl: 'http://localhost:5173',
      ctaText: 'Open TobCare',
    },
  })
  res.json({
    success: true,
    messageId: result.messageId,
    accepted: result.accepted,
    hint: 'Check console for Ethereal preview URL',
  })
})

export default router
