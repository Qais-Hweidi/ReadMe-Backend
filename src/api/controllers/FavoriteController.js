import { StatusCodes } from 'http-status-codes'
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
          select: 'fullName profilePicture',
        },
      })
      .sort({ createdAt: -1 })

    res.status(StatusCodes.OK).json({
      favorites,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const toggleFavorite = async (req, res) => {
  try {
    const { bookId } = req.params
    const userId = req.user._id

    const book = await BookModel.findById(bookId)
    if (!book) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Book not found',
      })
    }

    const existingFavorite = await FavoriteModel.findOne({
      user: userId,
      book: bookId,
    })

    if (existingFavorite) {
      await existingFavorite.deleteOne()
      await BookModel.findByIdAndUpdate(bookId, { $inc: { numberOfFavourites: -1 } })

      return res.status(StatusCodes.OK).json({
        message: 'Book removed from favorites',
        isFavorited: false,
      })
    } else {
      await FavoriteModel.create({
        user: userId,
        book: bookId,
      })
      await BookModel.findByIdAndUpdate(bookId, { $inc: { numberOfFavourites: 1 } })

      return res.status(StatusCodes.OK).json({
        message: 'Book added to favorites',
        isFavorited: true,
      })
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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

    res.status(StatusCodes.OK).json({
      isFavorited: !!favorite,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}
