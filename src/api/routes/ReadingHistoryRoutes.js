import express from 'express'
import {
  getContinueReading,
  addToReadingHistory,
  removeFromReadingHistory,
} from '../controllers/ReadingHistoryController.js'
import { protect } from '../middlewares/AuthMiddleware.js'

const router = express.Router()

router.get('/', protect, getContinueReading)
router.post('/books/:bookId', protect, addToReadingHistory)
router.delete('/books/:bookId', protect, removeFromReadingHistory)

export default router 