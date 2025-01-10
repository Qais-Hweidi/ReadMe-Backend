import express from 'express';
import { BookSummaryController } from '../controllers/BookSummaryController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Request a summary for a book
router.post('/books/:bookId/summary', authenticateToken, BookSummaryController.requestSummary);

// Get the status of a summary request
router.get('/books/:bookId/summary', authenticateToken, BookSummaryController.getSummaryStatus);

export default router;
