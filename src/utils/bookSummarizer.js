import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const CHUNK_SUMMARY_PROMPT = `Summarize this section of the book in 100 words, focusing on key events, themes, and character development. Section text:`;

const COMBINE_SUMMARIES_PROMPT = `Combine these section summaries into a coherent narrative that flows well. Keep the most important events and themes:`;

const FINAL_SUMMARY_PROMPT = `Create a final 600-word summary of the entire book, highlighting the main plot, themes, key moments, and character arcs. Make it engaging and coherent. Book summaries:`;

export async function summarizeChunk(chunk) {
    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            messages: [{
                role: 'user',
                content: `${CHUNK_SUMMARY_PROMPT}\n\n${chunk}`
            }]
        });
        return response.content[0].text;
    } catch (error) {
        console.error('Error summarizing chunk:', error);
        throw error;
    }
}

export async function combineSummaries(summaries) {
    try {
        const combinedText = summaries.join('\n\n');
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            messages: [{
                role: 'user',
                content: `${COMBINE_SUMMARIES_PROMPT}\n\n${combinedText}`
            }]
        });
        return response.content[0].text;
    } catch (error) {
        console.error('Error combining summaries:', error);
        throw error;
    }
}

export async function createFinalSummary(combinedSummaries) {
    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 2048,
            messages: [{
                role: 'user',
                content: `${FINAL_SUMMARY_PROMPT}\n\n${combinedSummaries}`
            }]
        });
        return response.content[0].text;
    } catch (error) {
        console.error('Error creating final summary:', error);
        throw error;
    }
}

export async function generateBookSummary(chunks, options = {}) {
    const {
        maxParallel = 3, // Maximum parallel API calls
        progressCallback = null // Optional callback for progress updates
    } = options;

    try {
        // Step 1: Summarize each chunk
        const chunkSummaries = [];
        for (let i = 0; i < chunks.length; i += maxParallel) {
            const batch = chunks.slice(i, i + maxParallel);
            const summaries = await Promise.all(batch.map(chunk => summarizeChunk(chunk)));
            chunkSummaries.push(...summaries);
            
            if (progressCallback) {
                progressCallback({
                    stage: 'chunk_summaries',
                    completed: chunkSummaries.length,
                    total: chunks.length
                });
            }
        }

        // Step 2: Combine summaries in groups
        const SUMMARIES_PER_GROUP = 10;
        const groupedSummaries = [];
        for (let i = 0; i < chunkSummaries.length; i += SUMMARIES_PER_GROUP) {
            const group = chunkSummaries.slice(i, i + SUMMARIES_PER_GROUP);
            const combinedGroup = await combineSummaries(group);
            groupedSummaries.push(combinedGroup);

            if (progressCallback) {
                progressCallback({
                    stage: 'combining_summaries',
                    completed: groupedSummaries.length,
                    total: Math.ceil(chunkSummaries.length / SUMMARIES_PER_GROUP)
                });
            }
        }

        // Step 3: Create final summary
        const finalSummary = await createFinalSummary(groupedSummaries.join('\n\n'));
        
        if (progressCallback) {
            progressCallback({
                stage: 'completed',
                summary: finalSummary
            });
        }

        return finalSummary;
    } catch (error) {
        console.error('Error in book summary generation:', error);
        throw error;
    }
}
