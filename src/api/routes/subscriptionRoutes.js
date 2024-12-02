import express from 'express'
import {
  subscribeToPlan,
  getSubscriptionDetails,
  cancelSubscription,
} from '../controllers/subscriptionController.js'
import { protect } from '../middlewares/AuthMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import { subscribeValidation } from '../validations/SubscriptionValidation.js'

const router = express.Router()

// All routes need authentication
router.post('/subscribe', protect, validate(subscribeValidation), subscribeToPlan)
router.get('/details', protect, getSubscriptionDetails)
router.post('/cancel', protect, cancelSubscription)

export default router
