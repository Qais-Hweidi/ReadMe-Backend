import express from 'express'
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  incrementBookViews,
  incrementBookDownloads,
  incrementBookReadings,
  toggleBookFavorite,
} from '../controllers/BookController.js'
import { protect } from '../middlewares/AuthMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import { upload } from '../middlewares/uploadMiddleware.js'
import { createBookValidation, updateBookValidation } from '../validations/BookValidation.js'

const router = express.Router()

// Public routes
router.get('/', getBooks)
router.get('/:id', getBookById)

// Protected routes
router.post('/', protect, upload.single('image'), validate(createBookValidation), createBook)
router.put('/:id', protect, upload.single('image'), validate(updateBookValidation), updateBook)
router.delete('/:id', protect, deleteBook)

// Interaction routes
router.post('/:id/view', protect, incrementBookViews)
router.post('/:id/download', protect, incrementBookDownloads)
router.post('/:id/read', protect, incrementBookReadings)
router.post('/:id/favorite', protect, toggleBookFavorite)

export default router
