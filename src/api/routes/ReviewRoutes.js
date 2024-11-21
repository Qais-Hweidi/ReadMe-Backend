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

router.get('/', getBookReviews)
router.post('/', protect, validate(createReviewValidation), createReview)
router.put('/:reviewId', protect, validate(updateReviewValidation), updateReview)
router.delete('/:reviewId', protect, deleteReview)

export default router
