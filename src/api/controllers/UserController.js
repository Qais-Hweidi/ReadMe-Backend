import { randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import UserModel from '../models/UserModel.js'
import { sendVerificationEmail } from '../../config/EmailConfig.js'
import { config } from '../../config/config.js'

const pendingVerifications = new Map()

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.secret, {
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
      return res.status(400).json({
        success: false,
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

    res.status(201).json({
      success: true,
      message: 'Registration initiated. Please check your email for verification code.',
      tempUserId: tempId,
    })

    setTimeout(() => {
      pendingVerifications.delete(tempId.toString())
    }, 10 * 60 * 1000)

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email',
      error: config.env === 'development' ? error.message : undefined
    })
  }
}

export const verifyEmail = async (req, res) => {
  try {
    const { tempUserId, verificationCode } = req.body

    const pendingUser = pendingVerifications.get(tempUserId)
    
    if (!pendingUser) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found or expired',
      })
    }

    if (pendingUser.verificationCodeExpires < Date.now()) {
      pendingVerifications.delete(tempUserId)
      return res.status(400).json({
        success: false,
        message: 'Verification code expired',
      })
    }

    if (pendingUser.verificationCode !== verificationCode) {
      return res.status(400).json({
        success: false,
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

    res.json({
      success: true,
      message: 'Email verified and registration completed',
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await UserModel.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first',
      })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    const token = generateToken(user._id)

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined
    })
  }
}

export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id)
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined
    })
  }
}