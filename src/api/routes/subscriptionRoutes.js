import express from 'express'
import {
  subscribeToPlan,
  getSubscriptionDetails,
  cancelSubscription,
} from '../controllers/subscriptionController.js'
import { protect } from '../middlewares/AuthMiddleware.js'

const router = express.Router()

// All routes need authentication
router.post('/subscribe', protect, subscribeToPlan)
router.get('/details', protect, getSubscriptionDetails)
router.post('/cancel', protect, cancelSubscription)

export default router
