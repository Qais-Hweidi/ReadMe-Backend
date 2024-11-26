import { config } from './config/config.js'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import authRoutes from './api/routes/UserRoutes.js'
import categoryRoutes from './api/routes/CategoryRoutes.js'
import bookRoutes from './api/routes/BookRoutes.js'
import authorRoutes from './api/routes/AuthorRoutes.js'
import reviewRoutes from './api/routes/ReviewRoutes.js'
import reportRoutes from './api/routes/ReportRoutes.js'
import searchRoutes from './api/routes/SearchRoutes.js'

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

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'readme-api' })
})

app.use((req, res, next) => {
  console.log(`Route not found: ${req.method} ${req.url}`)
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.url,
    method: req.method
  })
})

app.listen(config.port, () => {
  console.log(`Server running in ${config.env} mode on port ${config.port}`)
})
