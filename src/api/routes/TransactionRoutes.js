import express from 'express'
import {
  createTransaction,
  getUserTransactions,
  getTransactionById,
  updateTransactionStatus,
  getAllTransactions,
  handlePaymentCallback,
} from '../controllers/TransactionController.js'
import { protect, admin } from '../middlewares/AuthMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import {
  createTransactionValidation,
  updateTransactionValidation,
  getTransactionsQueryValidation,
} from '../validations/TransactionValidation.js'

const router = express.Router()

// User Routes (Protected)
router.get('/callback', handlePaymentCallback)
router.get('/', protect, validate(getTransactionsQueryValidation, 'query'), getUserTransactions)
router.get('/:transactionId', protect, getTransactionById)
router.post('/', protect, validate(createTransactionValidation), createTransaction)

// Admin Routes
router.get(
  '/admin/all',
  protect,
  admin,
  validate(getTransactionsQueryValidation, 'query'),
  getAllTransactions
)
router.patch(
  '/:transactionId/status',
  protect,
  admin,
  validate(updateTransactionValidation),
  updateTransactionStatus
)

export default router
