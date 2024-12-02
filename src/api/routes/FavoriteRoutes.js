import express from 'express'
import {
  getFavorites,
  toggleFavorite,
  checkFavoriteStatus,
} from '../controllers/FavoriteController.js'
import { protect } from '../middlewares/AuthMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import { favoriteValidation } from '../validations/FavoriteValidation.js'

const router = express.Router()

// User Routes (Protected)
router.get('/', protect, getFavorites)
router.get('/books/:bookId/status', protect, validate(favoriteValidation), checkFavoriteStatus)
router.post('/books/:bookId', protect, validate(favoriteValidation), toggleFavorite)

export default router 