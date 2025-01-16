import { ElevenLabsClient } from 'elevenlabs'
import { config } from '../../config/config.js'

class TextToSpeechService {
    constructor() {
      this.client = new ElevenLabsClient({
        apiKey: config.elevenlabs.apiKey
      })
    }
  
    async convertToSpeech(text, voiceId = 'Rachel') {
      try {
        if (!text || typeof text !== 'string') {
          throw new Error('Invalid text input')
        }
  
        const audioStream = await this.client.generate({
          voice: voiceId,
          model_id: 'eleven_turbo_v2_5',
          text: text.slice(0, 5000),
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
  
        const chunks = []
        for await (const chunk of audioStream) {
          chunks.push(chunk)
        }
        
        return Buffer.concat(chunks)
      } catch (error) {
        throw new Error('Failed to convert text to speech')
      }
    }
  }
  
  export default new TextToSpeechService()