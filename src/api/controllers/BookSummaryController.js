import { BookSummaryService } from '../services/BookSummaryService.js'
import { StatusCodes } from 'http-status-codes'

export class BookSummaryController {
  static async requestSummary(req, res) {
    try {
      const { bookId } = req.params
      const result = await BookSummaryService.requestSummary(bookId)
      res.status(StatusCodes.OK).json(result)
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Error requesting summary',
        error: error.message,
      })
    }
  }

  static async getSummaryStatus(req, res) {
    try {
      const { bookId } = req.params
      const status = await BookSummaryService.getSummaryStatus(bookId)
      res.status(StatusCodes.OK).json(status)
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Error getting summary status',
        error: error.message,
      })
    }
  }

  static async getSummaryAudio(req, res) {
    try {
      const { bookId } = req.params
      const audioResult = await BookSummaryService.getSummaryAudio(bookId)

      if (!audioResult || !audioResult.audio) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'No audio generated',
        })
      }

      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Content-Disposition', `attachment; filename="summary-${bookId}.mp3"`)
      res.send(audioResult.audio)
    } catch (error) {
      if (error.message.includes('Book not found')) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Book not found',
        })
      }

      if (error.message.includes('No summary available')) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'No summary available for this book',
        })
      }

      if (error.message.includes('Summary is not ready')) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: error.message,
        })
      }

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Error generating audio summary',
        error: error.message,
      })
    }
  }
}
