import express from 'express'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/CategoryController.js'
import { protect } from '../middlewares/AuthMiddleware.js'
import { upload } from '../middlewares/uploadMiddleware.js'

const router = express.Router()

router.get('/', getCategories)
router.post('/', protect, upload.single('image'), createCategory)
router.put('/:id', protect, upload.single('image'), updateCategory)
router.delete('/:id', protect, deleteCategory)

export default router