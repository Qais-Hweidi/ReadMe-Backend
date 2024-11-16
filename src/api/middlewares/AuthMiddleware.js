import jwt from 'jsonwebtoken'
import { config } from '../../config/config.js'
import UserModel from '../models/UserModel.js'

export const protect = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      })
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret)
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
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}
