import express from 'express'
import {
  getAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  toggleAuthorVisibility,
  getAuthorsWithBookCount,
} from '../controllers/AuthorController.js'
import { protect, admin } from '../middlewares/AuthMiddleware.js'
import { upload } from '../middlewares/uploadMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import { createAuthorValidation, updateAuthorValidation } from '../validations/AuthorValidation.js'

const router = express.Router()

// Public Routes
router.get('/', getAuthors)
router.get('/with-book-count', getAuthorsWithBookCount)
router.get('/:id', getAuthorById)

// Admin Routes
router.post(
  '/',
  protect,
  admin,
  upload.single('profilePicture'),
  validate(createAuthorValidation),
  createAuthor
)
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
