import express from 'express'
import { searchAll } from '../controllers/SearchController.js'

const router = express.Router()

// Public Routes
router.get('/all', searchAll)

export default router
