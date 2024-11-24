import express from 'express'
import { searchAll } from '../controllers/SearchController.js'

const router = express.Router()

router.get('/all', searchAll)

export default router
