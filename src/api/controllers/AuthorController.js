import { StatusCodes } from 'http-status-codes'
import AuthorModel from '../models/AuthorModel.js'
import BookModel from '../models/BookModel.js'
import { config } from '../../config/config.js'
import { cloudinary } from '../../config/cloudinaryConfig.js'

export const getAuthors = async (req, res) => {
  try {
    const authors = await AuthorModel.find({
      $or: [
        { isVisible: true },
        { isVisible: { $exists: false } }
      ]
    }).sort({ createdAt: -1 })
    res.status(StatusCodes.OK).json({
      authors,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const getAuthorById = async (req, res) => {
  try {
    const author = await AuthorModel.findOne({
      _id: req.params.id,
      $or: [
        { isVisible: true },
        { isVisible: { $exists: false } }
      ]
    })
    if (!author) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Author not found',
      })
    }

    res.status(StatusCodes.OK).json({
      author,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const createAuthor = async (req, res) => {
  try {
    const authorData = {
      fullName: req.body.fullName,
      bio: req.body.bio,
      socialLinks: {
        facebook: req.body.facebook,
        instagram: req.body.instagram,
        linkedin: req.body.linkedin,
        website: req.body.website,
      },
    }

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64')
      const dataURI = `data:${req.file.mimetype};base64,${b64}`

      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: 'authors',
        resource_type: 'auto',
      })

      authorData.profilePicture = uploadResult.secure_url
    }

    const author = await AuthorModel.create(authorData)

    res.status(StatusCodes.CREATED).json({
      author,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const updateAuthor = async (req, res) => {
  try {
    const updateData = { ...req.body }
    const author = await AuthorModel.findById(req.params.id)

    if (!author) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Author not found',
      })
    }

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64')
      const dataURI = `data:${req.file.mimetype};base64,${b64}`

      if (author.profilePicture) {
        const urlParts = author.profilePicture.split('/')
        const filename = urlParts[urlParts.length - 1]
        const oldPublicId = `authors/${filename.split('.')[0]}`

        try {
          await cloudinary.uploader.destroy(oldPublicId)
        } catch (error) {
          console.error('Error deleting old author image:', error)
        }
      }

      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: 'authors',
        resource_type: 'auto',
      })

      updateData.profilePicture = uploadResult.secure_url
    }

    const updatedAuthor = await AuthorModel.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })

    res.status(StatusCodes.OK).json({
      author: updatedAuthor,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const deleteAuthor = async (req, res) => {
  try {
    const author = await AuthorModel.findById(req.params.id)

    if (!author) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Author not found',
      })
    }

    if (author.profilePicture) {
      const urlParts = author.profilePicture.split('/')
      const filename = urlParts[urlParts.length - 1]
      const publicId = `authors/${filename.split('.')[0]}`

      try {
        await cloudinary.uploader.destroy(publicId)
      } catch (error) {
        console.error('Error deleting author image:', error)
      }
    }

    await author.deleteOne()

    res.status(StatusCodes.OK).json({
      message: 'Author deleted successfully',
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const toggleAuthorVisibility = async (req, res) => {
  try {
    const author = await AuthorModel.findById(req.params.id)

    if (!author) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Author not found',
      })
    }

    author.isVisible = !author.isVisible
    await author.save()

    res.status(StatusCodes.OK).json({
      message: `Author is now ${author.isVisible ? 'visible' : 'hidden'}`,
      isVisible: author.isVisible,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const getAuthorsWithBookCount = async (req, res) => {
  try {
    const authors = await AuthorModel.aggregate([
      {
        $match: {
          $or: [
            { isVisible: true },
            { isVisible: { $exists: false } }
          ]
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: 'authors',
          pipeline: [
            {
              $match: {
                $or: [
                  { isVisible: true },
                  { isVisible: { $exists: false } }
                ]
              }
            }
          ],
          as: 'books'
        }
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          profilePicture: 1,
          bookCount: { $size: '$books' },
        }
      },
    ])

    res.status(StatusCodes.OK).json({
      authors,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}
