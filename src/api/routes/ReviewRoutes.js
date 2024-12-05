import express from 'express'
import {
  getBookReviews,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/ReviewController.js'
import { protect } from '../middlewares/AuthMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import { createReviewValidation, updateReviewValidation } from '../validations/ReviewValidation.js'

const router = express.Router({ mergeParams: true })

// Public Routes
router.get('/', getBookReviews)

// User Routes (Protected)
router.post(
  '/',
  protect,
  validate(createReviewValidation.body),
  validate(createReviewValidation.params, 'params'),
  createReview
)
router.put(
  '/:reviewId',
  protect,
  validate(updateReviewValidation.body),
  validate(updateReviewValidation.params, 'params'),
  updateReview
)
router.delete(
  '/:reviewId',
  protect,
  validate(updateReviewValidation.params, 'params'),
  deleteReview
)

export default router
