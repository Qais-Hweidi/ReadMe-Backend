import express from 'express'
import {
  register,
  login,
  verifyEmail,
  getMe,
  updateProfile,
  deleteProfilePicture,
  logout,
  deleteAccount,
  getUserCount,
} from '../controllers/UserController.js'
import { protect, admin } from '../middlewares/AuthMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import { upload } from '../middlewares/uploadMiddleware.js'
import {
  registerValidation,
  loginValidation,
  verifyEmailValidation,
} from '../validations/AuthValidation.js'
import { updateProfileValidation } from '../validations/UserValidation.js'

const router = express.Router()

// Public Routes (Auth)
router.post('/auth/register', validate(registerValidation), register)
router.post('/auth/login', validate(loginValidation), login)
router.post('/auth/verify-email', validate(verifyEmailValidation), verifyEmail)

// Admin Routes
router.get('/count', protect, admin, getUserCount)

// User Routes (Protected)
// Profile Management
router.get('/me', protect, getMe)
router.put(
  '/profile',
  protect,
  upload.single('profilePicture'),
  validate(updateProfileValidation),
  updateProfile
)
router.delete('/profile/picture', protect, deleteProfilePicture)
router.delete('/account', protect, deleteAccount)
router.post('/auth/logout', protect, logout)

export default router
