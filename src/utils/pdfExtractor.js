import { PDFExtract } from 'pdf.js-extract';
const pdfExtract = new PDFExtract();

const CHUNK_SIZE = 4000; // approximately 1000 words per chunk

export async function extractTextFromPDF(pdfPath) {
    try {
        const data = await pdfExtract.extract(pdfPath);
        // Combine all pages text
        const text = data.pages.map(page => 
            page.content.map(item => item.str).join(' ')
        ).join('\n');
        return text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw error;
    }
}

export function splitIntoChunks(text, chunkSize = CHUNK_SIZE) {
    const words = text.split(/\s+/);
    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;

    for (const word of words) {
        if (currentSize + word.length > chunkSize) {
            chunks.push(currentChunk.join(' '));
            currentChunk = [];
            currentSize = 0;
        }
        currentChunk.push(word);
        currentSize += word.length + 1; // +1 for space
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }

    return chunks;
}

// Test function
export async function testPDFExtraction(pdfPath) {
    try {
        console.log('Reading PDF from:', pdfPath);
        const fullText = await extractTextFromPDF(pdfPath);
        const chunks = splitIntoChunks(fullText);
        
        console.log(`Total text length: ${fullText.length} characters`);
        console.log(`Split into ${chunks.length} chunks`);
        console.log('\nFirst chunk preview:', chunks[0].substring(0, 500) + '...');
        
        // Log size of each chunk
        chunks.forEach((chunk, index) => {
            console.log(`Chunk ${index + 1} size: ${chunk.length} characters`);
        });

        return { fullText, chunks };
    } catch (error) {
        console.error('Error in test:', error);
        throw error;
    }
}
