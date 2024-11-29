import ReadingHistoryModel from '../models/ReadingHistoryModel.js'
import { config } from '../../config/config.js'

export const getContinueReading = async (req, res) => {
  try {
    const readingHistory = await ReadingHistoryModel.find({ user: req.user._id })
      .populate({
        path: 'book',
        select: 'title image authors description',
        populate: {
          path: 'authors',
          select: 'fullName profilePicture'
        }
      })
      .sort({ lastReadAt: -1 })

    res.json({
      success: true,
      readingHistory,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const addToReadingHistory = async (req, res) => {
  try {
    const { bookId } = req.params

    // Update or create reading history entry
    const readingHistory = await ReadingHistoryModel.findOneAndUpdate(
      { user: req.user._id, book: bookId },
      { lastReadAt: new Date() },
      { upsert: true, new: true }
    ).populate({
      path: 'book',
      select: 'title image authors description',
      populate: {
        path: 'authors',
        select: 'fullName profilePicture'
      }
    })

    res.json({
      success: true,
      readingHistory,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Book already in reading history',
      })
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const removeFromReadingHistory = async (req, res) => {
  try {
    const { bookId } = req.params
    
    await ReadingHistoryModel.findOneAndDelete({
      user: req.user._id,
      book: bookId,
    })

    res.json({
      success: true,
      message: 'Book removed from reading history',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
} 