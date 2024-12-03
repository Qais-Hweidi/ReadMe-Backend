import { StatusCodes } from 'http-status-codes'
import BookModel from '../models/BookModel.js'
import PurchasedBooks from '../models/PurchasedBooksModel.js'
import { config } from '../../config/config.js'
import { cloudinary } from '../../config/cloudinaryConfig.js'

// Helper function to check if user can access premium book
const canAccessPremiumBook = async (user, book) => {
  if (book.free) return true
  if (!user) return false

  // Check if user has purchased this book
  const hasPurchased = await PurchasedBooks.findOne({ user: user._id, book: book._id })
  if (hasPurchased) return true

  // If not purchased, check subscription
  return user.subscriptionStatus === 'active' && user.subscriptionExpiryDate > new Date()
}

// Helper function to validate book purchase eligibility
const validatePurchaseEligibility = async (user, book, expectedPrice) => {
  // Check if book exists and is not free
  if (!book) {
    return {
      status: StatusCodes.NOT_FOUND,
      message: 'Book not found',
    }
  }

  // Check if user has active subscription
  if (user.subscriptionStatus === 'active' && user.subscriptionExpiryDate > new Date()) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: 'You have an active subscription that gives you access to all books',
    }
  }

  if (book.free) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: 'This book is free and does not require purchase',
    }
  }

  // Check if book is visible/available
  if (!book.isVisible) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: 'This book is not available for purchase',
    }
  }

  // Check if user has already purchased
  const existingPurchase = await PurchasedBooks.findOne({
    user: user._id,
    book: book._id,
  })
  if (existingPurchase) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: 'You have already purchased this book',
    }
  }

  // Validate price if expectedPrice is provided
  if (expectedPrice !== undefined && expectedPrice !== book.price) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: 'Book price has changed. Please check the current price',
    }
  }

  return null // No error
}

