import express from 'express'
import { protect, admin } from '../middlewares/AuthMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import {
  sendMessage,
  getMessages,
  getAllChats,
} from '../controllers/ChatController.js'
import { sendMessageValidation } from '../validations/ChatValidation.js'

const router = express.Router()

// All routes need authentication
router.use(protect)

// User & Admin Routes
router.post('/send', validate(sendMessageValidation), sendMessage)
router.get('/messages', getMessages) // For user getting their own messages

// Admin Routes
router.get('/messages/:userEmail', admin, getMessages) // For admin getting specific user's messages
router.get('/all', admin, getAllChats)

export default router 