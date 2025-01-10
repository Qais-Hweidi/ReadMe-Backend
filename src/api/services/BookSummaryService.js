import { extractTextFromPDF, splitIntoChunks } from '../../utils/pdfExtractor.js';
import { generateBookSummary } from '../../utils/bookSummarizer.js';
import Book from '../models/BookModel.js';
import axios from 'axios';

export class BookSummaryService {
    static async requestSummary(bookId) {
        try {
            const book = await Book.findById(bookId);
            if (!book) {
                throw new Error('Book not found');
            }

            // Check if summary already exists and is completed
            if (book.summary?.status === 'completed' && book.summary?.text) {
                return { message: 'Summary already exists', summary: book.summary.text };
            }

            // Update status to pending
            book.summary = {
                status: 'pending',
                lastUpdated: new Date()
            };
            await book.save();

            // Start the summary generation process
            this.generateSummaryAsync(book);

            return { message: 'Summary generation started' };
        } catch (error) {
            console.error('Error requesting summary:', error);
            throw error;
        }
    }

    static async generateSummaryAsync(book) {
        try {
            // Update status to processing
            book.summary.status = 'processing';
            book.summary.lastUpdated = new Date();
            await book.save();

            // Download PDF
            const response = await axios.get(book.bookLink, { responseType: 'arraybuffer' });
            const pdfBuffer = Buffer.from(response.data);

            // Extract and generate summary
            const text = await extractTextFromPDF(pdfBuffer);
            const chunks = splitIntoChunks(text);
            const summary = await generateBookSummary(chunks, {
                maxParallel: 2, // Reduce parallel requests to minimize API costs
                progressCallback: async (progress) => {
                    if (progress.stage === 'chunk_summaries') {
                        // Optionally update progress in the database
                        book.summary.lastUpdated = new Date();
                        await book.save();
                    }
                }
            });

            // Update book with completed summary
            book.summary = {
                text: summary,
                status: 'completed',
                lastUpdated: new Date()
            };
            await book.save();

        } catch (error) {
            console.error('Error generating summary:', error);
            // Update status to failed
            book.summary = {
                status: 'failed',
                lastUpdated: new Date()
            };
            await book.save();
        }
    }

    static async getSummaryStatus(bookId) {
        try {
            const book = await Book.findById(bookId);
            if (!book) {
                throw new Error('Book not found');
            }

            return {
                status: book.summary?.status || null,
                lastUpdated: book.summary?.lastUpdated || null,
                summary: book.summary?.status === 'completed' ? book.summary.text : null
            };
        } catch (error) {
            console.error('Error getting summary status:', error);
            throw error;
        }
    }
}
