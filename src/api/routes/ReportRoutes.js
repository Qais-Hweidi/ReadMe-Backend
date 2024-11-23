import express from 'express'
import { createReport, getReports, updateReportStatus } from '../controllers/ReportController.js'
import { protect } from '../middlewares/AuthMiddleware.js'
import { validate } from '../middlewares/ValidateMiddleware.js'
import {
  createReportValidation,
  updateReportStatusValidation,
} from '../validations/ReportValidation.js'

const router = express.Router({ mergeParams: true })

router.post('/', protect, validate(createReportValidation), createReport)
router.get('/', protect, getReports)
router.patch(
  '/:reportId/status',
  protect,
  validate(updateReportStatusValidation),
  updateReportStatus
)

export default router
