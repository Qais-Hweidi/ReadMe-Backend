import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { config } from '../config/config.js';

dotenv.config();

const anthropic = new Anthropic({
    apiKey: config.anthropicApiKey
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Rate limiting constants based on Anthropic's limits
const RATE_LIMITS = {
    REQUESTS_PER_MINUTE: 50,
    INPUT_TOKENS_PER_MINUTE: 50000,
    OUTPUT_TOKENS_PER_MINUTE: 10000
};

function cleanText(text) {
    return text
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/[""](?=[^"]*")/g, "'")
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .replace(/([.!?])\s+/g, '$1 ')
        .trim();
}

async function summarizeChunk(chunk, retries = 2, backoff = 1000, isDetailedSummary = false) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const prompt = isDetailedSummary
                ? `Write a detailed paragraph summarizing this text. Include key concepts, important details, and main ideas. Aim for 100-150 words. Use single quotes for titles and terms: ${chunk}`
                : `Write a comprehensive summary in about 600-700 words. Cover all major themes, key arguments, and important details. Maintain a coherent narrative flow. Use single quotes for titles and terms: ${chunk}`;

            const message = await anthropic.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: isDetailedSummary ? 400 : 1000,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });
            return cleanText(message.content[0].text);
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error.message);
            
            if (error.status === 429 || error.status === 529) {
                const retryAfter = error.headers?.['retry-after'] 
                    ? parseInt(error.headers['retry-after']) * 1000 
                    : backoff * Math.pow(2, attempt - 1);
                
                console.log(`Rate limited. Waiting ${retryAfter}ms before retry...`);
                await delay(retryAfter);
                
                if (attempt < retries) continue;
            }
            throw error;
        }
    }
}

async function processChunksWithRateLimit(chunks, progressCallback) {
    const summaries = [];
    let completed = 0;
    const total = chunks.length;
    
    // Process chunks one at a time with appropriate delays
    for (let i = 0; i < chunks.length; i++) {
        try {
            const summary = await summarizeChunk(chunks[i], 2, 1000, true);
            summaries.push(summary);
            completed++;
            
            if (progressCallback) {
                await progressCallback({
                    stage: 'chunk_summaries',
                    completed,
                    total
                });
            }
            
            // Wait between chunks to stay within rate limits
            await delay(2000); // 2 seconds between chunks
            
            // Additional delay every 5 chunks
            if ((i + 1) % 5 === 0) {
                await delay(5000); // 5 seconds extra delay every 5 chunks
            }
        } catch (error) {
            console.error(`Error processing chunk ${i + 1}:`, error);
            throw error;
        }
    }
    
    return summaries;
}

async function combineChunkSummaries(summaries) {
    // Split summaries into groups of 5 to avoid token limits
    const groups = [];
    for (let i = 0; i < summaries.length; i += 5) {
        groups.push(summaries.slice(i, i + 5));
    }
    
    // Process each group
    const groupSummaries = [];
    for (let i = 0; i < groups.length; i++) {
        const groupText = groups[i].join('\n\n');
        await delay(3000); // Wait between group processing
        const groupSummary = await summarizeChunk(groupText, 2, 1000, true);
        groupSummaries.push(groupSummary);
    }
    
    // Final combination
    await delay(5000); // Ensure we're within rate limits
    const finalSummary = await summarizeChunk(groupSummaries.join('\n\n'), 2, 1000, false);
    
    return cleanText(finalSummary)
        .split('\n\n')
        .map(para => para.trim())
        .filter(para => para.length > 0)
        .join('\n\n');
}

export async function generateBookSummary(chunks, options = {}) {
    try {
        console.log(`Starting summary generation for ${chunks.length} chunks`);
        
        // Process chunks with rate limiting
        const chunkSummaries = await processChunksWithRateLimit(chunks, options.progressCallback);
        
        // Combine summaries into final detailed summary
        console.log('Generating final summary...');
        const finalSummary = await combineChunkSummaries(chunkSummaries);
        
        return finalSummary;
    } catch (error) {
        console.error('Error in book summary generation:', error);
        throw error;
    }
}
