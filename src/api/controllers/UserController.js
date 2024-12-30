import { randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { StatusCodes } from 'http-status-codes'
import UserModel from '../models/UserModel.js'
import { sendVerificationEmail } from '../../config/EmailConfig.js'
import { config } from '../../config/config.js'
import { cloudinary } from '../../config/cloudinaryConfig.js'
import ReviewModel from '../models/ReviewModel.js'
import ReportModel from '../models/ReportModel.js'

const pendingVerifications = new Map()

const generateToken = (userId, isAdmin) => {
  return jwt.sign({ id: userId, isAdmin }, config.jwt.secret, {
    expiresIn: '90d', // keep it long for now
  })
}

const generateVerificationCode = () => {
  return randomBytes(3).toString('hex').toUpperCase()
}

export const register = async (req, res) => {
  try {
    const { email, password } = req.body

    const userExists = await UserModel.findOne({ email })
    if (userExists) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'User already exists',
      })
    }

    const verificationCode = generateVerificationCode()
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000)

    const tempId = new mongoose.Types.ObjectId()
    pendingVerifications.set(tempId.toString(), {
      email,
      password,
      verificationCode,
      verificationCodeExpires,
    })

    await sendVerificationEmail(email, verificationCode)

    res.status(StatusCodes.CREATED).json({
      message: 'Registration initiated. Please check your email for verification code.',
      tempUserId: tempId,
    })

    setTimeout(
      () => {
        pendingVerifications.delete(tempId.toString())
      },
      10 * 60 * 1000
    )
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to send verification email',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const verifyEmail = async (req, res) => {
  try {
    const { tempUserId, verificationCode } = req.body

    const pendingUser = pendingVerifications.get(tempUserId)

    if (!pendingUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Verification request not found or expired',
      })
    }

    if (pendingUser.verificationCodeExpires < Date.now()) {
      pendingVerifications.delete(tempUserId)
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Verification code expired',
      })
    }

    if (pendingUser.verificationCode !== verificationCode) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Invalid verification code',
      })
    }

    const user = await UserModel.create({
      email: pendingUser.email,
      password: pendingUser.password,
      isVerified: true,
    })

    pendingVerifications.delete(tempUserId)

    const token = generateToken(user._id)

    res.status(StatusCodes.OK).json({
      message: 'Email verified and registration completed',
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await UserModel.findOne({ email }).select('+password +isAdmin')
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Invalid credentials',
      })
    }

    if (!user.isVerified) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Please verify your email first',
      })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Invalid credentials',
      })
    }

    user.isAdmin = !!user.isAdmin

    const token = generateToken(user._id, user.isAdmin)

    res.status(StatusCodes.OK).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id)

    res.status(StatusCodes.OK).json({
      user: {
        id: user._id,
        email: user.email,
        isVerified: user.isVerified,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        profilePicture: user.profilePicture,
      },
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const updateProfile = async (req, res) => {
  const updateData = { ...req.body }

  try {
    const currentUser = await UserModel.findById(req.user._id)
    if (!currentUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'User not found',
      })
    }

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64')
      const dataURI = `data:${req.file.mimetype};base64,${b64}`

      if (currentUser.profilePicture) {
        const urlParts = currentUser.profilePicture.split('/')
        const filename = urlParts[urlParts.length - 1]
        const oldPublicId = `profiles/${filename.split('.')[0]}`

        try {
          await cloudinary.uploader.destroy(oldPublicId)
        } catch (error) {
          console.error('Error deleting old profile picture:', error)
        }
      }

      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: 'profiles',
        resource_type: 'auto',
      })

      updateData.profilePicture = uploadResult.secure_url
    }

    const user = await UserModel.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    })

    res.status(StatusCodes.OK).json({
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        profilePicture: user.profilePicture,
      },
    })
  } catch (error) {
    if (req.file && updateData.profilePicture) {
      const urlParts = updateData.profilePicture.split('/')
      const filename = urlParts[urlParts.length - 1]
      const publicId = `profiles/${filename.split('.')[0]}`

      try {
        await cloudinary.uploader.destroy(publicId)
      } catch (err) {
        console.error('Error cleaning up uploaded file:', err)
      }
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const deleteProfilePicture = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id)
    let publicId = null

    if (user.profilePicture) {
      const urlParts = user.profilePicture.split('/')
      const filename = urlParts[urlParts.length - 1]
      publicId = `profiles/${filename.split('.')[0]}`

      try {
        await cloudinary.uploader.destroy(publicId)
      } catch (error) {
        console.error('Error deleting profile picture:', error)
      }
    }

    user.profilePicture = ''
    await user.save()

    res.status(StatusCodes.OK).json({
      message: 'Profile picture deleted successfully',
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const logout = async (req, res) => {
  try {
    res.status(StatusCodes.OK).json({
      message: 'Successfully logged out',
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const deleteAccount = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id)

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'User not found',
      })
    }

    // Delete profile picture from Cloudinary if exists
    if (user.profilePicture) {
      const urlParts = user.profilePicture.split('/')
      const filename = urlParts[urlParts.length - 1]
      const publicId = `profiles/${filename.split('.')[0]}`

      try {
        await cloudinary.uploader.destroy(publicId)
      } catch (error) {
        console.error('Error deleting profile picture:', error)
      }
    }

    await ReviewModel.deleteMany({ user: user._id })

    await ReportModel.deleteMany({ user: user._id })

    await user.deleteOne()

    res.status(StatusCodes.OK).json({
      message: 'Account deleted successfully',
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const getUserCount = async (req, res) => {
  try {
    const count = await UserModel.countDocuments()
    res.status(StatusCodes.OK).json({
      count,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({})
      .select('_id email fullName phoneNumber gender profilePicture isVerified createdAt')
      .sort({ createdAt: -1 })

    res.status(StatusCodes.OK).json({
      users,
      count: users.length,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const updateUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params
    const updateData = { ...req.body }

    const user = await UserModel.findById(userId)
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'User not found',
      })
    }

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64')
      const dataURI = `data:${req.file.mimetype};base64,${b64}`

      if (user.profilePicture) {
        const urlParts = user.profilePicture.split('/')
        const filename = urlParts[urlParts.length - 1]
        const oldPublicId = `profiles/${filename.split('.')[0]}`

        try {
          await cloudinary.uploader.destroy(oldPublicId)
        } catch (error) {
          console.error('Error deleting old profile picture:', error)
        }
      }

      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: 'profiles',
        resource_type: 'auto',
      })

      updateData.profilePicture = uploadResult.secure_url
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('_id email fullName phoneNumber gender profilePicture isVerified isAdmin')

    res.status(StatusCodes.OK).json({
      message: 'User updated successfully',
      user: updatedUser,
    })
  } catch (error) {
    if (req.file && updateData?.profilePicture) {
      const urlParts = updateData.profilePicture.split('/')
      const filename = urlParts[urlParts.length - 1]
      const publicId = `profiles/${filename.split('.')[0]}`

      try {
        await cloudinary.uploader.destroy(publicId)
      } catch (err) {
        console.error('Error cleaning up uploaded file:', err)
      }
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const deleteUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await UserModel.findById(userId)
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'User not found',
      })
    }

    // Delete profile picture from Cloudinary if exists
    if (user.profilePicture) {
      const urlParts = user.profilePicture.split('/')
      const filename = urlParts[urlParts.length - 1]
      const publicId = `profiles/${filename.split('.')[0]}`

      try {
        await cloudinary.uploader.destroy(publicId)
      } catch (error) {
        console.error('Error deleting profile picture:', error)
      }
    }

    // Delete associated data
    await ReviewModel.deleteMany({ user: userId })
    await ReportModel.deleteMany({ user: userId })
    await user.deleteOne()

    res.status(StatusCodes.OK).json({
      message: 'User deleted successfully',
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}
