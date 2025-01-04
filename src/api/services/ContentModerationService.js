import Anthropic from '@anthropic-ai/sdk'
import { config } from '../../config/config.js'

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
})

export const moderateContent = async content => {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Please analyze the following review content and determine if it contains any inappropriate language, curse words, hate speech, or offensive content. Respond with a JSON object containing:
          {
            "isAppropriate": boolean,
            "reason": string (only if isAppropriate is false, explaining what's inappropriate),
            "suggestedEdit": string (only if isAppropriate is false, suggesting a polite alternative)
          }
          
          Review content: "${content}"`,
        },
      ],
    })

    // Parse the JSON response
    const result = JSON.parse(message.content[0].text)
    return result
  } catch (error) {
    console.error('Content moderation error:', error)
    throw new Error('Failed to moderate content')
  }
}