// Check if user has purchased a specific book
export const checkPurchaseStatus = async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.bookId)
    if (!book) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Book not found',
      })
    }

    // If book is free, no need to purchase
    if (book.free) {
      return res.status(StatusCodes.OK).json({
        isPurchased: true,
        isFree: true,
        message: 'This is a free book',
      })
    }

    // Check if book is visible/available
    if (!book.isVisible) {
      return res.status(StatusCodes.OK).json({
        isPurchased: false,
        isFree: false,
        canPurchase: false,
        message: 'This book is not available for purchase',
      })
    }

    const purchase = await PurchasedBooks.findOne({
      user: req.user._id,
      book: book._id,
    })

    const hasSubscriptionAccess =
      req.user.subscriptionStatus === 'active' && req.user.subscriptionExpiryDate > new Date()

    res.status(StatusCodes.OK).json({
      isPurchased: !!purchase,
      isFree: false,
      price: book.price,
      canPurchase: !purchase && !book.free && !hasSubscriptionAccess,
      hasSubscriptionAccess,
      message: purchase
        ? 'You own this book'
        : hasSubscriptionAccess
          ? 'Available through your subscription'
          : 'Book available for purchase',
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

// Purchase a book
export const purchaseBook = async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.bookId)

    // Validate purchase eligibility
    const validationError = await validatePurchaseEligibility(
      req.user,
      book,
      req.body.expectedPrice
    )
    if (validationError) {
      return res.status(validationError.status).json({
        message: validationError.message,
      })
    }

    // Create purchase record
    const purchase = await PurchasedBooks.create({
      user: req.user._id,
      book: book._id,
      purchasePrice: book.price,
    })

    const populatedPurchase = await PurchasedBooks.findById(purchase._id)
      .populate('book', 'title image authors description')
      .populate({
        path: 'book',
        populate: {
          path: 'authors',
          select: 'fullName profilePicture',
        },
      })

    res.status(StatusCodes.CREATED).json({
      message: 'Book purchased successfully',
      purchase: populatedPurchase,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'You have already purchased this book',
      })
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

// Get user's purchased books
export const getPurchasedBooks = async (req, res) => {
  try {
    const purchases = await PurchasedBooks.find({ user: req.user._id })
      .populate({
        path: 'book',
        select: 'title image authors description bookLink',
        populate: {
          path: 'authors',
          select: 'fullName profilePicture',
        },
      })
      .sort({ purchaseDate: -1 })

    // Filter out books that are no longer visible (unless already purchased)
    const visiblePurchases = purchases.filter(
      purchase => purchase.book && (purchase.book.isVisible || purchase.purchaseDate)
    )

    res.status(StatusCodes.OK).json({
      purchases: visiblePurchases,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

// Check if user can access a specific book
export const checkBookAccess = async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.bookId)
    if (!book) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Book not found',
      })
    }

    const hasAccess = await canAccessPremiumBook(req.user, book)
    res.status(StatusCodes.OK).json({
      hasAccess,
      requiresSubscription: !book.free,
      message: hasAccess
        ? 'You can access this book'
        : book.free
          ? 'This is a free book'
          : 'This book requires an active subscription',
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const getBooks = async (req, res) => {
  try {
    const books = await BookModel.find({
      $or: [{ isVisible: true }, { isVisible: { $exists: false } }],
    })
      .populate('category', 'title')
      .populate('authors', 'fullName profilePicture')
      .sort({ createdAt: -1 })

    // Modify book data based on user's subscription status
    const modifiedBooks = books.map(book => {
      const bookObj = book.toObject()
      if (!book.free && (!req.user || req.user.subscriptionStatus !== 'active')) {
        delete bookObj.bookLink // Remove download link for premium books
      }
      return bookObj
    })

    res.status(StatusCodes.OK).json({
      books: modifiedBooks,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const getBookById = async (req, res) => {
  try {
    const book = await BookModel.findOne({
      _id: req.params.bookId,
      $or: [{ isVisible: true }, { isVisible: { $exists: false } }],
    })
      .populate('category', 'title')
      .populate('authors', 'fullName bio profilePicture socialLinks')

    if (!book) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Book not found',
      })
    }

    // Convert to plain object to modify
    const bookObj = book.toObject()

    // Check if user can access premium content
    const hasAccess = await canAccessPremiumBook(req.user, book)
    if (!hasAccess) {
      delete bookObj.bookLink // Remove download link for premium books
    }

    res.status(StatusCodes.OK).json({
      book: bookObj,
      hasAccess,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const createBook = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Please upload a book cover image',
      })
    }

    // Handle authors field
    let authorIds = []
    if (typeof req.body.authors === 'string') {
      try {
        authorIds = JSON.parse(req.body.authors)
      } catch (e) {
        authorIds = [req.body.authors]
      }
    } else if (Array.isArray(req.body.authors)) {
      authorIds = req.body.authors
    } else if (req.body.authors) {
      authorIds = [req.body.authors]
    }

    if (!Array.isArray(authorIds)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Authors must be provided as an array or single ID',
      })
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64')
    const dataURI = `data:${req.file.mimetype};base64,${b64}`

    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: 'books',
      resource_type: 'auto',
    })

    // Ensure free and price fields are properly set
    const bookData = {
      ...req.body,
      authors: authorIds,
      image: uploadResult.secure_url,
      free: req.body.free === 'true',
    }

    // If book is free, remove price
    if (bookData.free) {
      delete bookData.price
    } else {
      // Ensure price is set for non-free books
      if (!bookData.price) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Price is required for premium books',
        })
      }
      bookData.price = Number(bookData.price)
    }

    const book = await BookModel.create(bookData)

    const populatedBook = await BookModel.findById(book._id)
      .populate('category', 'title')
      .populate('authors', 'fullName profilePicture')

    res.status(StatusCodes.CREATED).json({
      book: populatedBook,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const updateBook = async (req, res) => {
  try {
    const updateData = { ...req.body }
    const book = await BookModel.findById(req.params.bookId)

    if (!book) {
      return res.status(StatusCodes.NOT_FOUND).json({
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
        return res.status(StatusCodes.BAD_REQUEST).json({
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

    const updatedBook = await BookModel.findByIdAndUpdate(req.params.bookId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'title')
      .populate('authors', 'fullName profilePicture')

    res.status(StatusCodes.OK).json({
      book: updatedBook,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const deleteBook = async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.bookId)

    if (!book) {
      return res.status(StatusCodes.NOT_FOUND).json({
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

    res.status(StatusCodes.OK).json({
      message: 'Book deleted successfully',
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const incrementBookViews = async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.bookId)

    if (!book) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Book not found',
      })
    }

    // Allow viewing book details without subscription
    const updatedBook = await BookModel.findByIdAndUpdate(
      req.params.bookId,
      { $inc: { numberOfViews: 1 } },
      { new: true }
    )

    res.status(StatusCodes.OK).json({
      message: 'Views incremented successfully',
      numberOfViews: updatedBook.numberOfViews,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const incrementBookDownloads = async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.bookId)

    if (!book) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Book not found',
      })
    }

    // Check if user can access the book
    const hasAccess = await canAccessPremiumBook(req.user, book)
    if (!hasAccess) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'This book requires an active subscription to download',
      })
    }

    const updatedBook = await BookModel.findByIdAndUpdate(
      req.params.bookId,
      { $inc: { numberOfDownloads: 1 } },
      { new: true }
    )

    res.status(StatusCodes.OK).json({
      message: 'Downloads incremented successfully',
      numberOfDownloads: updatedBook.numberOfDownloads,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const incrementBookReadings = async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.bookId)

    if (!book) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Book not found',
      })
    }

    // Check if user can access the book
    const hasAccess = await canAccessPremiumBook(req.user, book)
    if (!hasAccess) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'This book requires an active subscription to read',
      })
    }

    const updatedBook = await BookModel.findByIdAndUpdate(
      req.params.bookId,
      { $inc: { numberOfReadings: 1 } },
      { new: true }
    )

    res.status(StatusCodes.OK).json({
      message: 'Readings incremented successfully',
      numberOfReadings: updatedBook.numberOfReadings,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const toggleBookFavorite = async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.bookId)

    if (!book) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Book not found',
      })
    }

    // Allow favoriting even without subscription
    const updatedBook = await BookModel.findByIdAndUpdate(
      req.params.bookId,
      { $inc: { numberOfFavourites: 1 } },
      { new: true }
    )

    res.status(StatusCodes.OK).json({
      message: 'Favourites toggled successfully',
      numberOfFavourites: updatedBook.numberOfFavourites,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const toggleBookVisibility = async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.bookId)

    if (!book) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Book not found',
      })
    }

    book.isVisible = !book.isVisible
    await book.save()

    res.status(StatusCodes.OK).json({
      message: `Book is now ${book.isVisible ? 'visible' : 'hidden'}`,
      isVisible: book.isVisible,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}
