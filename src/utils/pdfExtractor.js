import PDFParser from 'pdf2json';

// Reduce chunk size to stay within token limits (approximately 2000 tokens)
const CHUNK_SIZE = 3000;

export async function extractTextFromPDF(pdfBuffer) {
    return new Promise((resolve, reject) => {
        try {
            const pdfParser = new PDFParser();

            pdfParser.on('pdfParser_dataReady', (pdfData) => {
                try {
                    let text = '';
                    // Extract text from each page
                    pdfData.Pages.forEach(page => {
                        page.Texts.forEach(textItem => {
                            textItem.R.forEach(r => {
                                // Decode URI encoded text and replace special characters
                                const decodedText = decodeURIComponent(r.T)
                                    .replace(/\\/g, '')
                                    .replace(/\(|\)/g, '')
                                    .replace(/\s+/g, ' ');
                                text += decodedText + ' ';
                            });
                        });
                        text += '\n';
                    });

                    resolve(text.trim());
                } catch (error) {
                    reject(new Error(`Error processing PDF data: ${error.message}`));
                }
            });

            pdfParser.on('pdfParser_dataError', (error) => {
                reject(new Error(`Error parsing PDF: ${error.message}`));
            });

            // Load PDF from buffer
            pdfParser.parseBuffer(pdfBuffer);
        } catch (error) {
            reject(new Error(`Error initializing PDF parser: ${error.message}`));
        }
    });
}

export function splitIntoChunks(text, chunkSize = CHUNK_SIZE) {
    // Split by paragraphs first
    const paragraphs = text.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;

    for (const paragraph of paragraphs) {
        // Clean and normalize the paragraph
        const cleanParagraph = paragraph.trim().replace(/\s+/g, ' ');
        if (!cleanParagraph) continue; // Skip empty paragraphs

        const paragraphSize = cleanParagraph.length;
        
        if (currentSize + paragraphSize > chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.join('\n\n'));
            currentChunk = [];
            currentSize = 0;
        }
        
        currentChunk.push(cleanParagraph);
        currentSize += paragraphSize + 2; // +2 for paragraph separator
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n\n'));
    }

    return chunks;
}

// Test function
export async function testPDFExtraction(pdfBuffer) {
    try {
        console.log('Reading PDF from buffer');
        const fullText = await extractTextFromPDF(pdfBuffer);
        const chunks = splitIntoChunks(fullText);
        
        console.log(`Total text length: ${fullText.length} characters`);
        console.log(`Split into ${chunks.length} chunks`);
        console.log('First chunk preview:', chunks[0].substring(0, 100));
        
        return { fullText, chunks };
    } catch (error) {
        console.error('Error in testPDFExtraction:', error);
        throw error;
    }
}
