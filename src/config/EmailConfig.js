import sgMail from '@sendgrid/mail'
import { config } from './config.js'

sgMail.setApiKey(config.sendGrid.apiKey)

export const sendVerificationEmail = async (to, verificationCode) => {
  const msg = {
    to,
    from: config.sendGrid.sender,
    subject: 'Verify your ReadMe Account',
    text: `Your verification code is: ${verificationCode}. Valid for 10 minutes.`,
    html: `<strong>Your verification code is: ${verificationCode}</strong><br>Valid for 10 minutes.`,
  }

  try {
    const response = await sgMail.send(msg)
    return response
  } catch (error) {
    throw error
  }
}
