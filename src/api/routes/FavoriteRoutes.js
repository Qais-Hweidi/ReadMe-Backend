import express from 'express'
import {
  getFavorites,
  toggleFavorite,
  checkFavoriteStatus,
} from '../controllers/FavoriteController.js'
import { protect } from '../middlewares/AuthMiddleware.js'

const router = express.Router()

router.get('/', protect, getFavorites)
router.post('/books/:bookId', protect, toggleFavorite)
router.get('/books/:bookId/status', protect, checkFavoriteStatus)

export default router 