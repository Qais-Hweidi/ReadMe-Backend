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
import { protect } from '../middlewares/AuthMiddleware.js'
import { upload } from '../middlewares/uploadMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import { createAuthorValidation, updateAuthorValidation } from '../validations/AuthorValidation.js'

const router = express.Router()

// Public routes
router.get('/', getAuthors)
router.get('/with-book-count', getAuthorsWithBookCount)
router.get('/:id', getAuthorById)

// Protected routes
router.post(
  '/',
  protect,
  upload.single('profilePicture'),
  validate(createAuthorValidation),
  createAuthor
)
router.put(
  '/:id',
  protect,
  upload.single('profilePicture'),
  validate(updateAuthorValidation),
  updateAuthor
)
router.delete('/:id', protect, deleteAuthor)
router.patch('/:id/visibility', protect, toggleAuthorVisibility)

export default router
