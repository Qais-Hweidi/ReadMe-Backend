import express from 'express'
import { register, login, getMe } from '../controllers/AuthController.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import { registerValidation, loginValidation } from '../validations/AuthValidation.js'
import { protect } from '../middlewares/AuthMiddleware.js'

const router = express.Router()

router.post('/register', validate(registerValidation), register)
router.post('/login', validate(loginValidation), login)
router.get('/me', protect, getMe)

export default router 