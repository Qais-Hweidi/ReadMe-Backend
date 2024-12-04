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
      
      const user = await UserModel.findById(decoded.id)
        .select('_id email fullName')
      
      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: 'User not found',
        })
      }

      user.isAdmin = !!decoded.isAdmin
      
      req.user = user
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
    if (!req.user || req.user.isAdmin !== true) {
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
