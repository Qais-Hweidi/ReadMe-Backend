import express from 'express'
import { register, login, verifyEmail, getMe } from '../controllers/UserController.js'
import { protect } from '../middlewares/AuthMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import {
  registerValidation,
  loginValidation,
  verifyEmailValidation,
} from '../validations/AuthValidation.js'

const router = express.Router()

// Registration and login routes
router.post('/auth/register', validate(registerValidation), register)
router.post('/auth/login', validate(loginValidation), login)
router.post('/auth/verify-email', validate(verifyEmailValidation), verifyEmail)

// User info route
router.get('/me', protect, getMe)

export default router
