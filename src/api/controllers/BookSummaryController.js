import { BookSummaryService } from '../services/BookSummaryService.js';
import { StatusCodes } from 'http-status-codes';

export class BookSummaryController {
    static async requestSummary(req, res) {
        try {
            const { bookId } = req.params;
            const result = await BookSummaryService.requestSummary(bookId);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            console.error('Error in requestSummary:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
                message: 'Error requesting summary',
                error: error.message 
            });
        }
    }

    static async getSummaryStatus(req, res) {
        try {
            const { bookId } = req.params;
            const status = await BookSummaryService.getSummaryStatus(bookId);
            res.status(StatusCodes.OK).json(status);
        } catch (error) {
            console.error('Error in getSummaryStatus:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
                message: 'Error getting summary status',
                error: error.message 
            });
        }
    }
}
