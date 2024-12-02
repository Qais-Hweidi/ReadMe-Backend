import express from 'express'
import {
  createSubscriptionPlan,
  getSubscriptionPlans,
  getAllSubscriptionPlans,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from '../controllers/subscriptionPlanController.js'
import { protect, admin } from '../middlewares/AuthMiddleware.js'

const router = express.Router()

// Public routes
router.get('/visible', getSubscriptionPlans)

// Admin routes
router.post('/', protect, admin, createSubscriptionPlan)
router.get('/', protect, admin, getAllSubscriptionPlans)
router.put('/:id', protect, admin, updateSubscriptionPlan)
router.delete('/:id', protect, admin, deleteSubscriptionPlan)

export default router
