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
} from '../controllers/UserController.js'
import { protect } from '../middlewares/AuthMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import { upload } from '../middlewares/uploadMiddleware.js'
import {
  registerValidation,
  loginValidation,
  verifyEmailValidation,
} from '../validations/AuthValidation.js'
import { updateProfileValidation } from '../validations/UserValidation.js'

const router = express.Router()

// Registration and login routes
router.post('/auth/register', validate(registerValidation), register)
router.post('/auth/login', validate(loginValidation), login)
router.post('/auth/verify-email', validate(verifyEmailValidation), verifyEmail)
router.post('/auth/logout', protect, logout)

// User profile routes
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

export default router
