import express from 'express';
import { protect } from '../middlewares/AuthMiddleware.js';
import { BookSummaryController } from '../controllers/BookSummaryController.js';

const router = express.Router();

router.post('/books/:bookId/summary', protect, BookSummaryController.requestSummary);
router.get('/books/:bookId/summary', protect, BookSummaryController.getSummaryStatus);

export default router;
