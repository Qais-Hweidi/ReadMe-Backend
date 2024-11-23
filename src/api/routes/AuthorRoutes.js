import express from 'express'
import {
  getAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
} from '../controllers/AuthorController.js'
import { protect } from '../middlewares/AuthMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import { upload } from '../middlewares/uploadMiddleware.js'
import { createAuthorValidation, updateAuthorValidation } from '../validations/AuthorValidation.js'

const router = express.Router()

// Public routes
router.get('/', getAuthors)
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

export default router
