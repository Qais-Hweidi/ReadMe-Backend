import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import UserModel from '../models/UserModel.js'

const generateToken = userId => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '90d',
  })
}

export const register = async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if user already exists
    const userExists = await UserModel.findOne({ email })
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      })
    }

    // Create user
    const user = await UserModel.create({
      email,
      password,
    })

    const token = generateToken(user._id)

    res.status(201).json({
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
      error: error.message,
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user and select password (since password select is false by default)
    const user = await UserModel.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    // Generate token
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
      error: error.message,
    })
  }
}

export const getMe = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const user = await UserModel.findById(req.user._id)
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    })
  }
}
