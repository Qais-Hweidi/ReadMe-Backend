import { StatusCodes } from 'http-status-codes'
import BookModel from '../models/BookModel.js'
import AuthorModel from '../models/AuthorModel.js'
import { config } from '../../config/config.js'

export const searchAll = async (req, res) => {
  try {
    const { query } = req.query

    if (!query) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Search query is required',
      })
    }

    const searchRegex = new RegExp(query, 'i')

    const authors = await AuthorModel.find({
      fullName: searchRegex,
      $or: [
        { isVisible: true },
        { isVisible: { $exists: false } }
      ]
    }).sort({ createdAt: -1 })

    const books = await BookModel.find({
      $and: [
        {
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            {
              authors: {
                $in: (await AuthorModel.find({
                  fullName: searchRegex,
                  $or: [
                    { isVisible: true },
                    { isVisible: { $exists: false } }
                  ]
                }, '_id')).map(
                  author => author._id
                ),
              },
            },
          ],
        },
        {
          $or: [
            { isVisible: true },
            { isVisible: { $exists: false } }
          ]
        },
      ],
    })
      .populate('category', 'title')
      .populate('authors', 'fullName profilePicture')
      .sort({ createdAt: -1 })

    res.status(StatusCodes.OK).json({
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
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}
