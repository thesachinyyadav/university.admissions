import type { NextApiRequest, NextApiResponse } from 'next';
import { sanitizePhoneNumber } from '@/lib/utils/formatting';

let twilioClient: any = null;

if (process.env.NEXT_PUBLIC_TWILIO_TEST_MODE !== 'true') {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
  }
}

interface SMSRequest {
  phone: string;
  name: string;
}

const COMPLETION_TEMPLATE = `Hello {{name}},

Your interview process at CHRIST (Deemed to be University) is now complete. Thank you for attending the selection process.

We wish you the very best!
Office of Admissions`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, name }: SMSRequest = req.body ?? {};

    if (!phone || !name) {
      return res.status(400).json({ error: 'Missing required fields: phone, name' });
    }

    const sanitizedPhone = sanitizePhoneNumber(phone);

    if (sanitizedPhone.length !== 10) {
      return res.status(400).json({ error: 'Invalid phone number. Must be 10 digits.' });
    }

    const formattedPhone = `+91${sanitizedPhone}`;
    const message = COMPLETION_TEMPLATE.replace('{{name}}', name.trim());

    if (process.env.NEXT_PUBLIC_TWILIO_TEST_MODE === 'true') {
      console.log('=== TWILIO TEST MODE - COMPLETION SMS ===');
      console.log('To:', formattedPhone);
      console.log('Message:', message);
      console.log('Timestamp:', new Date().toISOString());
      console.log('========================================');

      return res.status(200).json({
        success: true,
        testMode: true,
        message: 'SMS logged (test mode)',
        to: formattedPhone,
        content: message,
      });
    }

    if (!twilioClient) {
      throw new Error('Twilio client not initialized');
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('TWILIO_PHONE_NUMBER not configured');
    }

    const twilioMessage = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log('Interview completion SMS sent:', twilioMessage.sid);

    return res.status(200).json({
      success: true,
      testMode: false,
      messageSid: twilioMessage.sid,
      to: formattedPhone,
    });
  } catch (error: any) {
    console.error('Error sending interview completion SMS:', error);
    return res.status(500).json({
      error: 'Failed to send interview completion SMS',
      details: error.message,
    });
  }
}
