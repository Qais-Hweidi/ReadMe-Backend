import ReviewModel from '../models/ReviewModel.js'
import { config } from '../../config/config.js'

export const getBookReviews = async (req, res) => {
  try {
    const reviews = await ReviewModel.find({ book: req.params.bookId })
      .populate('user', 'fullName profilePicture')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      reviews,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const createReview = async (req, res) => {
  try {
    const review = await ReviewModel.create({
      user: req.user._id,
      book: req.params.bookId,
      ...req.body,
    })

    const populatedReview = await ReviewModel.findById(review._id).populate(
      'user',
      'fullName profilePicture'
    )

    res.status(201).json({
      success: true,
      review: populatedReview,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this book',
      })
    }

    res.status(500).json({
      success: false,
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
    })

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not authorized',
      })
    }

    const updatedReview = await ReviewModel.findByIdAndUpdate(req.params.reviewId, req.body, {
      new: true,
      runValidators: true,
    }).populate('user', 'fullName profilePicture')

    res.json({
      success: true,
      review: updatedReview,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
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
      return res.status(404).json({
        success: false,
        message: 'Review not found or not authorized',
      })
    }

    await review.deleteOne()

    res.json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}
