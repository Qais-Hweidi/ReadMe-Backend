import BookModel from '../models/BookModel.js'
import AuthorModel from '../models/AuthorModel.js'
import { config } from '../../config/config.js'

export const searchAll = async (req, res) => {
  try {
    const { query } = req.query

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      })
    }

    const searchRegex = new RegExp(query, 'i')

    const authors = await AuthorModel.find({
      fullName: searchRegex,
    }).sort({ createdAt: -1 })

    const books = await BookModel.find({
      $or: [
        { title: searchRegex },
        { description: searchRegex }, // Added search in description
        {
          authors: {
            $in: (await AuthorModel.find({ fullName: searchRegex }, '_id')).map(
              author => author._id
            ),
          },
        },
      ],
    })
      .populate('category', 'title')
      .populate('authors', 'fullName profilePicture')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      results: {
        authors: {
          count: authors.length,
          data: authors,
        },
        books: {
          count: books.length,
          data: books,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}
