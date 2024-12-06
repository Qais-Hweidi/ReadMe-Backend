import express from 'express'
import { handleLahzaWebhook } from '../controllers/webhookController.js'

const router = express.Router()

// Raw body needed for webhook signature verification
router.post('/lahza', express.raw({ type: 'application/json' }), handleLahzaWebhook)

export default router 