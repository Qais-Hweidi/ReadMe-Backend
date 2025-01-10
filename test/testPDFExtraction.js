import { testPDFExtraction } from '../src/utils/pdfExtractor.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use gorge.pdf as the test file
const pdfPath = path.join(__dirname, 'gorge.pdf');

async function runTest() {
    try {
        console.log('Starting PDF extraction test...');
        await testPDFExtraction(pdfPath);
        console.log('Test completed successfully');
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

runTest();
