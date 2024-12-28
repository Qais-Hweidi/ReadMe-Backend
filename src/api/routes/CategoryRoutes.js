import express from 'express'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryVisibility,
  getAllCategories,
} from '../controllers/CategoryController.js'
import { protect, admin } from '../middlewares/AuthMiddleware.js'
import { upload } from '../middlewares/uploadMiddleware.js'

const router = express.Router()

// Public Routes
router.get('/', getCategories)

// Admin Routes
router.get('/all', protect, admin, getAllCategories)
router.post('/', protect, admin, upload.single('image'), createCategory)
router.put('/:id', protect, admin, upload.single('image'), updateCategory)
router.delete('/:id', protect, admin, deleteCategory)
router.patch('/:id/visibility', protect, admin, toggleCategoryVisibility)

export default router
