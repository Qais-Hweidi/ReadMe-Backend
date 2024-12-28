import express from 'express'
import {
  getAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  toggleAuthorVisibility,
  getAuthorsWithBookCount,
  getAllAuthors,
} from '../controllers/AuthorController.js'
import { protect, admin } from '../middlewares/AuthMiddleware.js'
import { upload } from '../middlewares/uploadMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import { createAuthorValidation, updateAuthorValidation } from '../validations/AuthorValidation.js'

const router = express.Router()

// Public Routes
router.get('/', getAuthors)
router.get('/with-book-count', getAuthorsWithBookCount)

// Admin Routes
router.get('/all', protect, admin, getAllAuthors)
router.post(
  '/',
  protect,
  admin,
  upload.single('profilePicture'),
  validate(createAuthorValidation),
  createAuthor
)

// Routes with :id parameter
router.get('/:id', getAuthorById)
router.put(
  '/:id',
  protect,
  admin,
  upload.single('profilePicture'),
  validate(updateAuthorValidation),
  updateAuthor
)
router.delete('/:id', protect, admin, deleteAuthor)
router.patch('/:id/visibility', protect, admin, toggleAuthorVisibility)

export default router
