import express from 'express'
import { protect, admin } from '../middlewares/authMiddleware.js'
import {
  registerFcmToken,
  unregisterFcmToken,
  sendNotificationToAll,
  sendNotificationToFreeUsers,
  sendNotificationToSubscribedUsers,
  sendNotificationToUser,
} from '../controllers/NotificationController.js'

const router = express.Router()

// User routes
router.post('/register-token', protect, registerFcmToken)
router.post('/unregister-token', protect, unregisterFcmToken)

// Admin routes
router.post('/send/all', protect, admin, sendNotificationToAll)
router.post('/send/free-users', protect, admin, sendNotificationToFreeUsers)
router.post('/send/subscribed-users', protect, admin, sendNotificationToSubscribedUsers)
router.post('/send/user/:userId', protect, admin, sendNotificationToUser)

export default router 