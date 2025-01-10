import { extractTextFromPDF, splitIntoChunks } from '../src/utils/pdfExtractor.js';
import { generateBookSummary } from '../src/utils/bookSummarizer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pdfPath = path.join(__dirname, 'gorge.pdf');

async function testSummarization() {
    try {
        console.log('Starting book summarization test...');
        
        // Extract and chunk the text
        console.log('Extracting text from PDF...');
        const fullText = await extractTextFromPDF(pdfPath);
        const chunks = splitIntoChunks(fullText);
        console.log(`Split book into ${chunks.length} chunks`);

        // Generate summary with progress tracking
        const summary = await generateBookSummary(chunks, {
            maxParallel: 3,
            progressCallback: (progress) => {
                switch (progress.stage) {
                    case 'chunk_summaries':
                        console.log(`Summarizing chunks: ${progress.completed}/${progress.total}`);
                        break;
                    case 'combining_summaries':
                        console.log(`Combining summaries: ${progress.completed}/${progress.total}`);
                        break;
                    case 'completed':
                        console.log('\nFinal Summary:');
                        console.log('=============');
                        console.log(progress.summary);
                        break;
                }
            }
        });

        return summary;
    } catch (error) {
        console.error('Error in summarization test:', error);
        throw error;
    }
}

testSummarization();
