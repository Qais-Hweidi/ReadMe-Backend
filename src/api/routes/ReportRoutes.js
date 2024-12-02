import express from 'express'
import { createReport, getReports, updateReportStatus } from '../controllers/ReportController.js'
import { protect, admin } from '../middlewares/AuthMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import {
  createReportValidation,
  updateReportStatusValidation,
} from '../validations/ReportValidation.js'

const router = express.Router({ mergeParams: true })

// User Routes (Protected)
router.post('/', protect, validate(createReportValidation), createReport)

// Admin Routes
router.get('/', protect, admin, getReports)
router.patch(
  '/:reportId/status',
  protect,
  admin,
  validate(updateReportStatusValidation),
  updateReportStatus
)

export default router
