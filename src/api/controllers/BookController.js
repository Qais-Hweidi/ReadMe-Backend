import BookModel from '../models/BookModel.js'
import { config } from '../../config/config.js'
import { cloudinary } from '../../config/cloudinaryConfig.js'

export const getBooks = async (req, res) => {
  try {
    const books = await BookModel.find()
      .populate('category', 'title')
      .populate('authors', 'fullName profilePicture')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      books,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const getBookById = async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.id)
      .populate('category', 'title')
      .populate('authors', 'fullName bio profilePicture socialLinks')

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      })
    }

    res.json({
      success: true,
      book,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const createBook = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a book cover image',
      })
    }

    // Handle authors field
    let authorIds = []
    if (typeof req.body.authors === 'string') {
      try {
        // Try to parse as JSON array first
        authorIds = JSON.parse(req.body.authors)
      } catch (e) {
        // If parsing fails, treat it as a single ID
        authorIds = [req.body.authors]
      }
    } else if (Array.isArray(req.body.authors)) {
      authorIds = req.body.authors
    } else if (req.body.authors) {
      authorIds = [req.body.authors]
    }

    // Ensure authorIds is an array
    if (!Array.isArray(authorIds)) {
      return res.status(400).json({
        success: false,
        message: 'Authors must be provided as an array or single ID',
      })
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64')
    const dataURI = `data:${req.file.mimetype};base64,${b64}`

    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: 'books',
      resource_type: 'auto',
    })

    const book = await BookModel.create({
      ...req.body,
      authors: authorIds,
      image: uploadResult.secure_url,
    })

    const populatedBook = await BookModel.findById(book._id)
      .populate('category', 'title')
      .populate('authors', 'fullName profilePicture')

    res.status(201).json({
      success: true,
      book: populatedBook,
    })
  } catch (error) {
    console.error('Create book error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const updateBook = async (req, res) => {
  try {
    const updateData = { ...req.body }
    const book = await BookModel.findById(req.params.id)

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      })
    }

    // Handle authors array if it exists in the request
    if (req.body.authors) {
      try {
        // First try to parse as JSON if it's a string
        updateData.authors =
          typeof req.body.authors === 'string' ? JSON.parse(req.body.authors) : req.body.authors

        // Ensure it's an array
        if (!Array.isArray(updateData.authors)) {
          updateData.authors = [updateData.authors]
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Authors must be provided as a valid array or JSON string array',
        })
      }
    }

    if (req.file) {
      // Upload new image
      const b64 = Buffer.from(req.file.buffer).toString('base64')
      const dataURI = `data:${req.file.mimetype};base64,${b64}`

      // Delete old image
      if (book.image) {
        const urlParts = book.image.split('/')
        const filename = urlParts[urlParts.length - 1]
        const oldPublicId = `books/${filename.split('.')[0]}`

        try {
          await cloudinary.uploader.destroy(oldPublicId)
        } catch (error) {
          console.error('Error deleting old book image:', error)
        }
      }

      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: 'books',
        resource_type: 'auto',
      })

      updateData.image = uploadResult.secure_url
    }

    const updatedBook = await BookModel.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'title')
      .populate('authors', 'fullName profilePicture')

    res.json({
      success: true,
      book: updatedBook,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const deleteBook = async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.id)

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      })
    }

    // Delete image from Cloudinary
    if (book.image) {
      const urlParts = book.image.split('/')
      const filename = urlParts[urlParts.length - 1]
      const publicId = `books/${filename.split('.')[0]}`

      try {
        await cloudinary.uploader.destroy(publicId)
      } catch (error) {
        console.error('Error deleting book image:', error)
      }
    }

    await book.deleteOne()

    res.json({
      success: true,
      message: 'Book deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const incrementBookViews = async (req, res) => {
  try {
    const book = await BookModel.findByIdAndUpdate(
      req.params.id,
      { $inc: { numberOfViews: 1 } },
      { new: true }
    )

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      })
    }

    res.json({
      success: true,
      numberOfViews: book.numberOfViews,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const incrementBookDownloads = async (req, res) => {
  try {
    const book = await BookModel.findByIdAndUpdate(
      req.params.id,
      { $inc: { numberOfDownloads: 1 } },
      { new: true }
    )

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      })
    }

    res.json({
      success: true,
      numberOfDownloads: book.numberOfDownloads,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const incrementBookReadings = async (req, res) => {
  try {
    const book = await BookModel.findByIdAndUpdate(
      req.params.id,
      { $inc: { numberOfReadings: 1 } },
      { new: true }
    )

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      })
    }

    res.json({
      success: true,
      numberOfReadings: book.numberOfReadings,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const toggleBookFavorite = async (req, res) => {
  try {
    const book = await BookModel.findByIdAndUpdate(
      req.params.id,
      { $inc: { numberOfFavourites: 1 } },
      { new: true }
    )

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      })
    }

    res.json({
      success: true,
      numberOfFavourites: book.numberOfFavourites,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}
