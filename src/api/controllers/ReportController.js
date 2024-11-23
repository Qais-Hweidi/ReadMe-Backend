import ReportModel from '../models/ReportModel.js'
import BookModel from '../models/BookModel.js'
import { config } from '../../config/config.js'

export const createReport = async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.bookId)
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      })
    }

    const report = await ReportModel.create({
      user: req.user._id,
      book: req.params.bookId,
      description: req.body.description,
    })

    const populatedReport = await ReportModel.findById(report._id)
      .populate('user', 'fullName email')
      .populate('book', 'title')

    res.status(201).json({
      success: true,
      report: populatedReport,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this book',
      })
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const getReports = async (req, res) => {
  try {
    const reports = await ReportModel.find()
      .populate('user', 'fullName email')
      .populate('book', 'title')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      reports,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}

export const updateReportStatus = async (req, res) => {
  try {
    const report = await ReportModel.findByIdAndUpdate(
      req.params.reportId,
      { status: req.body.status },
      { new: true, runValidators: true }
    )
      .populate('user', 'fullName email')
      .populate('book', 'title')

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      })
    }

    res.json({
      success: true,
      report,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: config.env === 'development' ? error.message : undefined,
    })
  }
}
