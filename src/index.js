import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { corsOptions } from './config/cors.js'
import { errorHandler } from './api/middlewares/errorHandler.js'
import connectDB from './config/database.js'
import authRoutes from './api/routes/AuthRoutes.js'

dotenv.config()
connectDB()

const app = express()

// Security Middleware
app.use(helmet())
app.use(cors(corsOptions))
app.use(morgan('dev'))

// Body Parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/v1/users', authRoutes)

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'readme-api' })
})

app.use(errorHandler)

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...')
  console.log(err.name, err.message)
  process.exit(1)
})