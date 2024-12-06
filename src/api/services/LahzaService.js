import axios from 'axios'
import { lahzaConfig } from '../../config/lahzaConfig.js'

class LahzaService {
  constructor() {
    this.client = axios.create({
      baseURL: lahzaConfig.apiUrl,
      headers: {
        Authorization: `Bearer ${lahzaConfig.secretKey}`,
        'Content-Type': 'application/json',
      },
    })
  }

  async initializeTransaction({
    amount,
    email,
    currency = 'USD',
    reference,
    callback_url,
    metadata = {},
  }) {
    try {
      const response = await this.client.post('/transaction/initialize', {
        amount: Math.round(amount * 100), // Convert to cents
        email,
        currency,
        reference,
        callback_url,
        metadata,
      })

      return response.data.data
    } catch (error) {
      throw new Error(`Failed to initialize transaction: ${error.message}`)
    }
  }

  async verifyTransaction(reference) {
    try {
      const response = await this.client.get(`/transaction/verify/${reference}`)
      return response.data.data
    } catch (error) {
      throw new Error(`Failed to verify transaction: ${error.message}`)
    }
  }
}

export default new LahzaService()
