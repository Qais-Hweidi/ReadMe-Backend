import CategoryModel from '../models/CategoryModel.js'
import { config } from '../../config/config.js'
import { cloudinary } from '../../config/cloudinaryConfig.js'

export const getCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find().sort({ createdAt: -1 })
    res.json({
      success: true,
      categories,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

// Create a new category
export const createCategory = async (req, res) => {
  try {
    const { title } = req.body

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image',
      })
    }

    const categoryExists = await CategoryModel.findOne({ title })
    if (categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists',
      })
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64')
    const dataURI = `data:${req.file.mimetype};base64,${b64}`

    // Create a URL-friendly version of the title
    const public_id = title.toLowerCase().replace(/\s+/g, '-')

    // Upload to Cloudinary with custom public_id
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: 'categories',
      public_id: public_id,
      resource_type: 'auto',
    })

    const category = await CategoryModel.create({
      title,
      image: uploadResult.secure_url,
    })

    res.status(201).json({
      success: true,
      category,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

// Update a category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { title } = req.body

    const category = await CategoryModel.findById(id)
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      })
    }

    const updateData = {}
    if (title) updateData.title = title

    if (req.file) {
      // Upload new image
      const b64 = Buffer.from(req.file.buffer).toString('base64')
      const dataURI = `data:${req.file.mimetype};base64,${b64}`

      const public_id = title
        ? title.toLowerCase().replace(/\s+/g, '-')
        : category.title.toLowerCase().replace(/\s+/g, '-')

      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: 'categories',
        public_id: public_id,
        resource_type: 'auto',
      })

      updateData.image = uploadResult.secure_url

      // Delete old image
      const oldImageId = category.image.split('/').pop().split('.')[0]
      try {
        await cloudinary.uploader.destroy(oldImageId)
      } catch (error) {
        console.error('Error deleting old image:', error)
      }
    }

    const updatedCategory = await CategoryModel.findByIdAndUpdate(id, updateData, { new: true })

    res.json({
      success: true,
      category: updatedCategory,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

// Delete a category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params

    const category = await CategoryModel.findById(id)
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      })
    }

    // Delete image from Cloudinary
    const imageId = category.image.split('/').pop().split('.')[0]
    try {
      await cloudinary.uploader.destroy(imageId)
    } catch (error) {
      console.error('Error deleting image:', error)
    }

    await CategoryModel.findByIdAndDelete(id)

    res.json({
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}
