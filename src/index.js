import { config } from './config/config.js'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import { StatusCodes } from 'http-status-codes'
import authRoutes from './api/routes/UserRoutes.js'
import categoryRoutes from './api/routes/CategoryRoutes.js'
import bookRoutes from './api/routes/BookRoutes.js'
import authorRoutes from './api/routes/AuthorRoutes.js'
import reviewRoutes from './api/routes/ReviewRoutes.js'
import reportRoutes from './api/routes/ReportRoutes.js'
import searchRoutes from './api/routes/SearchRoutes.js'
import readingHistoryRoutes from './api/routes/ReadingHistoryRoutes.js'
import favoriteRoutes from './api/routes/FavoriteRoutes.js'
import subscriptionPlanRoutes from './api/routes/SubscriptionPlanRoutes.js'
import subscriptionRoutes from './api/routes/subscriptionRoutes.js'

const app = express()

app.use(cors())
app.use(express.json())

mongoose
  .connect(config.db.uri)
  .then(() => {
    console.log('MongoDB Connected')
  })
  .catch(err => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })

app.use('/api/v1/authors', authorRoutes)
app.use('/api/v1/users', authRoutes)
app.use('/api/v1/categories', categoryRoutes)
app.use('/api/v1/books', bookRoutes)
app.use('/api/v1/books/:bookId/reviews', reviewRoutes)
app.use('/api/v1/books/:bookId/reports', reportRoutes)
app.use('/api/v1/search', searchRoutes)
app.use('/api/v1/reading-history', readingHistoryRoutes)
app.use('/api/v1/favorites', favoriteRoutes)
app.use('/api/v1/subscription-plans', subscriptionPlanRoutes)
app.use('/api/v1/subscriptions', subscriptionRoutes)

app.get('/health', (req, res) => {
  res.status(StatusCodes.OK).json({ status: 'ok', service: 'readme-api' })
})

app.use((req, res, next) => {
  console.log(`Route not found: ${req.method} ${req.url}`)
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
    path: req.url,
    method: req.method,
  })
})

app.listen(config.port, () => {
  console.log(`Server running in ${config.env} mode on port ${config.port}`)
})
