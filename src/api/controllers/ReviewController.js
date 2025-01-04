import { StatusCodes } from 'http-status-codes'
import ReviewModel from '../models/ReviewModel.js'
import { config } from '../../config/config.js'
import { moderateContent } from '../services/ContentModerationService.js'

export const getBookReviews = async (req, res) => {
  try {
    const reviews = await ReviewModel.find({ book: req.params.bookId })
      .populate('user', 'fullName profilePicture')
      .sort({ createdAt: -1 })

    res.status(StatusCodes.OK).json({
      reviews,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const createReview = async (req, res) => {
  try {
    // If review content is provided, moderate it
    if (req.body.review) {
      const moderationResult = await moderateContent(req.body.review)
      if (!moderationResult.isAppropriate) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Your review contains inappropriate content',
          reason: moderationResult.reason,
          suggestion: moderationResult.suggestedEdit,
        })
      }
    }

    const review = await ReviewModel.create({
      user: req.user._id,
      book: req.params.bookId,
      ...req.body,
    })

    const populatedReview = await ReviewModel.findById(review._id).populate(
      'user',
      'fullName profilePicture'
    )

    res.status(StatusCodes.CREATED).json({
      review: populatedReview,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'You have already reviewed this book',
      })
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const updateReview = async (req, res) => {
  try {
    const review = await ReviewModel.findOne({
      _id: req.params.reviewId,
      user: req.user._id,
      book: req.params.bookId,
    })

    if (!review) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Review not found or not authorized',
      })
    }

    // If review content is being updated, moderate it
    if (req.body.review) {
      const moderationResult = await moderateContent(req.body.review)
      if (!moderationResult.isAppropriate) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Your review contains inappropriate content',
          reason: moderationResult.reason,
          suggestion: moderationResult.suggestedEdit,
        })
      }
    }

    const updatedReview = await ReviewModel.findByIdAndUpdate(req.params.reviewId, req.body, {
      new: true,
      runValidators: true,
    }).populate('user', 'fullName profilePicture')

    res.status(StatusCodes.OK).json({
      review: updatedReview,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const deleteReview = async (req, res) => {
  try {
    const review = await ReviewModel.findOne({
      _id: req.params.reviewId,
      user: req.user._id,
    })

    if (!review) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Review not found or not authorized',
      })
    }

    await review.deleteOne()

    res.status(StatusCodes.OK).json({
      message: 'Review deleted successfully',
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}
