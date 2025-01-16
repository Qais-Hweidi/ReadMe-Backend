import { extractTextFromPDF, splitIntoChunks } from '../../utils/pdfExtractor.js'
import { generateBookSummary } from '../../utils/bookSummarizer.js'
import TextToSpeechService from './TextToSpeechService.js'
import Book from '../models/BookModel.js'
import axios from 'axios'

export class BookSummaryService {
  static async requestSummary(bookId) {
    const book = await BookModel.findById(bookId)
    if (!book) {
      throw new Error('Book not found')
    }

    // Update summary status to processing
    book.summary = {
      ...book.summary,
      status: 'processing',
      lastUpdated: new Date(),
    }
    await book.save()

    try {
      // Generate audio from summary
      if (book.summary.content) {
        const audioBuffer = await TextToSpeechService.convertToSpeech(book.summary.content)

        // Store audio data or return it based on your requirements
        // For this example, we'll assume you want to return it directly
        book.summary.status = 'completed'
        book.summary.lastUpdated = new Date()
        await book.save()

        return {
          status: 'completed',
          audio: audioBuffer,
          summary: book.summary.content,
        }
      }

      return {
        status: 'processing',
        message: 'Summary generation in progress',
      }
    } catch (error) {
      // Update status to failed if there's an error
      book.summary.status = 'failed'
      book.summary.lastUpdated = new Date()
      await book.save()

      throw error
    }
  }
  static async downloadFromGoogleDrive(driveUrl) {
    try {
      console.log('Starting download from Google Drive:', driveUrl)

      // Extract file ID from Google Drive URL
      const fileId = driveUrl.match(/id=([^&]+)/)?.[1]
      if (!fileId) {
        throw new Error('Invalid Google Drive URL format')
      }

      // Construct direct download URL
      const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`

      const response = await axios({
        method: 'get',
        url: directUrl,
        responseType: 'arraybuffer',
        headers: {
          Accept: 'application/pdf',
        },
        maxContentLength: 50 * 1024 * 1024, // 50MB limit
      })

      console.log('Download completed, size:', response.data.length)
      return Buffer.from(response.data)
    } catch (error) {
      console.error('Error downloading from Google Drive:', error.message)
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response headers:', error.response.headers)
      }
      throw new Error(`Failed to download PDF: ${error.message}`)
    }
  }

  static async requestSummary(bookId) {
    try {
      const book = await Book.findById(bookId)
      if (!book) {
        throw new Error('Book not found')
      }

      // Check if summary already exists and is completed
      if (book.summary?.status === 'completed' && book.summary?.text) {
        return { message: 'Summary already exists', summary: book.summary.text }
      }

      // Check if the book link is a valid Google Drive link
      if (!book.bookLink?.includes('drive.google.com')) {
        throw new Error('Invalid book link: Must be a Google Drive link')
      }

      // Update status to pending
      book.summary = {
        status: 'pending',
        lastUpdated: new Date(),
      }
      await book.save()

      // Start the summary generation process
      this.generateSummaryAsync(book)

      return { message: 'Summary generation started' }
    } catch (error) {
      console.error('Error requesting summary:', error)
      throw error
    }
  }

  static async generateSummaryAsync(book) {
    try {
      // Update status to processing
      book.summary.status = 'processing'
      book.summary.lastUpdated = new Date()
      await book.save()

      console.log('Downloading PDF from Google Drive...')
      const pdfBuffer = await this.downloadFromGoogleDrive(book.bookLink)
      console.log('PDF downloaded successfully, size:', pdfBuffer.length)

      // Extract and generate summary
      console.log('Extracting text from PDF...')
      const text = await extractTextFromPDF(pdfBuffer)
      console.log('Text extracted successfully, length:', text.length)

      if (!text || text.length === 0) {
        throw new Error('No text could be extracted from the PDF')
      }

      console.log('Splitting text into chunks...')
      const chunks = splitIntoChunks(text)
      console.log(`Split into ${chunks.length} chunks`)

      console.log('Generating summary...')
      const summary = await generateBookSummary(chunks, {
        maxParallel: 2, // Reduce parallel requests to minimize API costs
        progressCallback: async progress => {
          if (progress.stage === 'chunk_summaries') {
            console.log(`Processing chunk ${progress.completed}/${progress.total}`)
            // Update progress in the database
            book.summary.lastUpdated = new Date()
            await book.save()
          }
        },
      })

      console.log('Summary generated successfully')

      // Update book with completed summary
      book.summary = {
        text: summary,
        status: 'completed',
        lastUpdated: new Date(),
      }
      await book.save()
    } catch (error) {
      console.error('Error generating summary:', error)
      // Update status to failed with error message
      book.summary = {
        status: 'failed',
        error: error.message,
        lastUpdated: new Date(),
      }
      await book.save()
    }
  }

  static async getSummaryStatus(bookId) {
    try {
      const book = await Book.findById(bookId)
      if (!book) {
        throw new Error('Book not found')
      }

      return {
        status: book.summary?.status || null,
        lastUpdated: book.summary?.lastUpdated || null,
        summary: book.summary?.status === 'completed' ? book.summary.text : null,
        error: book.summary?.error || null,
      }
    } catch (error) {
      console.error('Error getting summary status:', error)
      throw error
    }
  }
  static async getSummaryAudio(bookId) {
    try {
      const book = await Book.findById(bookId)
      if (!book) {
        throw new Error('Book not found')
      }

      if (!book.summary?.text) {
        throw new Error('No summary available for this book')
      }

      if (book.summary.status !== 'completed') {
        throw new Error(`Summary is not ready. Current status: ${book.summary.status}`)
      }

      const cleanText = book.summary.text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()

      if (!cleanText) {
        throw new Error('Summary text is empty after cleaning')
      }

      const audioBuffer = await TextToSpeechService.convertToSpeech(cleanText)

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('Generated audio buffer is empty')
      }

      return {
        audio: audioBuffer,
        bookTitle: book.title,
      }
    } catch (error) {
      console.error('Error in getSummaryAudio:', error.message)
      throw error
    }
  }
}
