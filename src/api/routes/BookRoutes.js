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
  toggleBookVisibility,
  checkBookAccess,
  checkPurchaseStatus,
  purchaseBook,
  getPurchasedBooks,
} from '../controllers/BookController.js'
import { protect, admin } from '../middlewares/AuthMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import { upload } from '../middlewares/uploadMiddleware.js'
import { createBookValidation, updateBookValidation } from '../validations/BookValidation.js'
import {
  purchaseBookValidation,
  bookIdParamValidation,
} from '../validations/BookPurchaseValidation.js'

const router = express.Router()

// Public Routes
router.get('/', getBooks)

// User Routes (Protected) - Fixed order
router.get('/purchased', protect, getPurchasedBooks)
router.get('/:bookId/protected', protect, validate(bookIdParamValidation, 'params'), getBookById)

// Routes with :bookId parameter
router.get('/:bookId', validate(bookIdParamValidation, 'params'), getBookById)
router.post('/:bookId/view', validate(bookIdParamValidation, 'params'), incrementBookViews)
router.get('/:bookId/access', protect, validate(bookIdParamValidation, 'params'), checkBookAccess)
router.get(
  '/:bookId/purchase-status',
  protect,
  validate(bookIdParamValidation, 'params'),
  checkPurchaseStatus
)
router.post(
  '/:bookId/purchase',
  protect,
  validate(bookIdParamValidation, 'params'),
  validate(purchaseBookValidation, 'body'),
  purchaseBook
)
router.post(
  '/:bookId/download',
  protect,
  validate(bookIdParamValidation, 'params'),
  incrementBookDownloads
)
router.post(
  '/:bookId/read',
  protect,
  validate(bookIdParamValidation, 'params'),
  incrementBookReadings
)

// Admin Routes
router.post(
  '/',
  protect,
  admin,
  upload.single('image'),
  validate(createBookValidation, 'body'),
  createBook
)
router.put(
  '/:bookId',
  protect,
  admin,
  upload.single('image'),
  validate(bookIdParamValidation, 'params'),
  validate(updateBookValidation, 'body'),
  updateBook
)
router.delete('/:bookId', protect, admin, validate(bookIdParamValidation, 'params'), deleteBook)
router.patch(
  '/:bookId/visibility',
  protect,
  admin,
  validate(bookIdParamValidation, 'params'),
  toggleBookVisibility
)

export default router
