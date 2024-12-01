import FavoriteModel from '../models/FavoriteModel.js'
import BookModel from '../models/BookModel.js'
import { config } from '../../config/config.js'

export const getFavorites = async (req, res) => {
  try {
    const favorites = await FavoriteModel.find({ user: req.user._id })
      .populate({
        path: 'book',
        select: 'title image authors description',
        populate: {
          path: 'authors',
          select: 'fullName profilePicture'
        }
      })
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      favorites,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const toggleFavorite = async (req, res) => {
  try {
    const { bookId } = req.params
    const userId = req.user._id

    // Check if book exists
    const book = await BookModel.findById(bookId)
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      })
    }

    // Check if book is already favorited
    const existingFavorite = await FavoriteModel.findOne({
      user: userId,
      book: bookId,
    })

    if (existingFavorite) {
      // Remove from favorites and decrement count
      await existingFavorite.deleteOne()
      await BookModel.findByIdAndUpdate(bookId, { $inc: { numberOfFavourites: -1 } })

      return res.json({
        success: true,
        message: 'Book removed from favorites',
        isFavorited: false,
      })
    } else {
      // Add to favorites and increment count
      await FavoriteModel.create({
        user: userId,
        book: bookId,
      })
      await BookModel.findByIdAndUpdate(bookId, { $inc: { numberOfFavourites: 1 } })

      return res.json({
        success: true,
        message: 'Book added to favorites',
        isFavorited: true,
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const checkFavoriteStatus = async (req, res) => {
  try {
    const { bookId } = req.params
    const userId = req.user._id

    const favorite = await FavoriteModel.findOne({
      user: userId,
      book: bookId,
    })

    res.json({
      success: true,
      isFavorited: !!favorite,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
} 