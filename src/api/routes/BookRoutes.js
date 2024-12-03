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
  toggleBookVisibility,
  checkBookAccess,
} from '../controllers/BookController.js'
import { protect, admin } from '../middlewares/AuthMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import { upload } from '../middlewares/uploadMiddleware.js'
import { createBookValidation, updateBookValidation } from '../validations/BookValidation.js'

const router = express.Router()

// Public Routes
router.get('/', getBooks)
router.get('/:id', getBookById)
router.post('/:id/view', incrementBookViews)

// User Routes (Protected)
router.get('/:id/access', protect, checkBookAccess)
router.post('/:id/download', protect, incrementBookDownloads)
router.post('/:id/read', protect, incrementBookReadings)
router.post('/:id/favorite', protect, toggleBookFavorite)

// Admin Routes
router.post('/', protect, admin, upload.single('image'), validate(createBookValidation), createBook)
router.put('/:id', protect, admin, upload.single('image'), validate(updateBookValidation), updateBook)
router.delete('/:id', protect, admin, deleteBook)
router.patch('/:id/visibility', protect, admin, toggleBookVisibility)

export default router
