import AuthorModel from '../models/AuthorModel.js'
import { config } from '../../config/config.js'
import { cloudinary } from '../../config/cloudinaryConfig.js'

export const getAuthors = async (req, res) => {
  try {
    const authors = await AuthorModel.find().sort({ createdAt: -1 })
    res.json({
      success: true,
      authors,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const getAuthorById = async (req, res) => {
  try {
    const author = await AuthorModel.findById(req.params.id)
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found',
      })
    }

    res.json({
      success: true,
      author,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
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

    res.status(201).json({
      success: true,
      author,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
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
      return res.status(404).json({
        success: false,
        message: 'Author not found',
      })
    }

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64')
      const dataURI = `data:${req.file.mimetype};base64,${b64}`

      // Delete old image if it exists
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

    res.json({
      success: true,
      author: updatedAuthor,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const deleteAuthor = async (req, res) => {
  try {
    const author = await AuthorModel.findById(req.params.id)

    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found',
      })
    }

    // Delete profile picture from Cloudinary if it exists
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

    res.json({
      success: true,
      message: 'Author deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}
