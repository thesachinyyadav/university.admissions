import type { NextApiRequest, NextApiResponse } from 'next';
import { sanitizePhoneNumber } from '@/lib/utils/formatting';

// Twilio will be initialized only if not in test mode
let twilioClient: any = null;

// Initialize Twilio client if in production mode
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
  program: string;
  instructions: string;
}

const ARRIVAL_TEMPLATE = `Hello {{name}},

You have arrived for the {{program}} admission process at CHRIST (Deemed to be University).

{{instructions}}

Office of Admissions`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, name, program, instructions }: SMSRequest = req.body;

    // Validate required fields
    if (!phone || !name || !program || !instructions) {
      return res.status(400).json({ 
        error: 'Missing required fields: phone, name, program, instructions' 
      });
    }

    // Sanitize phone number (extract last 10 digits)
    const sanitizedPhone = sanitizePhoneNumber(phone);

    if (sanitizedPhone.length !== 10) {
      return res.status(400).json({ 
        error: 'Invalid phone number. Must be 10 digits.' 
      });
    }

    // Format phone number for India (+91)
    const formattedPhone = `+91${sanitizedPhone}`;

    // Construct SMS message
    const message = ARRIVAL_TEMPLATE
      .replace('{{name}}', name.trim())
      .replace('{{program}}', program.trim())
      .replace('{{instructions}}', instructions.trim());

    // Test mode: Log to console instead of sending SMS
    if (process.env.NEXT_PUBLIC_TWILIO_TEST_MODE === 'true') {
      console.log('=== TWILIO TEST MODE - SMS LOG ===');
      console.log('To:', formattedPhone);
      console.log('Message:', message);
      console.log('Timestamp:', new Date().toISOString());
      console.log('==================================');

      return res.status(200).json({
        success: true,
        testMode: true,
        message: 'SMS logged (test mode)',
        to: formattedPhone,
        content: message
      });
    }

    // Production mode: Send actual SMS via Twilio
    if (!twilioClient) {
      throw new Error('Twilio client not initialized');
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('TWILIO_PHONE_NUMBER not configured');
    }

    const twilioMessage = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log('SMS sent successfully:', twilioMessage.sid);

    return res.status(200).json({
      success: true,
      testMode: false,
      messageSid: twilioMessage.sid,
      to: formattedPhone
    });

  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return res.status(500).json({
      error: 'Failed to send SMS',
      details: error.message
    });
  }
}
