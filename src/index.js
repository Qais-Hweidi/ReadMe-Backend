import express from 'express'
import dotenv from 'dotenv'
import connectDB from './config/database.js'

dotenv.config()

connectDB()

const app = express()

app.use(express.json())

// Testing route
app.get('/test', (req, res) => {
  res.status(200).json({ status: 'all good' })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...')
  console.log(err.name, err.message)
  process.exit(1)
})
