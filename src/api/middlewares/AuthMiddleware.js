import jwt from 'jsonwebtoken'
import { config } from '../../config/config.js'
import UserModel from '../models/UserModel.js'
import { StatusCodes } from 'http-status-codes'

export const protect = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Not authorized to access this route',
      })
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret)
      req.user = await UserModel.findById(decoded.id)
      next()
    } catch (error) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Not authorized to access this route',
      })
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const admin = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    if (!req.user?.isAdmin) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'Admin access required for this route',
      })
    }
    next()
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}
