import jwt from 'jsonwebtoken'
import UserModel from '../models/UserModel.js'

export const protect = async (req, res, next) => {
  try {
    let token

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      })
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Add user to req object
      req.user = await UserModel.findById(decoded.id)
      next()
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    })
  }
}