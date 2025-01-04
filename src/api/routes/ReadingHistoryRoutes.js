import express from 'express'
import {
  getContinueReading,
  addToReadingHistory,
  removeFromReadingHistory,
} from '../controllers/ReadingHistoryController.js'
import { protect } from '../middlewares/AuthMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import { readingHistoryValidation } from '../validations/ReadingHistoryValidation.js'

const router = express.Router()

// User Routes (Protected)
router.get('/', protect, getContinueReading)
router.post(
  '/books/:bookId',
  protect,
  validate(readingHistoryValidation, 'params'),
  addToReadingHistory
)
router.delete(
  '/books/:bookId',
  protect,
  validate(readingHistoryValidation, 'params'),
  removeFromReadingHistory
)

export default router
